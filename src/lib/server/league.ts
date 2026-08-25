// ============================================================
// PadelIndex — Liga-Modul: Datenzugriff
// ============================================================
// Übersetzt zwischen den league_*-Tabellen (0016) und den reinen
// Funktionen in $lib/league/box-americano. Die Rechenlogik steht
// bewusst NICHT hier, damit sie ohne Datenbank testbar bleibt.
//
// Fast alles läuft über den Admin-Client: match_sets und
// match_participants sind per RLS auf Beteiligte beschränkt, eine
// öffentliche Ligatabelle braucht sie aber vollständig. Namen kommen
// ausschließlich aus der View league_box_lineup, die dieselbe
// Anonymisierung anwendet wie club_leaderboard.

import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	BOX_AMERICANO_4_DEFAULTS,
	computeBoxStandings,
	cyclePhase as computeCyclePhase,
	isBoxComplete,
	proposePromotions,
	roundPairings,
	type BoxLeagueConfig,
	type BoxMatchResult,
	type BoxMatchStatus,
	type BoxStanding,
	type CyclePhase,
	type PromotionDirection,
	type PromotionProposal
} from '$lib/league/box-americano';
import { formatPlayerName } from '$lib/claim-match';
import { postSystemMessage } from '$lib/server/chat';
import {
	notifySubstituteAssigned,
	notifySubstituteJoined,
	type LeagueNotifyContext
} from '$lib/server/league-notifications';

// Für die Systemnachricht "Termin wurde auf ... Uhr geändert" bei
// playerScheduleRound/assignRoundSlot — dieselbe Kurzform wie fmtSlot()
// auf der Box-Detailseite.
const scheduleChatFmt = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	month: '2-digit',
	hour: '2-digit',
	minute: '2-digit'
});

function scheduleChatMessage(scheduledAt: string, court: string | null): string {
	const when = scheduleChatFmt.format(new Date(scheduledAt));
	return court
		? `Termin wurde auf ${when} Uhr geändert (${court}).`
		: `Termin wurde auf ${when} Uhr geändert.`;
}

export type League = {
	id: string;
	clubId: string | null;
	/** Name des Trägervereins — für die "hier steigst du ein"-CTA auf der Ligaseite. */
	clubName: string | null;
	/** Slug des Trägervereins — für den Rücksprung zwischen Vereins- und Liga-Verwaltung. */
	clubSlug: string | null;
	name: string;
	slug: string;
	format: string;
	config: BoxLeagueConfig;
};

export type Cycle = {
	id: string;
	ordinal: number;
	name: string | null;
	startDate: string;
	endDate: string;
	status: 'planned' | 'running' | 'completed';
};

export type BoxPlayer = {
	playerId: string;
	seat: number;
	name: string;
	handle: string | null;
	role: 'regular' | 'substitute';
	/** Für die Ersatzspieler-Vorschlagslogik (Warteliste nach Spielstärke). */
	rating: number;
};

export type BoxRound = {
	id: string;
	roundNumber: number;
	status: BoxMatchStatus;
	matchId: string | null;
	/** Sitze, nicht Spieler-IDs — die Anzeige löst über lineup auf. */
	team1: [number, number];
	team2: [number, number];
	sets: { team1Games: number; team2Games: number }[];
	/** Bestätigt im Sinne des normalen Match-Flows (48h-Frist). */
	confirmed: boolean;
	winnerTeam: 1 | 2 | null;
	note: string | null;
	isReplacement: boolean;
	scheduledAt: string | null;
	court: string | null;
	/** true = vom Admin vergeben, false + scheduledAt gesetzt = Spieler haben sich selbst geeinigt. */
	assignedByAdmin: boolean;
	scheduledByName: string | null;
	/** Gesetzt, wenn ein Spieler-Termin einen früheren Admin-Slot verdrängt hat (siehe 0022). */
	previousScheduledAt: string | null;
	previousCourt: string | null;
};

export type BoxView = {
	id: string;
	ladderPosition: number;
	label: string | null;
	scheduledAt: string | null;
	court: string | null;
	lineup: BoxPlayer[];
	rounds: BoxRound[];
	standings: BoxStanding[];
	complete: boolean;
};

/** leagues.config ist jsonb — fehlende Schlüssel fallen auf die Defaults zurück. */
function readConfig(raw: unknown): BoxLeagueConfig {
	const c = (raw ?? {}) as Record<string, unknown>;
	const num = (key: string, fallback: number) =>
		typeof c[key] === 'number' ? (c[key] as number) : fallback;
	const d = BOX_AMERICANO_4_DEFAULTS;
	return {
		boxSize: num('box_size', d.boxSize),
		rounds: num('rounds', d.rounds),
		pointsPerWin: num('points_per_win', d.pointsPerWin),
		promote: num('promote', d.promote),
		relegate: num('relegate', d.relegate),
		relegateTopBox: num('relegate_top_box', d.relegateTopBox),
		promoteBottomBox: num('promote_bottom_box', d.promoteBottomBox),
		tiebreakers: Array.isArray(c.tiebreakers)
			? (c.tiebreakers as BoxLeagueConfig['tiebreakers'])
			: d.tiebreakers,
		selfServiceWeeks: num('self_service_weeks', d.selfServiceWeeks)
	};
}

