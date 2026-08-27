// ============================================================
// PadelIndex — Match melden, ausstehende Matches, Bestätigen
// ============================================================
//
// Schreiben läuft bewusst über service_role (wie claims.ts) statt über
// RLS-INSERT-Policies: die Validierung (vier verschiedene Spieler, alle
// Vereinsmitglied, atomarer Write über create_match_report()) ist
// regelbasiert genug, dass sie in TypeScript + einer SQL-Funktion besser
// aufgehoben ist als in Policy-Ausdrücken.
//
// Lesen von "meine ausstehenden Matches" läuft dagegen über den
// Session-Client (RLS: matches_participant_read/plays_in_match) — dafür
// reicht die bestehende Policy, kein Admin-Client nötig. Namen der
// Mitspieler müssen danach trotzdem per Admin-Client aufgelöst werden,
// weil RLS auf players nur die eigene Zeile freigibt (siehe
// 0005_claimable_profiles.sql) — erst NACH Bestätigung, dass die
// anfragende Person selbst Teilnehmer ist.

import type { SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { formatPlayerName, matchClaimName } from '$lib/claim-match';
import { confirmMatchByPlayer } from './rating/confirm';
import { validateMatchReport, type MatchReportInput } from '$lib/match-report';
import { matchReportedEmail } from '$lib/notifications';
import { sendEmail, type EmailEnv } from './email';
import { startProfileClaim } from './claims';

export type PlayerClub = { id: string; slug: string; name: string };

/** clubs + club_memberships sind öffentlich lesbar (RLS "using (true)") — Session-Client reicht. */
export async function loadPlayerClub(
	supabase: SupabaseClient,
	playerId: string
): Promise<PlayerClub | null> {
	const { data, error: err } = await supabase
		.from('club_memberships')
		.select('clubs(id, slug, name)')
		.eq('player_id', playerId)
		.limit(1)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) return null;
	return (data as unknown as { clubs: PlayerClub | null }).clubs;
}

export type RosterPlayer = {
	id: string;
	handle: string;
	name: string;
	claimed: boolean;
};

/**
 * Kader für die Spieler-Auswahl beim Melden — alle Mitglieder, alphabetisch.
 * Braucht zwingend den Admin-Client: der Join zu players zeigt fremde
 * Zeilen, die RLS für den Session-Client blockieren würde (players_self_select).
 */
