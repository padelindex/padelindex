// ============================================================
// PadelIndex — Liga-Modul: Zyklen und Boxen anlegen
// ============================================================
// Schreiben läuft über service_role, wie überall in diesem Schema (siehe
// club-members.ts) — es gibt bewusst keine INSERT/UPDATE/DELETE-Policies
// auf den league_*-Tabellen. Die Autorisierung ("ist diese Person Admin
// GENAU dieses Vereins?") prüft der Aufrufer VOR jedem Call über
// isClubAdmin(), nie hier — diese Funktionen vertrauen der übergebenen
// leagueId/cycleId/boxId.
//
// Was hier bewusst FEHLT: ein "Boxen automatisch aus dem
// Auf-/Abstiegsbeschluss befüllen"-Knopf. Bei einer obersten/untersten
// Box mit abweichender Auf-/Abstiegszahl (relegate_top_box,
// promote_bottom_box) balanciert sich die Spielerzahl zwischen
// benachbarten Boxen nicht von selbst aus — eine automatische Zuteilung
// könnte unbemerkt Boxen mit 3 oder 5 Spielern erzeugen. Das ist eine
// offene Entscheidung, kein vergessenes Feature (siehe Chat).

import { error, redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin, supabasePublic } from '$lib/server/supabase';
import { isClubAdmin } from '$lib/server/club-admin';
import { formatPlayerName } from '$lib/claim-match';
import { loadLeague, type League } from '$lib/server/league';

/**
 * Gemeinsame Zugriffsprüfung für alle /liga/[slug]/verwaltung/*-Routen:
 * nicht eingeloggt -> zum Login mit Rücksprung; kein Vereins-Admin ->
 * 403. Geprüft bei JEDEM Laden und JEDER Aktion, nie nur einmal (gleiche
 * Begründung wie isClubAdmin selbst: IDs in der URL sind Nutzereingabe).
 */
export async function requireLeagueAdmin(
	platform: App.Platform | undefined,
	slug: string,
	playerId: string | undefined,
	pathname: string
): Promise<League> {
	const league = await loadLeague(supabasePublic(platform), slug);
	if (!league) throw error(404, 'Diese Liga gibt es nicht.');
	if (!playerId) throw redirect(303, `/anmelden?next=${encodeURIComponent(pathname)}`);
	if (!league.clubId) throw error(403, 'Diese Liga hat keinen Verein, der sie verwalten könnte.');

	const ok = await isClubAdmin(supabaseAdmin(platform), league.clubId, playerId);
	if (!ok) throw error(403, 'Nur Vereins-Admins können diese Liga verwalten.');

	return league;
}

export type SeasonSummary = {
	id: string;
	name: string;
	status: 'planned' | 'running' | 'completed';
};

export async function listSeasons(
	admin: SupabaseClient,
	leagueId: string
): Promise<SeasonSummary[]> {
	const { data, error: err } = await admin
		.from('league_seasons')
		.select('id, name, status')
		.eq('league_id', leagueId)
		.order('created_at', { ascending: false });

	if (err) throw error(500, err.message);
	return data ?? [];
}

export type CycleSummary = {
	id: string;
	seasonId: string;
	seasonName: string;
	ordinal: number;
	name: string | null;
	startDate: string;
	endDate: string;
	status: 'planned' | 'running' | 'completed';
	boxCount: number;
};

/** Alle Zyklen einer Liga, neueste zuerst — für die Übersichtsliste. */
export async function listCycles(admin: SupabaseClient, leagueId: string): Promise<CycleSummary[]> {
	const { data, error: err } = await admin
		.from('league_cycles')
		.select(
			`id, ordinal, name, start_date, end_date, status,
			 league_seasons!inner ( id, name, league_id ),
			 league_boxes ( id )`
		)
		.eq('league_seasons.league_id', leagueId)
		.order('start_date', { ascending: false });

	if (err) throw error(500, err.message);

	return (data ?? []).map((row) => {
		const season = row.league_seasons as unknown as { id: string; name: string };
		return {
			id: row.id,
			seasonId: season.id,
			seasonName: season.name,
			ordinal: row.ordinal,
			name: row.name,
			startDate: row.start_date,
			endDate: row.end_date,
			status: row.status,
			boxCount: ((row.league_boxes as unknown as unknown[]) ?? []).length
		};
	});
}