export async function loadLeague(sb: SupabaseClient, slug: string): Promise<League | null> {
	const { data, error: err } = await sb
		.from('leagues')
		.select('id, club_id, name, slug, format, config, clubs(name, slug)')
		.eq('slug', slug)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) return null;

	const club = data.clubs as unknown as { name: string; slug: string } | null;
	return {
		id: data.id,
		clubId: data.club_id,
		clubName: club?.name ?? null,
		clubSlug: club?.slug ?? null,
		name: data.name,
		slug: data.slug,
		format: data.format,
		config: readConfig(data.config)
	};
}

/**
 * Für /konto: welche Liga (falls vorhanden) gehört zum eigenen Verein.
 * Ein Verein kann später mehrere haben — hier bewusst nur die erste
 * aktive, mehr braucht die Profilseite aktuell nicht.
 */
export async function loadLeagueForClub(
	sb: SupabaseClient,
	clubId: string
): Promise<League | null> {
	const { data, error: err } = await sb
		.from('leagues')
		.select('id, club_id, name, slug, format, config, clubs(name, slug)')
		.eq('club_id', clubId)
		.eq('status', 'active')
		.limit(1)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) return null;

	const club = data.clubs as unknown as { name: string; slug: string } | null;
	return {
		id: data.id,
		clubId: data.club_id,
		clubName: club?.name ?? null,
		clubSlug: club?.slug ?? null,
		name: data.name,
		slug: data.slug,
		format: data.format,
		config: readConfig(data.config)
	};
}

export type LeagueRegistrationStatus = 'active' | 'waitlist' | 'substitute' | 'left';

/**
 * Eigener Registrierungsstatus für /konto — null heißt "noch nie
 * registriert". Braucht den ADMIN-Client: league_registrations hat
 * bewusst keine RLS-Policy (siehe 0016), auch nicht "eigene Zeile
 * lesbar" — dieselbe Begründung wie bei match_sets/match_participants,
 * die Autorisierung passiert in TypeScript, nicht per Policy.
 */
export async function loadOwnRegistration(
	admin: SupabaseClient,
	leagueId: string,
	playerId: string
): Promise<LeagueRegistrationStatus | null> {
	const { data, error: err } = await admin
		.from('league_registrations')
		.select('status')
		.eq('league_id', leagueId)
		.eq('player_id', playerId)
		.maybeSingle();

	if (err) throw error(500, err.message);
	return (data?.status as LeagueRegistrationStatus | undefined) ?? null;
}

/**
 * Selbstständig auf die Warteliste — nie direkt "active": ein echter
 * Box-Sitz ist immer eine Zuteilung durch den Vereins-Admin (siehe
 * league-admin.ts createBox/addBoxMember), nicht etwas, das man sich
 * selbst gibt. Erneutes Beitreten nach einem Austritt aktualisiert die
 * bestehende Zeile (unique league_id+player_id) statt eine zweite
 * anzulegen.
 */