export async function loadClubRoster(
	admin: SupabaseClient,
	clubId: string
): Promise<RosterPlayer[]> {
	const { data, error: err } = await admin
		.from('club_memberships')
		.select('players!inner(id, handle, display_name, claim_status, show_full_name)')
		.eq('club_id', clubId);

	if (err) throw error(500, err.message);

	const rows = (data ?? []).map(
		(row) =>
			(
				row as unknown as {
					players: {
						id: string;
						handle: string;
						display_name: string;
						claim_status: string;
						show_full_name: boolean;
					};
				}
			).players
	);

	return rows
		.map((p) => ({
			id: p.id,
			handle: p.handle,
			name: formatPlayerName(p.display_name, p.claim_status, p.show_full_name),
			claimed: p.claim_status === 'claimed'
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export type ReportResult = { ok: true; matchId: string } | { ok: false; message: string };

export async function createMatchReport(
	admin: SupabaseClient,
	clubId: string,
	input: MatchReportInput & { playedAt: string },
	emailEnv: EmailEnv | null,
	kontoUrl: string,
	invite?: {
		clubSlug: string;
		origin: string;
		platform?: App.Platform;
		shadowPlayers: NewShadowPlayer[];
	}
): Promise<ReportResult> {
	const validation = validateMatchReport(input);
	if (!validation.ok) return validation;

	const { data, error: rpcErr } = await admin.rpc('create_match_report', {
		p_club_id: clubId,
		p_reporter_id: input.reporterId,
		p_partner_id: input.partnerId,
		p_opponent1_id: input.opponent1Id,
		p_opponent2_id: input.opponent2Id,
		p_played_at: input.playedAt,
		p_sets: input.sets.map((s) => ({ team1_games: s.team1Games, team2_games: s.team2Games })),
		p_match_type: input.matchType
	});

	if (rpcErr) return { ok: false, message: rpcErr.message };
	const matchId = data as string;

	await notifyOpponentsOfPendingMatch(admin, emailEnv, input, kontoUrl);

	if (invite && invite.shadowPlayers.length > 0) {
		await inviteShadowPlayers(
			invite.clubSlug,
			invite.shadowPlayers,
			invite.origin,
			invite.platform
		);
	}

	return { ok: true, matchId };
}

// ============================================================
// Shadow-Profile beim Melden: unregistrierte Mitspieler auf die Schnelle
// ============================================================
// Ein Slot (Partner/Gegner) kommt vom Formular entweder als ausgewählte
// Spieler-ID aus dem Kader ODER als frei eingetippter Name (+ optionale
// E-Mail) für jemanden, der noch kein Profil hat. Auflösung läuft VOR
// createMatchReport(), weil create_match_report() (0006) eine echte
// players.id für alle vier Positionen braucht.

export type MatchPlayerSlot = { existingId: string; typedName: string; email: string };
export type NewShadowPlayer = { handle: string; email: string };

type ResolvedSlot =
	| { kind: 'existing'; id: string }
	| { kind: 'created'; id: string; handle: string; displayName: string; email: string | null };

type SlotResolveResult = { ok: true; player: ResolvedSlot } | { ok: false; message: string };

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

/**
 * Dedupliziert gegen den VOLLEN Klarnamen-Bestand des Vereins (nicht die im
 * UI aus Datenschutzgründen abgekürzten Anzeigenamen, siehe
 * public_display_name() in 0005_claimable_profiles.sql) — sonst könnte ein
 * Tippfehler denselben Menschen doppelt anlegen, nur weil sein Name auf dem
 * Formular selbst abgekürzt dargestellt wird. rosterCandidates enthält
 * zusätzlich bereits in DIESER Anfrage neu angelegte Slots (siehe
 * resolveMatchPlayerSlots), damit zwei gleich benannte "neue" Positionen im
 * selben Formular nicht zwei Profile für dieselbe Person erzeugen.
 */
async function resolveMatchPlayerSlot(
	admin: SupabaseClient,
	clubId: string,
	slot: MatchPlayerSlot,
	rosterCandidates: { id: string; displayName: string }[]
): Promise<SlotResolveResult> {
	if (slot.existingId) return { ok: true, player: { kind: 'existing', id: slot.existingId } };

	const name = slot.typedName.trim();
	if (!name) return { ok: false, message: 'Bitte alle Mitspieler angeben.' };
	if (name.length > 120) return { ok: false, message: 'Name ist zu lang.' };

	const hit = matchClaimName(name, rosterCandidates);
	if (hit) return { ok: true, player: { kind: 'existing', id: hit.match.id } };

	const email = slot.email.trim();
	if (email && !EMAIL_PATTERN.test(email)) {
		return { ok: false, message: `Ungültige E-Mail-Adresse für "${name}".` };
	}

	const { data, error: rpcErr } = await admin
		.rpc('create_shadow_player', { p_club_id: clubId, p_display_name: name })
		.single();
	if (rpcErr || !data) {
		return { ok: false, message: rpcErr?.message ?? 'Profil konnte nicht angelegt werden.' };
	}

	const row = data as { id: string; handle: string };
	return {
		ok: true,
		player: {
			kind: 'created',
			id: row.id,
			handle: row.handle,
			displayName: name,
			email: email || null
		}
	};
}

export type ResolveMatchSlotsResult =
	| {
			ok: true;
			ids: { partnerId: string; opponent1Id: string; opponent2Id: string };
			shadowPlayers: NewShadowPlayer[];
	  }
	| { ok: false; message: string };

/**
 * Löst die drei Nicht-Melder-Positionen (Partner, Gegner 1, Gegner 2) auf —
 * legt dabei bei Bedarf neue Shadow-Profile an. Reihenfolge ist bewusst
 * sequenziell (nicht Promise.all): jede bereits in diesem Aufruf neu
 * angelegte Position fließt als zusätzlicher Dedupe-Kandidat in die
 * nächste ein (siehe resolveMatchPlayerSlot).
 */
export async function resolveMatchPlayerSlots(
	admin: SupabaseClient,
	clubId: string,
	slots: { partner: MatchPlayerSlot; opponent1: MatchPlayerSlot; opponent2: MatchPlayerSlot }
): Promise<ResolveMatchSlotsResult> {
	const { data: members, error: err } = await admin
		.from('club_memberships')
		.select('players!inner(id, display_name)')
		.eq('club_id', clubId);
	if (err) return { ok: false, message: err.message };

	const candidates = (members ?? [])
		.map((row) => (row as unknown as { players: { id: string; display_name: string } }).players)
		.map((p) => ({ id: p.id, displayName: p.display_name }));

	const ids: Record<'partner' | 'opponent1' | 'opponent2', string> = {
		partner: '',
		opponent1: '',
		opponent2: ''
	};
	const shadowPlayers: NewShadowPlayer[] = [];

	for (const key of ['partner', 'opponent1', 'opponent2'] as const) {
		const result = await resolveMatchPlayerSlot(admin, clubId, slots[key], candidates);
		if (!result.ok) return { ok: false, message: result.message };

		ids[key] = result.player.id;
		if (result.player.kind === 'created') {
			candidates.push({ id: result.player.id, displayName: result.player.displayName });
			if (result.player.email) {
				shadowPlayers.push({ handle: result.player.handle, email: result.player.email });
			}
		}
	}

	return {
		ok: true,
		ids: { partnerId: ids.partner, opponent1Id: ids.opponent1, opponent2Id: ids.opponent2 },
		shadowPlayers
	};
}

/**
 * Best-effort, wie notifyOpponentsOfPendingMatch: ein Einladungsfehler darf
 * das bereits erfolgreich gemeldete Match nicht nachträglich als
 * fehlgeschlagen erscheinen lassen. Nutzt bewusst denselben Magic-Link-
 * Claim wie die Self-Service-Seite /c/[slug]/beanspruchen
 * (startProfileClaim aus claims.ts) statt eines eigenen Token-Schemas —
 * das frisch angelegte Profil ist ja bereits genau das unbeanspruchte
 * Profil, das startProfileClaim sonst erst über die Namenssuche finden
 * müsste.
 */
async function inviteShadowPlayers(
	clubSlug: string,
	players: NewShadowPlayer[],
	origin: string,
	platform: App.Platform | undefined
): Promise<void> {
	for (const p of players) {
		try {
			await startProfileClaim(clubSlug, p.handle, p.email, origin, platform);
		} catch (e) {
			console.error('Einladung für neues Schatten-Profil fehlgeschlagen', e);
		}
	}
}

/**
 * Nur die Gegenseite (team2) kann das Match bestätigen (siehe confirm.ts),
 * also braucht auch nur sie eine Benachrichtigung — ohne sie merkt man
 * ein gemeldetes Match sonst erst nach der automatischen 48h-Bestätigung.
 * Best-effort: läuft nie auf einen Fehler hinaus, der das erfolgreich
 * angelegte Match nachträglich als fehlgeschlagen erscheinen ließe.
 */
async function notifyOpponentsOfPendingMatch(
	admin: SupabaseClient,
	emailEnv: EmailEnv | null,
	input: MatchReportInput,
	kontoUrl: string
): Promise<void> {
	try {
		const { data: players, error: err } = await admin
			.from('players')
			.select('id, display_name, claim_status, show_full_name, user_id')
			.in('id', [input.reporterId, input.partnerId, input.opponent1Id, input.opponent2Id]);
		if (err || !players) return;

		const byId = new Map(players.map((p) => [p.id, p]));
		const nameOf = (id: string) => {
			const p = byId.get(id);
			if (!p) return '?';
			return formatPlayerName(p.display_name, p.claim_status, p.show_full_name);
		};

		const { subject, html } = matchReportedEmail({
			reporterName: nameOf(input.reporterId),
			partnerName: nameOf(input.partnerId),
			sets: input.sets,
			kontoUrl
		});

		for (const opponentId of [input.opponent1Id, input.opponent2Id]) {
			const userId = byId.get(opponentId)?.user_id;
			if (!userId) continue;
			const { data: userRes } = await admin.auth.admin.getUserById(userId);
			const email = userRes?.user?.email;
			if (!email) continue;
			await sendEmail(emailEnv, { to: email, subject, html });
		}
	} catch (e) {
		console.error('Benachrichtigung für gemeldetes Match fehlgeschlagen', e);
	}
}

export type PendingMatch = {
	id: string;
	playedAt: string;
	confirmDeadline: string;
	myTeam: 1 | 2;
	canConfirm: boolean;
	/** true = diese Person hat das Match gemeldet — sieht "Ablehnen" nie (siehe disputeMatchAsPlayer). */
	isReporter: boolean;
	team1: { name: string; claimed: boolean }[];
	team2: { name: string; claimed: boolean }[];
	sets: { team1Games: number; team2Games: number }[];
};

/**
 * Ausstehende Matches der eingeloggten Person. `supabase` ist der
 * Session-Client (RLS-gültig für die eigenen Teilnahmen), `admin`
 * nur zum Auflösen der Mitspieler-Namen — erst nachdem RLS bereits
 * bestätigt hat, dass die Person selbst dabei ist.
 */
export async function loadPendingMatches(
	supabase: SupabaseClient,
	admin: SupabaseClient,
	playerId: string
): Promise<PendingMatch[]> {
	const { data: myRows, error: myErr } = await supabase
		.from('match_participants')
		.select('match_id, team')
		.eq('player_id', playerId);
	if (myErr) throw error(500, myErr.message);

	const matchIds = (myRows ?? []).map((r) => r.match_id);
	if (matchIds.length === 0) return [];

	const { data: matches, error: matchErr } = await supabase
		.from('matches')
		.select('id, played_at, confirm_deadline, status, reported_by')
		.in('id', matchIds)
		.eq('status', 'pending');
	if (matchErr) throw error(500, matchErr.message);
	if (!matches || matches.length === 0) return [];

	const pendingIds = matches.map((m) => m.id);
	const myTeamByMatch = new Map((myRows ?? []).map((r) => [r.match_id, r.team as 1 | 2]));

	const [{ data: participants, error: partErr }, { data: sets, error: setsErr }] =
		await Promise.all([
			admin
				.from('match_participants')
				.select(
					'match_id, player_id, team, confirmed, players(display_name, claim_status, show_full_name)'
				)
				.in('match_id', pendingIds),
			supabase
				.from('match_sets')
				.select('match_id, set_number, team1_games, team2_games')
				.in('match_id', pendingIds)
		]);
	if (partErr) throw error(500, partErr.message);
	if (setsErr) throw error(500, setsErr.message);

	return matches.map((m) => {
		const myTeam = myTeamByMatch.get(m.id) ?? 1;
		const mine = (participants ?? []).filter((p) => p.match_id === m.id);
		const toEntry = (p: (typeof mine)[number]) => {
			const player = p.players as unknown as {
				display_name: string;
				claim_status: string;
				show_full_name: boolean;
			} | null;
			const name = player
				? formatPlayerName(player.display_name, player.claim_status, player.show_full_name)
				: '?';
			return { name, claimed: player?.claim_status === 'claimed' };
		};

		const reporterTeam = mine.find((p) => p.player_id === m.reported_by)?.team;
		const myOwnRow = mine.find((p) => p.player_id === playerId);
		// Nur die Gegenseite des Melders kann bestätigen (siehe confirm.ts:
		// "hat mindestens ein Spieler des Gegnerteams bestätigt?"). Auf der
		// eigenen Team-Seite bringt ein Klick nichts, das UI soll das gar
		// nicht erst anbieten.
		const canConfirm = myTeam !== reporterTeam && myOwnRow?.confirmed !== true;

		return {
			id: m.id,
			playedAt: m.played_at,
			confirmDeadline: m.confirm_deadline,
			myTeam,
			canConfirm,
			isReporter: playerId === m.reported_by,
			team1: mine.filter((p) => p.team === 1).map(toEntry),
			team2: mine.filter((p) => p.team === 2).map(toEntry),
			sets: (sets ?? [])
				.filter((s) => s.match_id === m.id)
				.sort((a, b) => a.set_number - b.set_number)
				.map((s) => ({ team1Games: s.team1_games, team2Games: s.team2_games }))
		};
	});
}

export type ConfirmResult = { ok: true; confirmed: boolean } | { ok: false; message: string };

/**
 * Prüft zuerst per Admin-Client, ob die aufrufende Person überhaupt
 * Teilnehmer ist (klare Fehlermeldung statt stillem No-Op — die update()
 * in confirmMatchByPlayer selbst würde bei falscher player_id einfach
 * null Zeilen treffen, ohne Fehler zu werfen).
 */
export async function confirmMatchAsPlayer(
	admin: SupabaseClient,
	matchId: string,
	playerId: string
): Promise<ConfirmResult> {
	const { data: participant, error: partErr } = await admin
		.from('match_participants')
		.select('player_id')
		.eq('match_id', matchId)
		.eq('player_id', playerId)
		.maybeSingle();

	if (partErr) return { ok: false, message: partErr.message };
	if (!participant) return { ok: false, message: 'Kein Teilnehmer dieses Matches.' };

	const result = await confirmMatchByPlayer(admin, matchId, playerId);
	return { ok: true, confirmed: result.confirmed };
}

/**
 * Ein Teilnehmer lehnt ein noch unbestätigtes Match ab — löscht die
 * gemeldete Zeile, bevor die 48h-Frist automatisch ein Rating anwendet.
 * Wichtig für die eigene "Partner"-Seite des Melders: die kann bisher gar
 * nicht bestätigen (canConfirm prüft nur die Gegenseite, siehe
 * loadPendingMatches), hatte aber bislang KEINE Möglichkeit, ein falsch
 * gemeldetes Match (falscher Name, falsches Ergebnis) zu verhindern —
 * ohne Widerspruch lief es nach 48h einfach durch. Der Melder selbst
 * kann sein eigenes Match nicht "ablehnen" (hat es ja bewusst gemeldet);
 * ein Tippfehler dort braucht weiterhin den Vereins-Admin
 * (cancelPendingMatch).
 */
export async function disputeMatchAsPlayer(
	admin: SupabaseClient,
	matchId: string,
	playerId: string
): Promise<CancelResult> {
	const { data: match, error: mErr } = await admin
		.from('matches')
		.select('reported_by, status')
		.eq('id', matchId)
		.maybeSingle();
	if (mErr) return { ok: false, message: mErr.message };
	if (!match || match.status !== 'pending') {
		return { ok: false, message: 'Match nicht gefunden oder bereits bestätigt.' };
	}
	if (match.reported_by === playerId) {
		return { ok: false, message: 'Du kannst dein eigenes gemeldetes Match nicht ablehnen.' };
	}

	const { data: participant, error: partErr } = await admin
		.from('match_participants')
		.select('player_id')
		.eq('match_id', matchId)
		.eq('player_id', playerId)
		.maybeSingle();
	if (partErr) return { ok: false, message: partErr.message };
	if (!participant) return { ok: false, message: 'Kein Teilnehmer dieses Matches.' };

	const { data, error: err } = await admin
		.from('matches')
		.delete()
		.eq('id', matchId)
		.eq('status', 'pending')
		.select('id');
	if (err) return { ok: false, message: err.message };
	if (!data || data.length === 0) {
		return { ok: false, message: 'Match nicht gefunden oder bereits bestätigt.' };
	}
	return { ok: true };
}

// ============================================================
// Vereins-Admin: ausstehende Matches einsehen & stornieren
// ============================================================
// Bewusst nur "pending" — bei einem bereits bestätigten Match wäre
// Stornieren eine Rating-Rückrechnung (mu/sigma/Token wieder abziehen,
// inklusive aller danach gespielten Matches, deren Ausgangswerte sich
// dadurch ändern). Für "Verwechslung/Tippfehler direkt nach dem Melden"
// reicht das einfache Löschen einer noch unbestätigten Zeile.

export type ClubPendingMatch = {
	id: string;
	playedAt: string;
	confirmDeadline: string;
	team1: { name: string; claimed: boolean }[];
	team2: { name: string; claimed: boolean }[];
	sets: { team1Games: number; team2Games: number }[];
};

/** Für /verein/[slug] — alle ausstehenden Matches DIESES Vereins, unabhängig von der eigenen Teilnahme. */
export async function loadClubPendingMatches(
	admin: SupabaseClient,
	clubId: string
): Promise<ClubPendingMatch[]> {
	const { data: matches, error: matchErr } = await admin
		.from('matches')
		.select('id, played_at, confirm_deadline')
		.eq('club_id', clubId)
		.eq('status', 'pending')
		.order('played_at', { ascending: false });
	if (matchErr) throw error(500, matchErr.message);
	if (!matches || matches.length === 0) return [];

	const matchIds = matches.map((m) => m.id);
	const [{ data: participants, error: partErr }, { data: sets, error: setsErr }] =
		await Promise.all([
			admin
				.from('match_participants')
				.select('match_id, team, players(display_name, claim_status, show_full_name)')
				.in('match_id', matchIds),
			admin
				.from('match_sets')
				.select('match_id, set_number, team1_games, team2_games')
				.in('match_id', matchIds)
		]);
	if (partErr) throw error(500, partErr.message);
	if (setsErr) throw error(500, setsErr.message);

	return matches.map((m) => {
		const mine = (participants ?? []).filter((p) => p.match_id === m.id);
		const toEntry = (p: (typeof mine)[number]) => {
			const player = p.players as unknown as {
				display_name: string;
				claim_status: string;
				show_full_name: boolean;
			} | null;
			const name = player
				? formatPlayerName(player.display_name, player.claim_status, player.show_full_name)
				: '?';
			return { name, claimed: player?.claim_status === 'claimed' };
		};

		return {
			id: m.id,
			playedAt: m.played_at,
			confirmDeadline: m.confirm_deadline,
			team1: mine.filter((p) => p.team === 1).map(toEntry),
			team2: mine.filter((p) => p.team === 2).map(toEntry),
			sets: (sets ?? [])
				.filter((s) => s.match_id === m.id)
				.sort((a, b) => a.set_number - b.set_number)
				.map((s) => ({ team1Games: s.team1_games, team2Games: s.team2_games }))
		};
	});
}

export type CancelResult = { ok: true } | { ok: false; message: string };

/** club_id und status='pending' im WHERE — ein bereits bestätigtes oder fremdes Match darf hier nie greifen. */
export async function cancelPendingMatch(
	admin: SupabaseClient,
	clubId: string,
	matchId: string
): Promise<CancelResult> {
	const { data, error: err } = await admin
		.from('matches')
		.delete()
		.eq('id', matchId)
		.eq('club_id', clubId)
		.eq('status', 'pending')
		.select('id');

	if (err) return { ok: false, message: err.message };
	if (!data || data.length === 0) {
		return { ok: false, message: 'Match nicht gefunden oder bereits bestätigt.' };
	}
	return { ok: true };
}