export type CreateCycleResult = { ok: true; cycleId: string } | { ok: false; message: string };

/**
 * Legt bei Bedarf eine neue Saison an (Name eindeutig je Liga, siehe
 * unique(league_id, name) in 0016) und darin einen Zyklus.
 */
export async function createCycle(
	admin: SupabaseClient,
	leagueId: string,
	params: {
		seasonId: string | null;
		newSeasonName: string | null;
		ordinal: number;
		name: string | null;
		startDate: string;
		endDate: string;
	}
): Promise<CreateCycleResult> {
	if (params.endDate < params.startDate) {
		return { ok: false, message: 'Das Enddatum darf nicht vor dem Startdatum liegen.' };
	}

	let seasonId = params.seasonId;
	if (!seasonId) {
		const name = (params.newSeasonName ?? '').trim();
		if (!name) return { ok: false, message: 'Bitte eine Saison auswählen oder neu benennen.' };

		const { data: existing } = await admin
			.from('league_seasons')
			.select('id')
			.eq('league_id', leagueId)
			.eq('name', name)
			.maybeSingle();

		if (existing) {
			seasonId = existing.id;
		} else {
			const { data: created, error: sErr } = await admin
				.from('league_seasons')
				.insert({ league_id: leagueId, name, status: 'running' })
				.select('id')
				.single();
			if (sErr) return { ok: false, message: sErr.message };
			seasonId = created.id;
		}
	}

	const { data, error: cErr } = await admin
		.from('league_cycles')
		.insert({
			season_id: seasonId,
			ordinal: params.ordinal,
			name: params.name,
			start_date: params.startDate,
			end_date: params.endDate,
			status: 'running'
		})
		.select('id')
		.single();

	if (cErr) {
		if (cErr.code === '23505') {
			return { ok: false, message: `Zyklus ${params.ordinal} existiert in dieser Saison bereits.` };
		}
		return { ok: false, message: cErr.message };
	}

	return { ok: true, cycleId: data.id };
}

/** Nächste freie Zyklusnummer in einer Saison — reiner Vorschlag fürs Formular. */
export async function nextCycleOrdinal(admin: SupabaseClient, seasonId: string): Promise<number> {
	const { data } = await admin
		.from('league_cycles')
		.select('ordinal')
		.eq('season_id', seasonId)
		.order('ordinal', { ascending: false })
		.limit(1)
		.maybeSingle();
	return (data?.ordinal ?? 0) + 1;
}

// ------------------------------------------------------------
// Boxen
// ------------------------------------------------------------

export type CreateBoxResult = { ok: true; boxId: string } | { ok: false; message: string };

/**
 * Legt eine Box an UND gleich ihre Runden-Platzhalter (status='scheduled',
 * ohne match_id) — ohne die gibt es auf /liga/.../box/[boxId] nichts zum
 * Melden. `rounds` kommt aus leagues.config (box-americano.ts-Default: 3).
 */
export async function createBox(
	admin: SupabaseClient,
	cycleId: string,
	params: {
		ladderPosition: number;
		label: string | null;
		scheduledAt: string | null;
		court: string | null;
	},
	rounds: number
): Promise<CreateBoxResult> {
	const { data: box, error: bErr } = await admin
		.from('league_boxes')
		.insert({
			cycle_id: cycleId,
			ladder_position: params.ladderPosition,
			label: params.label,
			scheduled_at: params.scheduledAt,
			court: params.court
		})
		.select('id')
		.single();

	if (bErr) {
		if (bErr.code === '23505') {
			return {
				ok: false,
				message: `Leiterposition ${params.ladderPosition} ist in diesem Zyklus schon belegt.`
			};
		}
		return { ok: false, message: bErr.message };
	}

	const placeholders = Array.from({ length: rounds }, (_, i) => ({
		box_id: box.id,
		round_number: i + 1,
		status: 'scheduled' as const
	}));

	const { error: rErr } = await admin.from('league_box_matches').insert(placeholders);
	if (rErr) {
		// Box ohne Runden ist nutzlos — lieber sauber zurückrollen als
		// eine kaputte Box stehen lassen, die niemand befüllen kann.
		await admin.from('league_boxes').delete().eq('id', box.id);
		return { ok: false, message: `Runden konnten nicht angelegt werden: ${rErr.message}` };
	}

	return { ok: true, boxId: box.id };
}