export async function joinLeagueWaitlist(
	admin: SupabaseClient,
	leagueId: string,
	playerId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const current = await loadOwnRegistration(admin, leagueId, playerId);
	if (current !== null && current !== 'left') {
		return { ok: false, message: 'Du bist schon registriert.' };
	}

	if (current === 'left') {
		const { error: err } = await admin
			.from('league_registrations')
			.update({ status: 'waitlist', joined_at: new Date().toISOString(), left_at: null })
			.eq('league_id', leagueId)
			.eq('player_id', playerId);
		if (err) return { ok: false, message: err.message };
		return { ok: true };
	}

	const { error: err } = await admin
		.from('league_registrations')
		.insert({ league_id: leagueId, player_id: playerId, status: 'waitlist' });
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

/** Für die Zuordnungs-UI: wer ist in diesem Zyklus schon EINER Box zugeteilt? */
export async function listAssignedPlayerIds(
	admin: SupabaseClient,
	cycleId: string
): Promise<Set<string>> {
	const { data: boxes } = await admin.from('league_boxes').select('id').eq('cycle_id', cycleId);
	const boxIds = (boxes ?? []).map((b) => b.id);
	if (boxIds.length === 0) return new Set();

	const { data: members } = await admin
		.from('league_box_members')
		.select('player_id')
		.in('box_id', boxIds);
	return new Set((members ?? []).map((m) => m.player_id));
}

/**
 * Ein Spieler verlässt die Liga mitten im Zyklus — sowohl vom Admin
 * ausgelöst (mit Ersatz aus der Warteliste, siehe verwaltung/spieler)
 * als auch selbstständig über /konto (immer ohne Ersatz: wer selbst
 * geht, weist niemandem seinen Sitz zu, das bleibt dem Admin
 * überlassen). Deckt zwei Fälle ab:
 *   - saß gerade in keiner Box (z. B. direkt von der Warteliste ausgetreten)
 *     -> nur die Registrierung wird auf 'left' gesetzt.
 *   - saß in einer Box -> der Sitz wird frei; optional übernimmt
 *     replacementPlayerId ihn sofort als Ersatz (role='substitute',
 *     replaces_player_id gesetzt, für Transparenz in der Aufstellung).
 *
 * Bereits gespielte Runden bleiben unangetastet — die liegen in
 * matches/match_participants und kennen league_box_members gar nicht.
 * Deshalb ist hier, anders als bei league-admin.ts removeBoxMember(),
 * eine Box MIT gemeldeten Ergebnissen ausdrücklich der Normalfall.
 */
export async function departLeagueMember(
	admin: SupabaseClient,
	params: {
		leagueId: string;
		departingPlayerId: string;
		replacementPlayerId: string | null;
	},
	/** Optional: löst Benachrichtigungen an Ersatz + verbleibende Box aus, wenn gesetzt. */
	notifyCtx?: LeagueNotifyContext
): Promise<{ ok: true } | { ok: false; message: string }> {
	const { data: membership } = await admin
		.from('league_box_members')
		.select('box_id, seat, league_boxes!inner(cycle_id)')
		.eq('player_id', params.departingPlayerId)
		.maybeSingle();

	const box = membership
		? {
				boxId: membership.box_id,
				seat: membership.seat,
				cycleId: (membership.league_boxes as unknown as { cycle_id: string }).cycle_id
			}
		: null;

	if (box && params.replacementPlayerId) {
		const assigned = await listAssignedPlayerIds(admin, box.cycleId);
		if (assigned.has(params.replacementPlayerId)) {
			return {
				ok: false,
				message: 'Diese Person spielt in diesem Zyklus bereits in einer anderen Box.'
			};
		}

		const { count: openRounds } = await admin
			.from('league_box_matches')
			.select('id', { count: 'exact', head: true })
			.eq('box_id', box.boxId)
			.eq('status', 'scheduled');
		if (!openRounds) {
			return {
				ok: false,
				message:
					'Diese Box hat keine offene Runde mehr — ein Ersatz würde hier nichts mehr betreffen.'
			};
		}
	}

	if (box) {
		const { error: delErr } = await admin
			.from('league_box_members')
			.delete()
			.eq('box_id', box.boxId)
			.eq('player_id', params.departingPlayerId);
		if (delErr) return { ok: false, message: delErr.message };

		if (params.replacementPlayerId) {
			const { error: insErr } = await admin.from('league_box_members').insert({
				box_id: box.boxId,
				player_id: params.replacementPlayerId,
				seat: box.seat,
				role: 'substitute',
				replaces_player_id: params.departingPlayerId
			});
			if (insErr) return { ok: false, message: insErr.message };
		}
	}

	const { error: leftErr } = await admin
		.from('league_registrations')
		.update({ status: 'left', left_at: new Date().toISOString() })
		.eq('league_id', params.leagueId)
		.eq('player_id', params.departingPlayerId);
	if (leftErr) return { ok: false, message: leftErr.message };

	if (params.replacementPlayerId) {
		const { error: activeErr } = await admin
			.from('league_registrations')
			.update({ status: 'active' })
			.eq('league_id', params.leagueId)
			.eq('player_id', params.replacementPlayerId);
		if (activeErr) return { ok: false, message: activeErr.message };
	}

	// Benachrichtigung ist best-effort und darf den bereits erfolgreichen
	// Sitzwechsel nicht mehr rückgängig machen — deshalb erst ganz am
	// Ende, nach allen Schreib-Operationen, und ohne deren Fehler zu
	// prüfen (notifySubstituteAssigned/-Joined werfen selbst nie).
	if (box && params.replacementPlayerId && notifyCtx) {
		await notifyAboutSubstitution(admin, notifyCtx, {
			boxId: box.boxId,
			replacementPlayerId: params.replacementPlayerId,
			departingPlayerId: params.departingPlayerId
		});
	}

	return { ok: true };
}

/** Lädt Box-Label, verbleibende Mitglieder und den Namen des Ersatzes, dann feuert beide Benachrichtigungen. */
async function notifyAboutSubstitution(
	admin: SupabaseClient,
	ctx: LeagueNotifyContext,
	params: { boxId: string; replacementPlayerId: string; departingPlayerId: string }
): Promise<void> {
	try {
		const { data: box } = await admin
			.from('league_boxes')
			.select('label, ladder_position')
			.eq('id', params.boxId)
			.maybeSingle();
		const boxLabel = box?.label ?? `Box ${box?.ladder_position ?? ''}`.trim();

		const { data: members } = await admin
			.from('league_box_members')
			.select('player_id')
			.eq('box_id', params.boxId)
			.neq('player_id', params.replacementPlayerId);
		const remainingPlayerIds = (members ?? [])
			.map((m) => m.player_id)
			.filter((id) => id !== params.departingPlayerId);

		const { data: sub } = await admin
			.from('players')
			.select('display_name, claim_status, show_full_name')
			.eq('id', params.replacementPlayerId)
			.maybeSingle();
		const substituteName = sub
			? formatPlayerName(sub.display_name, sub.claim_status, sub.show_full_name)
			: 'Ein Ersatzspieler';

		await notifySubstituteAssigned(admin, ctx, {
			substitutePlayerId: params.replacementPlayerId,
			boxId: params.boxId,
			boxLabel
		});
		if (remainingPlayerIds.length > 0) {
			await notifySubstituteJoined(admin, ctx, {
				playerIds: remainingPlayerIds,
				boxId: params.boxId,
				boxLabel,
				substituteName
			});
		}
	} catch (e) {
		console.error('Benachrichtigung zur Auswechselung fehlgeschlagen', e);
	}
}

/**
 * Der Zyklus, den die Ligaseite zeigt: der laufende, sonst der zuletzt
 * abgeschlossene. Ohne Zyklus gibt es schlicht nichts anzuzeigen.
 */
export async function loadCurrentCycle(
	sb: SupabaseClient,
	leagueId: string,
	cycleId?: string
): Promise<Cycle | null> {
	let query = sb
		.from('league_cycles')
		.select('id, ordinal, name, start_date, end_date, status, league_seasons!inner(league_id)')
		.eq('league_seasons.league_id', leagueId);

	query = cycleId
		? query.eq('id', cycleId)
		: query.in('status', ['running', 'completed']).order('ordinal', { ascending: false }).limit(1);

	const { data, error: err } = await query.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) return null;

	return {
		id: data.id,
		ordinal: data.ordinal,
		name: data.name,
		startDate: data.start_date,
		endDate: data.end_date,
		status: data.status
	};
}

type LineupRow = {
	box_id: string;
	seat: number;
	role: 'regular' | 'substitute';
	player_id: string;
	name: string;
	handle: string | null;
	rating: number;
};

/**
 * Alle Boxen eines Zyklus mit Aufstellung, Runden und fertig gerechneter
 * Tabelle. Die Standings entstehen hier über computeBoxStandings() — es
 * gibt keine gespeicherte Tabelle, die veralten könnte.
 */
export async function loadLadder(
	admin: SupabaseClient,
	cycleId: string,
	config: BoxLeagueConfig
): Promise<BoxView[]> {
	const { data: boxes, error: bErr } = await admin
		.from('league_boxes')
		.select('id, ladder_position, label, scheduled_at, court')
		.eq('cycle_id', cycleId)
		.order('ladder_position');

	if (bErr) throw error(500, bErr.message);
	if (!boxes || boxes.length === 0) return [];

	const boxIds = boxes.map((b) => b.id);

	const { data: lineupRows, error: lErr } = await admin
		.from('league_box_lineup')
		.select('box_id, seat, role, player_id, name, handle, rating')
		.in('box_id', boxIds);
	if (lErr) throw error(500, lErr.message);

	const { data: roundRows, error: rErr } = await admin
		.from('league_box_matches')
		.select(
			`id, box_id, round_number, status, match_id, winner_team, note, is_replacement,
			 scheduled_at, court, match_assigned_by_admin, scheduled_by,
			 previous_scheduled_at, previous_court,
			 matches ( status, match_participants ( player_id, team ),
			           match_sets ( set_number, team1_games, team2_games ) )`
		)
		.in('box_id', boxIds)
		.order('round_number');
	if (rErr) throw error(500, rErr.message);

	const lineupByBox = new Map<string, BoxPlayer[]>();
	for (const row of (lineupRows ?? []) as LineupRow[]) {
		const list = lineupByBox.get(row.box_id) ?? [];
		list.push({
			playerId: row.player_id,
			seat: row.seat,
			name: row.name,
			handle: row.handle,
			role: row.role,
			rating: Number(row.rating)
		});
		lineupByBox.set(row.box_id, list);
	}

	// scheduled_by zeigt auf einen Spieler (Admin oder Box-Mitglied) — für
	// die Anzeige "von X vergeben/eingetragen" brauchen wir dessen Namen,
	// unabhängig davon, ob die Person in DIESER Box sitzt (ein Admin muss
	// kein Box-Mitglied sein).
	const scheduledByIds = [
		...new Set(
			((roundRows ?? []) as Record<string, any>[])
				.map((r) => r.scheduled_by as string | null)
				.filter((id): id is string => id !== null)
		)
	];
	const scheduledByName = new Map<string, string>();
	if (scheduledByIds.length > 0) {
		const { data: byRows } = await admin
			.from('players')
			.select('id, display_name, claim_status, show_full_name')
			.in('id', scheduledByIds);
		for (const p of byRows ?? []) {
			scheduledByName.set(p.id, formatPlayerName(p.display_name, p.claim_status, p.show_full_name));
		}
	}

	const roundsByBox = new Map<string, BoxRound[]>();
	for (const row of (roundRows ?? []) as Record<string, any>[]) {
		const seatOf = new Map(
			(lineupByBox.get(row.box_id) ?? []).map((p) => [p.playerId, p.seat] as const)
		);

		// Ohne gemeldetes Ergebnis steht die Paarung noch aus der Rotation.
		const planned = roundPairings(config.boxSize).find((p) => p.roundNumber === row.round_number);
		let team1: [number, number] = planned ? planned.team1 : [0, 0];
		let team2: [number, number] = planned ? planned.team2 : [0, 0];

		const m = row.matches as Record<string, any> | null;
		if (m?.match_participants) {
			const seats = (t: number) =>
				(m.match_participants as { player_id: string; team: number }[])
					.filter((p) => p.team === t)
					.map((p) => seatOf.get(p.player_id) ?? 0);
			const s1 = seats(1);
			const s2 = seats(2);
			if (s1.length === 2 && s2.length === 2) {
				team1 = [s1[0], s1[1]];
				team2 = [s2[0], s2[1]];
			}
		}

		const sets = ((m?.match_sets ?? []) as Record<string, number>[])
			.slice()
			.sort((a, b) => a.set_number - b.set_number)
			.map((s) => ({ team1Games: s.team1_games, team2Games: s.team2_games }));

		const list = roundsByBox.get(row.box_id) ?? [];
		list.push({
			id: row.id,
			roundNumber: row.round_number,
			status: row.status,
			matchId: row.match_id,
			team1,
			team2,
			sets,
			confirmed: m?.status === 'confirmed',
			winnerTeam: (row.winner_team as 1 | 2 | null) ?? null,
			note: row.note ?? null,
			isReplacement: row.is_replacement ?? false,
			scheduledAt: row.scheduled_at ?? null,
			court: row.court ?? null,
			assignedByAdmin: row.match_assigned_by_admin ?? false,
			scheduledByName: row.scheduled_by ? (scheduledByName.get(row.scheduled_by) ?? null) : null,
			previousScheduledAt: row.previous_scheduled_at ?? null,
			previousCourt: row.previous_court ?? null
		});
		roundsByBox.set(row.box_id, list);
	}

	return boxes.map((b) => {
		const lineup = (lineupByBox.get(b.id) ?? []).sort((x, y) => x.seat - y.seat);
		const rounds = (roundsByBox.get(b.id) ?? []).sort((x, y) => x.roundNumber - y.roundNumber);

		const forStandings: BoxMatchResult[] = rounds.map((r) => ({
			roundNumber: r.roundNumber,
			team1: r.team1,
			team2: r.team2,
			sets: r.sets,
			status: r.status,
			winnerTeam: r.winnerTeam
		}));

		return {
			id: b.id,
			ladderPosition: b.ladder_position,
			label: b.label,
			scheduledAt: b.scheduled_at,
			court: b.court,
			lineup,
			rounds,
			standings: computeBoxStandings(
				lineup.map((p) => p.seat),
				forStandings,
				config
			),
			complete: isBoxComplete(forStandings, config)
		};
	});
}