/** War in dieser Box schon irgendeine Runde gemeldet? Schutz vor versehentlichem Löschen. */
async function boxHasResults(admin: SupabaseClient, boxId: string): Promise<boolean> {
	const { count } = await admin
		.from('league_box_matches')
		.select('id', { count: 'exact', head: true })
		.eq('box_id', boxId)
		.not('match_id', 'is', null);
	return (count ?? 0) > 0;
}

export type WriteResult = { ok: true } | { ok: false; message: string };

export async function deleteBox(admin: SupabaseClient, boxId: string): Promise<WriteResult> {
	if (await boxHasResults(admin, boxId)) {
		return {
			ok: false,
			message: 'Diese Box hat schon gemeldete Ergebnisse und lässt sich nicht mehr löschen.'
		};
	}
	// league_box_members/league_box_matches hängen mit on delete cascade
	// an league_boxes (0016) — ein delete hier räumt beides mit ab.
	const { error: err } = await admin.from('league_boxes').delete().eq('id', boxId);
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

// ------------------------------------------------------------
// Box-Mitglieder
// ------------------------------------------------------------

export async function addBoxMember(
	admin: SupabaseClient,
	boxId: string,
	params: {
		playerId: string;
		seat: number;
		role: 'regular' | 'substitute';
		replacesPlayerId: string | null;
	}
): Promise<WriteResult> {
	const { error: err } = await admin.from('league_box_members').insert({
		box_id: boxId,
		player_id: params.playerId,
		seat: params.seat,
		role: params.role,
		replaces_player_id: params.replacesPlayerId
	});

	if (err) {
		if (err.code === '23505') {
			return {
				ok: false,
				message: 'Dieser Sitz ist schon belegt, oder der Spieler ist bereits in dieser Box.'
			};
		}
		return { ok: false, message: err.message };
	}
	return { ok: true };
}

export async function removeBoxMember(
	admin: SupabaseClient,
	boxId: string,
	playerId: string
): Promise<WriteResult> {
	if (await boxHasResults(admin, boxId)) {
		return {
			ok: false,
			message:
				'Diese Box hat schon gemeldete Ergebnisse — Mitglieder lassen sich jetzt nicht mehr entfernen.'
		};
	}
	const { error: err } = await admin
		.from('league_box_members')
		.delete()
		.eq('box_id', boxId)
		.eq('player_id', playerId);
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

/**
 * Verschiebt einen Spieler per Drag & Drop zwischen Sitzen — innerhalb
 * einer Box (Sitztausch) oder zwischen zwei Boxen (Box-Wechsel). Nutzt
 * dieselben Bausteine wie die manuellen Formulare (addBoxMember/
 * removeBoxMember), rollt aber zurück, falls das Hinzufügen in der
 * Zielbox scheitert (z. B. Sitz doch schon belegt) — sonst stünde der
 * Spieler plötzlich in gar keiner Box mehr.
 */
export async function moveBoxMember(
	admin: SupabaseClient,
	params: {
		playerId: string;
		fromBoxId: string;
		fromSeat: number;
		fromRole: 'regular' | 'substitute';
		toBoxId: string;
		toSeat: number;
		role: 'regular' | 'substitute';
	}
): Promise<WriteResult> {
	if (params.fromBoxId === params.toBoxId && params.fromSeat === params.toSeat) {
		return { ok: true };
	}

	if (params.fromBoxId === params.toBoxId) {
		const { error: err } = await admin
			.from('league_box_members')
			.update({ seat: params.toSeat, role: params.role })
			.eq('box_id', params.fromBoxId)
			.eq('player_id', params.playerId);
		if (err) {
			if (err.code === '23505') return { ok: false, message: 'Dieser Sitz ist schon belegt.' };
			return { ok: false, message: err.message };
		}
		return { ok: true };
	}

	const removed = await removeBoxMember(admin, params.fromBoxId, params.playerId);
	if (!removed.ok) return removed;

	const added = await addBoxMember(admin, params.toBoxId, {
		playerId: params.playerId,
		seat: params.toSeat,
		role: params.role,
		replacesPlayerId: null
	});
	if (!added.ok) {
		// Zurückrollen: lieber der alte Zustand als ein Spieler ganz ohne Box.
		await admin.from('league_box_members').insert({
			box_id: params.fromBoxId,
			player_id: params.playerId,
			seat: params.fromSeat,
			role: params.fromRole
		});
		return added;
	}
	return { ok: true };
}

/**
 * Tauscht die Sitze zweier Spieler INNERHALB derselben Box (Drag & Drop
 * auf einen bereits besetzten Sitz). Läuft über die SQL-Funktion aus
 * 0022_league_admin_dashboard.sql: zwei sequenzielle UPDATEs würden die
 * unique(box_id, seat)-Regel beim ersten Schritt verletzen, weil der
 * jeweils andere Sitz zu dem Zeitpunkt noch belegt ist — die Funktion
 * löst das mit einer innerhalb der Transaktion aufgeschobenen Prüfung.
 */
export async function swapBoxMembers(
	admin: SupabaseClient,
	boxId: string,
	playerAId: string,
	playerBId: string
): Promise<WriteResult> {
	const { error: err } = await admin.rpc('swap_league_box_seats', {
		p_box_id: boxId,
		p_player_a: playerAId,
		p_player_b: playerBId
	});
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

/** Nächste freie Leiterposition in einem Zyklus — reiner Vorschlag fürs Formular. */
export async function nextLadderPosition(admin: SupabaseClient, cycleId: string): Promise<number> {
	const { data } = await admin
		.from('league_boxes')
		.select('ladder_position')
		.eq('cycle_id', cycleId)
		.order('ladder_position', { ascending: false })
		.limit(1)
		.maybeSingle();
	return (data?.ladder_position ?? 0) + 1;
}

// ------------------------------------------------------------
// Warteliste & Ersatz mitten im Zyklus
// ------------------------------------------------------------
// league_registrations bildet die Beziehung Spieler<->Liga insgesamt ab
// (aktiv/Warteliste/Ersatzpool/ausgetreten), unabhängig von der Frage,
// in welcher Box jemand gerade sitzt (league_box_members). Ein Austritt
// betrifft potenziell beides: die Registrierung wechselt auf 'left',
// UND — falls die Person gerade eine Box besetzt — der freie Sitz wird
// entweder leer gelassen oder sofort mit dem nächsten von der Warteliste
// befüllt.

export type WaitlistEntry = {
	playerId: string;
	name: string;
	joinedAt: string;
	rating: number;
};

/** Warteliste, älteste Anmeldung zuerst — das ist "der Nächstbeste". */
export async function listWaitlist(
	admin: SupabaseClient,
	leagueId: string
): Promise<WaitlistEntry[]> {
	const { data, error: err } = await admin
		.from('league_registrations')
		.select(
			'player_id, joined_at, players!inner(display_name, claim_status, show_full_name, rating)'
		)
		.eq('league_id', leagueId)
		.eq('status', 'waitlist')
		.order('joined_at', { ascending: true });

	if (err) throw error(500, err.message);

	return (data ?? []).map((row) => {
		const p = row.players as unknown as {
			display_name: string;
			claim_status: string;
			show_full_name: boolean;
			rating: number;
		};
		return {
			playerId: row.player_id,
			name: formatPlayerName(p.display_name, p.claim_status, p.show_full_name),
			joinedAt: row.joined_at,
			rating: Number(p.rating)
		};
	});
}

// departLeagueMember() zieht mittlerweile in league.ts um — Selbstbedienung
// (Spieler verlässt sich selbst über /konto) braucht dieselbe Funktion,
// und die gehört nicht in eine Datei, die "Autorisierung nur für
// Vereins-Admins" im Namen trägt. Siehe dort für Doku und Import hier
// über listWaitlist() hinaus, falls diese Datei sie noch braucht.