/**
 * Ergebnis einer Runde melden. Die Paarung kommt aus der Rotation, nicht
 * aus dem Formular — so kann niemand über ein manipuliertes Formular ein
 * anderes Team eintragen, als in dieser Runde dran ist.
 */
export async function reportBoxResult(
	admin: SupabaseClient,
	params: {
		boxMatchId: string;
		reporterId: string;
		sets: { team1_games: number; team2_games: number }[];
	}
): Promise<string> {
	const { data: round, error: rErr } = await admin
		.from('league_box_matches')
		.select('id, box_id, round_number, status')
		.eq('id', params.boxMatchId)
		.maybeSingle();

	if (rErr) throw error(500, rErr.message);
	if (!round) throw error(404, 'Diese Runde gibt es nicht.');

	const { data: members, error: mErr } = await admin
		.from('league_box_members')
		.select('player_id, seat')
		.eq('box_id', round.box_id);
	if (mErr) throw error(500, mErr.message);

	const playerBySeat = new Map((members ?? []).map((m) => [m.seat, m.player_id] as const));
	const pairing = roundPairings().find((p) => p.roundNumber === round.round_number);
	if (!pairing) throw error(400, 'Für diese Runde gibt es keine Paarung.');

	const resolve = (seats: [number, number]) =>
		seats.map((s) => {
			const id = playerBySeat.get(s);
			if (!id) throw error(409, 'Die Box ist nicht vollständig besetzt.');
			return id;
		});

	const { data, error: cErr } = await admin.rpc('create_league_box_result', {
		p_box_match_id: params.boxMatchId,
		p_reporter_id: params.reporterId,
		p_team1: resolve(pairing.team1),
		p_team2: resolve(pairing.team2),
		p_sets: params.sets
	});

	if (cErr) throw error(400, cErr.message);
	return data as string;
}

// ------------------------------------------------------------
// Auf- und Abstieg
// ------------------------------------------------------------

export type PromotionRow = PromotionProposal & {
	playerName: string;
	/** Bereits gespeicherter Beschluss, falls vorhanden. */
	saved: 'proposed' | 'applied' | 'rejected' | null;
};

/**
 * Rechnet den Vorschlag für den Zyklus und reichert ihn mit Namen an.
 * Schreibt nichts — bis ein Admin bestätigt, existiert der Vorschlag nur
 * als Anzeige.
 */
export async function loadPromotionProposal(
	admin: SupabaseClient,
	cycleId: string,
	config: BoxLeagueConfig
): Promise<PromotionRow[]> {
	const ladder = await loadLadder(admin, cycleId, config);
	if (ladder.length === 0) return [];

	const nameOf = new Map<string, string>();
	for (const box of ladder) for (const p of box.lineup) nameOf.set(p.playerId, p.name);

	const proposals = proposePromotions(
		ladder.map((box) => {
			const seatToPlayer = new Map(box.lineup.map((p) => [p.seat, p.playerId] as const));
			return {
				boxId: box.id,
				ladderPosition: box.ladderPosition,
				complete: box.complete,
				standings: box.standings
					.filter((s) => seatToPlayer.has(s.seat))
					.map((s) => ({ playerId: seatToPlayer.get(s.seat)!, rank: s.rank }))
			};
		}),
		config
	);

	const { data: saved, error: sErr } = await admin
		.from('league_promotions')
		.select('player_id, status')
		.eq('cycle_id', cycleId);
	if (sErr) throw error(500, sErr.message);

	const savedBy = new Map(
		(saved ?? []).map((r) => [r.player_id, r.status as PromotionRow['saved']])
	);

	return proposals.map((p) => ({
		...p,
		playerName: nameOf.get(p.playerId) ?? 'Unbekannt',
		saved: savedBy.get(p.playerId) ?? null
	}));
}

/**
 * Wendet manuelle Overrides auf den berechneten Vorschlag an, BEVOR er
 * geprüft/festgeschrieben wird. Ein Override ersetzt direction und
 * toLadderPosition vollständig und räumt eine etwaige Warnung ab — der
 * Admin übernimmt damit ausdrücklich die Verantwortung für genau diesen
 * Fall (z. B. eine punktgleiche Grenze oder eine unvollständige Box).
 * toLadderPosition folgt derselben Nachbar-Box-Logik wie
 * proposePromotions() selbst (rauf = -1, runter = +1, bleibt = gleich).
 */
function applyPromotionOverrides(
	rows: PromotionRow[],
	overrides: Map<string, PromotionDirection>
): PromotionRow[] {
	return rows.map((row) => {
		const direction = overrides.get(row.playerId);
		if (!direction) return row;
		const toLadderPosition =
			direction === 'up'
				? row.fromLadderPosition - 1
				: direction === 'down'
					? row.fromLadderPosition + 1
					: row.fromLadderPosition;
		return { ...row, direction, toLadderPosition, warning: undefined };
	});
}

export type ApplyPromotionsResult =
	{ ok: true; count: number } | { ok: false; blocked: PromotionRow[] };

/**
 * Bestätigt den Vorschlag: schreibt ihn als 'applied' fest. Bewusst nur
 * ein Protokoll — die Boxen des Folgezyklus baut ein Admin daraus, das
 * ist kein automatischer Schritt.
 *
 * overrides lässt den Admin einzelne Zeilen VOR dem Festschreiben
 * manuell korrigieren (z. B. eine Warnung auflösen oder einen
 * Standardvorschlag bewusst übersteuern) — ohne Override gilt der
 * berechnete Vorschlag unverändert. Bleibt nach den Overrides noch eine
 * Warnung übrig, wird NICHTS festgeschrieben (alles oder nichts, wie
 * bisher), und die betroffenen Zeilen kommen als "blocked" zurück.
 */
export async function applyPromotionProposal(
	admin: SupabaseClient,
	cycleId: string,
	decidedBy: string,
	config: BoxLeagueConfig,
	overrides: Map<string, PromotionDirection> = new Map()
): Promise<ApplyPromotionsResult> {
	const base = await loadPromotionProposal(admin, cycleId, config);
	const rows = applyPromotionOverrides(base, overrides);

	const blocked = rows.filter((r) => r.warning);
	if (blocked.length > 0) return { ok: false, blocked };

	const movable = rows.filter((r) => r.direction !== 'stay');
	if (movable.length === 0) return { ok: true, count: 0 };

	const { error: err } = await admin.from('league_promotions').upsert(
		movable.map((r) => ({
			cycle_id: cycleId,
			player_id: r.playerId,
			from_box_id: r.fromBoxId,
			from_rank: r.fromRank,
			to_ladder_position: r.toLadderPosition,
			direction: r.direction,
			status: 'applied',
			decided_by: decidedBy,
			decided_at: new Date().toISOString()
		})),
		{ onConflict: 'cycle_id,player_id' }
	);

	if (err) throw error(500, err.message);
	return { ok: true, count: movable.length };
}

// ------------------------------------------------------------
// Termine & Plätze je Runde (6-Wochen-Regel)
// ------------------------------------------------------------
// Woche 1 bis config.selfServiceWeeks: Spieler tragen ihren Termin
// selbst ein (playerScheduleRound). Danach vergibt der Admin die
// restlichen offenen Runden (assignRoundSlot). Reine Datumslogik dazu:
// cyclePhase() in box-americano.ts.

export { computeCyclePhase as cyclePhase };
export type { CyclePhase };

export type ScheduleWriteResult = { ok: true } | { ok: false; message: string };

async function loadRoundForScheduling(admin: SupabaseClient, boxMatchId: string) {
	const { data, error: err } = await admin
		.from('league_box_matches')
		.select('id, status, scheduled_at, court, match_assigned_by_admin')
		.eq('id', boxMatchId)
		.maybeSingle();
	if (err) throw error(500, err.message);
	return data;
}

/** Admin vergibt Platz &amp; Zeit für eine Runde (Woche 4-6). */
export async function assignRoundSlot(
	admin: SupabaseClient,
	boxMatchId: string,
	params: { scheduledAt: string; court: string | null; adminPlayerId: string }
): Promise<ScheduleWriteResult> {
	const round = await loadRoundForScheduling(admin, boxMatchId);
	if (!round) return { ok: false, message: 'Runde nicht gefunden.' };
	if (round.status !== 'scheduled') {
		return { ok: false, message: 'Diese Runde ist bereits gewertet — kein Termin mehr nötig.' };
	}

	const { error: err } = await admin
		.from('league_box_matches')
		.update({
			scheduled_at: params.scheduledAt,
			court: params.court,
			match_assigned_by_admin: true,
			scheduled_by: params.adminPlayerId,
			previous_scheduled_at: null,
			previous_court: null
		})
		.eq('id', boxMatchId);
	if (err) return { ok: false, message: err.message };

	await postSystemMessage(
		admin,
		'league_box_match',
		boxMatchId,
		scheduleChatMessage(params.scheduledAt, params.court)
	);

	return { ok: true };
}

/**
 * Ein Box-Mitglied trägt einen eigenständig vereinbarten Termin ein
 * (Woche 1-3, oder als Sonderfall auch danach). Autorisierung
 * (ist der/die Aufrufende Mitglied DIESER Box?) prüft der Aufrufer, wie
 * bei reportBoxResult — hier nur die Datenintegrität.
 *
 * Verdrängt der neue Termin einen bereits vom Admin vergebenen Slot,
 * wird der alte Slot NICHT verworfen, sondern in previous_scheduled_at/
 * previous_court geparkt — das Dashboard zeigt ihn dann als "wird frei"
 * mit Bestätigen/Ablehnen an (siehe resolveFreedSlot).
 */
export async function playerScheduleRound(
	admin: SupabaseClient,
	boxMatchId: string,
	params: { scheduledAt: string; court: string | null; playerId: string }
): Promise<ScheduleWriteResult> {
	const round = await loadRoundForScheduling(admin, boxMatchId);
	if (!round) return { ok: false, message: 'Runde nicht gefunden.' };
	if (round.status !== 'scheduled') {
		return { ok: false, message: 'Diese Runde ist bereits gewertet — kein Termin mehr nötig.' };
	}

	const displaces = round.match_assigned_by_admin && round.scheduled_at;
	const { error: err } = await admin
		.from('league_box_matches')
		.update({
			scheduled_at: params.scheduledAt,
			court: params.court,
			match_assigned_by_admin: false,
			scheduled_by: params.playerId,
			...(displaces
				? { previous_scheduled_at: round.scheduled_at, previous_court: round.court }
				: {})
		})
		.eq('id', boxMatchId);
	if (err) return { ok: false, message: err.message };

	await postSystemMessage(
		admin,
		'league_box_match',
		boxMatchId,
		scheduleChatMessage(params.scheduledAt, params.court)
	);

	return { ok: true };
}

/**
 * Admin entscheidet über einen durch einen Spieler-Termin freigewordenen
 * Slot: 'confirm' bestätigt die Freigabe (alter Slot verfällt endgültig,
 * die Court-Buchung gilt als storniert), 'reject' verwirft stattdessen
 * den Spieler-Termin und stellt den ursprünglich vergebenen Slot wieder
 * her.
 */
export async function resolveFreedSlot(
	admin: SupabaseClient,
	boxMatchId: string,
	action: 'confirm' | 'reject'
): Promise<ScheduleWriteResult> {
	if (action === 'confirm') {
		const { error: err } = await admin
			.from('league_box_matches')
			.update({ previous_scheduled_at: null, previous_court: null })
			.eq('id', boxMatchId);
		if (err) return { ok: false, message: err.message };
		return { ok: true };
	}

	const { data, error: loadErr } = await admin
		.from('league_box_matches')
		.select('previous_scheduled_at, previous_court')
		.eq('id', boxMatchId)
		.maybeSingle();
	if (loadErr) return { ok: false, message: loadErr.message };
	if (!data?.previous_scheduled_at) {
		return { ok: false, message: 'Kein freigewordener Slot zum Wiederherstellen vorhanden.' };
	}

	const { error: err } = await admin
		.from('league_box_matches')
		.update({
			scheduled_at: data.previous_scheduled_at,
			court: data.previous_court,
			match_assigned_by_admin: true,
			previous_scheduled_at: null,
			previous_court: null
		})
		.eq('id', boxMatchId);
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

// ------------------------------------------------------------
// Admin-Ergebniskorrektur, Walkover, Abbruch
// ------------------------------------------------------------
// Ruft die Funktionen aus 0022_league_admin_dashboard.sql. Für 'played'
// und 'abandoned' entsteht ein ganz normales, noch unbestätigtes Match
// (status='pending') — siehe Doku bei adminReportBoxResult() dazu, warum
// das so bleibt statt sofort zu werten.

export type AdminResultInput = {
	boxMatchId: string;
	adminPlayerId: string;
	team1: [string, string];
	team2: [string, string];
	sets: { team1_games: number; team2_games: number }[];
	status: 'played' | 'abandoned';
	winnerTeam?: 1 | 2 | null;
	note?: string | null;
};

/**
 * Wirft bei Fehlern (wie reportBoxResult) — der Aufrufer wandelt das in
 * fail(400, …) um.
 *
 * Das entstehende Match bleibt bewusst status='pending', genau wie beim
 * Selbst-Melden — beide Teams sind zwar schon als "confirmed" markiert
 * (der Admin hat für beide gemeldet), aber matches.status kippt erst,
 * wenn die bestehende 48h-Frist (confirm_deadline, siehe 0001) über den
 * Cron abläuft (runConfirmCron -> applyRatingForMatch). Das ist kein
 * Kompromiss: die Box-Tabelle (league_box_matches.status/sets) gilt
 * SOFORT, unabhängig von matches.status — nur das allgemeine
 * Index-Rating braucht die Frist, exakt wie bei jedem anderen Match.
 * Der eigentliche Nutzen: solange die Frist läuft, ist das Ergebnis noch
 * korrigierbar (admin_report_league_box_result löscht + legt neu an,
 * solange status='pending') — ein sofortiges Bestätigen+Werten würde
 * genau dieses Korrekturfenster wieder zunichtemachen, ohne dass es
 * einen Weg gäbe, ein einmal angewendetes Rating zurückzunehmen.
 */
export async function adminReportBoxResult(
	admin: SupabaseClient,
	input: AdminResultInput
): Promise<string> {
	const { data: matchId, error: rpcErr } = await admin.rpc('admin_report_league_box_result', {
		p_box_match_id: input.boxMatchId,
		p_admin_id: input.adminPlayerId,
		p_team1: input.team1,
		p_team2: input.team2,
		p_sets: input.sets,
		p_status: input.status,
		p_winner_team: input.winnerTeam ?? null,
		p_note: input.note ?? null
	});
	if (rpcErr) throw error(400, rpcErr.message);

	return matchId as string;
}

export type AdminWriteResult = { ok: true } | { ok: false; message: string };

/** Walkover: reines Box-Tabellen-Ereignis, kein Match, kein Rating-Effekt (siehe 0022). */
export async function setBoxWalkover(
	admin: SupabaseClient,
	params: { boxMatchId: string; adminPlayerId: string; winnerTeam: 1 | 2; note?: string | null }
): Promise<AdminWriteResult> {
	const { error: err } = await admin.rpc('admin_set_league_box_walkover', {
		p_box_match_id: params.boxMatchId,
		p_admin_id: params.adminPlayerId,
		p_winner_team: params.winnerTeam,
		p_note: params.note ?? null
	});
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

/** Macht eine noch nicht gewertete Eintragung rückgängig (Korrektur-Werkzeug). */
export async function resetBoxMatch(
	admin: SupabaseClient,
	params: { boxMatchId: string; adminPlayerId: string }
): Promise<AdminWriteResult> {
	const { error: err } = await admin.rpc('admin_reset_league_box_match', {
		p_box_match_id: params.boxMatchId,
		p_admin_id: params.adminPlayerId
	});
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}
