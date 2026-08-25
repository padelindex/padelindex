// ============================================================
// PadelIndex — Liga-Modul: Saison-Lebenszyklus
// ============================================================
// Der Saison-Assistent und "Neuer Zyklus"-Fluss aus dem Vereinsadmin-
// Dashboard. Schreibt wie league-admin.ts über den service_role-Client
// — Autorisierung (isClubAdmin) prüft der Aufrufer VORHER, nie hier.
//
// Ein neu angelegter Zyklus entsteht immer mit status='planned': Boxen
// und Mitglieder existieren, aber loadCurrentCycle() (league.ts) zeigt
// nur running/completed an — der Zyklus ist also unsichtbar für die
// öffentliche Ligaseite und für "aktueller Zyklus"-Werkzeuge, bis
// publishCycle() ihn freischaltet. Genau dieser Zwischenzustand ist der
// "Vorschau vor der endgültigen Bestätigung"-Schritt aus dem Dashboard:
// die Korrektur läuft über die BESTEHENDE Boxen-Seite (Drag & Drop,
// siehe zyklen/[cycleId]) — es gibt dafür keine zweite Oberfläche.

import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatPlayerName } from '$lib/claim-match';
import {
	groupPromotionsIntoBoxes,
	seedBoxesByRating,
	type BoxLeagueConfig,
	type GroupedBox
} from '$lib/league/box-americano';
import { createBox, addBoxMember, type WriteResult } from '$lib/server/league-admin';
import { loadLadder } from '$lib/server/league';

export type SeasonStatus = 'draft' | 'active' | 'archived';

export type SeasonInfo = {
	id: string;
	leagueId: string;
	name: string;
	status: SeasonStatus;
	plannedCycles: number | null;
	cycleCount: number;
};

export async function listSeasonsForLeague(
	admin: SupabaseClient,
	leagueId: string
): Promise<SeasonInfo[]> {
	const { data, error: err } = await admin
		.from('league_seasons')
		.select('id, league_id, name, status, planned_cycles, league_cycles(id)')
		.eq('league_id', leagueId)
		.order('created_at', { ascending: false });

	if (err) throw error(500, err.message);

	return (data ?? []).map((row) => ({
		id: row.id,
		leagueId: row.league_id,
		name: row.name,
		status: row.status as SeasonStatus,
		plannedCycles: row.planned_cycles,
		cycleCount: ((row.league_cycles as unknown as unknown[]) ?? []).length
	}));
}

export async function loadSeason(
	admin: SupabaseClient,
	seasonId: string
): Promise<SeasonInfo | null> {
	const { data, error: err } = await admin
		.from('league_seasons')
		.select('id, league_id, name, status, planned_cycles, league_cycles(id)')
		.eq('id', seasonId)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) return null;

	return {
		id: data.id,
		leagueId: data.league_id,
		name: data.name,
		status: data.status as SeasonStatus,
		plannedCycles: data.planned_cycles,
		cycleCount: ((data.league_cycles as unknown as unknown[]) ?? []).length
	};
}

export async function activeSeason(
	admin: SupabaseClient,
	leagueId: string
): Promise<SeasonInfo | null> {
	const { data, error: err } = await admin
		.from('league_seasons')
		.select('id, league_id, name, status, planned_cycles, league_cycles(id)')
		.eq('league_id', leagueId)
		.eq('status', 'active')
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) return null;

	return {
		id: data.id,
		leagueId: data.league_id,
		name: data.name,
		status: data.status as SeasonStatus,
		plannedCycles: data.planned_cycles,
		cycleCount: ((data.league_cycles as unknown as unknown[]) ?? []).length
	};
}

export type CreateSeasonResult = { ok: true; seasonId: string } | { ok: false; message: string };

/**
 * Schritt 1+2 des Saison-Assistenten in einer Aktion: eine bestehende
 * aktive Saison wird archiviert (inklusive ihrer noch laufenden Zyklen,
 * die als 'completed' markiert werden — eine archivierte Saison soll
 * keinen nominell "laufenden" Zyklus zurücklassen), danach entsteht die
 * neue Saison als 'draft'. Bewusst OHNE Prüfung "sind alle Runden
 * gewertet?" — das Beenden einer Saison ist eine bewusste
 * Admin-Entscheidung, kein automatischer Vorgang wie der Zyklus-
 * Abschluss.
 */
export async function createSeason(
	admin: SupabaseClient,
	leagueId: string,
	params: { name: string; plannedCycles: number | null }
): Promise<CreateSeasonResult> {
	const name = params.name.trim();
	if (!name) return { ok: false, message: 'Bitte einen Namen für die neue Saison angeben.' };

	// Namenskonflikt ZUERST prüfen, bevor die alte Saison archiviert wird
	// — sonst stünde die Liga bei einem doppelten Namen plötzlich ganz
	// ohne aktive Saison da (archiviert, aber die neue nie angelegt).
	const { data: existing, error: existingErr } = await admin
		.from('league_seasons')
		.select('id')
		.eq('league_id', leagueId)
		.eq('name', name)
		.maybeSingle();
	if (existingErr) return { ok: false, message: existingErr.message };
	if (existing) {
		return { ok: false, message: `Eine Saison mit dem Namen „${name}" existiert bereits.` };
	}

	const current = await activeSeason(admin, leagueId);
	if (current) {
		const { error: seasonErr } = await admin
			.from('league_seasons')
			.update({ status: 'archived' })
			.eq('id', current.id);
		if (seasonErr) return { ok: false, message: seasonErr.message };

		const { error: cycleErr } = await admin
			.from('league_cycles')
			.update({ status: 'completed' })
			.eq('season_id', current.id)
			.eq('status', 'running');
		if (cycleErr) return { ok: false, message: cycleErr.message };
	}

	const { data, error: err } = await admin
		.from('league_seasons')
		.insert({
			league_id: leagueId,
			name,
			status: 'draft',
			planned_cycles: params.plannedCycles
		})
		.select('id')
		.single();

	if (err) {
		if (err.code === '23505') {
			return { ok: false, message: `Eine Saison mit dem Namen „${name}" existiert bereits.` };
		}
		return { ok: false, message: err.message };
	}

	return { ok: true, seasonId: data.id };
}

// ------------------------------------------------------------
// Teilnehmer-Pool
// ------------------------------------------------------------

export type ParticipantStatus = 'active' | 'waitlist' | 'substitute' | 'paused' | 'left';

export type ParticipantRow = {
	playerId: string;
	name: string;
	rating: number;
	status: ParticipantStatus;
};

/** Alle bisherigen Anmeldungen der Liga, unabhängig vom Status — die Teilnehmer-Liste des Assistenten. */
export async function listParticipants(
	admin: SupabaseClient,
	leagueId: string
): Promise<ParticipantRow[]> {
	const { data, error: err } = await admin
		.from('league_registrations')
		.select('player_id, status, players!inner(display_name, claim_status, show_full_name, rating)')
		.eq('league_id', leagueId);

	if (err) throw error(500, err.message);

	return (data ?? [])
		.map((row) => {
			const p = row.players as unknown as {
				display_name: string;
				claim_status: string;
				show_full_name: boolean;
				rating: number;
			};
			return {
				playerId: row.player_id,
				name: formatPlayerName(p.display_name, p.claim_status, p.show_full_name),
				rating: Number(p.rating),
				status: row.status as ParticipantStatus
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Vereinsmitglieder, die noch KEINE Anmeldung für diese Liga haben — Kandidaten fürs Hinzufügen. */
export async function listUnregisteredClubMembers(
	admin: SupabaseClient,
	clubId: string,
	leagueId: string
): Promise<{ playerId: string; name: string; rating: number }[]> {
	const { data: members, error: mErr } = await admin
		.from('club_memberships')
		.select('players!inner(id, display_name, claim_status, show_full_name, rating)')
		.eq('club_id', clubId);
	if (mErr) throw error(500, mErr.message);

	const { data: registered, error: rErr } = await admin
		.from('league_registrations')
		.select('player_id')
		.eq('league_id', leagueId);
	if (rErr) throw error(500, rErr.message);
	const registeredIds = new Set((registered ?? []).map((r) => r.player_id));

	return (members ?? [])
		.map(
			(row) =>
				(
					row as unknown as {
						players: {
							id: string;
							display_name: string;
							claim_status: string;
							show_full_name: boolean;
							rating: number;
						};
					}
				).players
		)
		.filter((p) => !registeredIds.has(p.id))
		.map((p) => ({
			playerId: p.id,
			name: formatPlayerName(p.display_name, p.claim_status, p.show_full_name),
			rating: Number(p.rating)
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Toggle "Nimmt teil" / "Pausiert" für eine bestehende Anmeldung. */
export async function setParticipantStatus(
	admin: SupabaseClient,
	leagueId: string,
	playerId: string,
	participating: boolean
): Promise<WriteResult> {
	const { error: err } = await admin
		.from('league_registrations')
		.update({ status: participating ? 'active' : 'paused' })
		.eq('league_id', leagueId)
		.eq('player_id', playerId);
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

/** Neue Anmeldung anlegen (aus der Suche im Teilnehmer-Schritt), direkt aktiv. */
export async function addParticipant(
	admin: SupabaseClient,
	leagueId: string,
	playerId: string
): Promise<WriteResult> {
	const { error: err } = await admin
		.from('league_registrations')
		.insert({ league_id: leagueId, player_id: playerId, status: 'active' });
	if (err) {
		if (err.code === '23505') return { ok: false, message: 'Ist bereits angemeldet.' };
		return { ok: false, message: err.message };
	}
	return { ok: true };
}

// ------------------------------------------------------------
// Zyklus aus Boxen-Gruppen anlegen (gemeinsam für Seeding und Auf-/Abstieg)
// ------------------------------------------------------------

function defaultCycleDates(startDate?: string): { start: string; end: string } {
	const start = startDate ? new Date(startDate) : new Date();
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + 42); // sechs Wochen, siehe Zyklus-Regelwerk
	const iso = (d: Date) => d.toISOString().slice(0, 10);
	return { start: iso(start), end: iso(end) };
}

export type CreateCycleFromGroupsResult =
	{ ok: true; cycleId: string } | { ok: false; message: string };

/**
 * Legt einen Zyklus (status='planned') mit Boxen + Mitgliedern aus einer
 * bereits berechneten Gruppierung an (seedBoxesByRating oder
 * groupPromotionsIntoBoxes) — gemeinsamer letzter Schritt für den
 * Saison-Assistenten (Zyklus 1) und "Neuer Zyklus starten". Rollt beim
 * ersten Fehler die bereits angelegten Boxen zurück (cascade über
 * league_boxes.cycle_id), damit kein halb angelegter Zyklus stehen
 * bleibt.
 */
export async function createCycleFromGroups(
	admin: SupabaseClient,
	params: {
		seasonId: string;
		ordinal: number;
		name: string | null;
		startDate?: string;
		endDate?: string;
		groups: GroupedBox[];
		rounds: number;
	}
): Promise<CreateCycleFromGroupsResult> {
	const dates = defaultCycleDates(params.startDate);
	const startDate = params.startDate ?? dates.start;
	const endDate = params.endDate ?? dates.end;

	const { data: cycle, error: cErr } = await admin
		.from('league_cycles')
		.insert({
			season_id: params.seasonId,
			ordinal: params.ordinal,
			name: params.name,
			start_date: startDate,
			end_date: endDate,
			status: 'planned'
		})
		.select('id')
		.single();

	if (cErr) {
		if (cErr.code === '23505') {
			return { ok: false, message: `Zyklus ${params.ordinal} existiert in dieser Saison bereits.` };
		}
		return { ok: false, message: cErr.message };
	}

	for (const group of params.groups) {
		const boxResult = await createBox(
			admin,
			cycle.id,
			{ ladderPosition: group.ladderPosition, label: null, scheduledAt: null, court: null },
			params.rounds
		);
		if (!boxResult.ok) {
			await admin.from('league_cycles').delete().eq('id', cycle.id);
			return { ok: false, message: boxResult.message };
		}

		for (const member of group.members) {
			const memberResult = await addBoxMember(admin, boxResult.boxId, {
				playerId: member.playerId,
				seat: member.seat,
				role: member.role,
				replacesPlayerId: null
			});
			if (!memberResult.ok) {
				await admin.from('league_cycles').delete().eq('id', cycle.id);
				return { ok: false, message: memberResult.message };
			}
		}
	}

	return { ok: true, cycleId: cycle.id };
}

/** Zyklus 1 einer neuen Saison: alle aktiven Teilnehmer, nach Rating in Boxen geseedet. */
export async function seedInitialCycle(
	admin: SupabaseClient,
	params: { seasonId: string; leagueId: string; config: BoxLeagueConfig }
): Promise<CreateCycleFromGroupsResult> {
	const participants = await listParticipants(admin, params.leagueId);
	const active = participants.filter((p) => p.status === 'active');
	if (active.length < params.config.boxSize) {
		return {
			ok: false,
			message: `Mindestens ${params.config.boxSize} teilnehmende Spieler nötig (aktuell ${active.length}).`
		};
	}

	const groups = seedBoxesByRating(
		active.map((p) => ({ playerId: p.playerId, rating: p.rating })),
		params.config.boxSize
	).map((members, i) => ({ ladderPosition: i + 1, members }));

	return createCycleFromGroups(admin, {
		seasonId: params.seasonId,
		ordinal: 1,
		name: null,
		groups,
		rounds: params.config.rounds
	});
}

/**
 * Vorschau für seedInitialCycle() OHNE etwas zu schreiben — für die
 * Bestätigungsseite des Assistenten vor "Boxen erstellen".
 */
export async function previewInitialSeeding(
	admin: SupabaseClient,
	leagueId: string,
	config: BoxLeagueConfig
): Promise<GroupedBox[]> {
	const participants = await listParticipants(admin, leagueId);
	const active = participants.filter((p) => p.status === 'active');
	return seedBoxesByRating(
		active.map((p) => ({ playerId: p.playerId, rating: p.rating })),
		config.boxSize
	).map((members, i) => ({ ladderPosition: i + 1, members }));
}

// ------------------------------------------------------------
// Nächsten Zyklus aus dem Auf-/Abstieg bauen
// ------------------------------------------------------------

/**
 * Endgültige Ziel-Leiterposition JEDES Spielers des aktuellen Zyklus:
 * league_promotions trägt nur die tatsächlichen Bewegungen ein (siehe
 * applyPromotionProposal in league.ts — "bleibt"-Zeilen werden dort
 * bewusst nicht geschrieben, auch nicht nach einem Override, das
 * explizit auf "bleibt" gesetzt wurde). Wer hier NICHT auftaucht, bleibt
 * also in seiner aktuellen Box — das gilt unabhängig davon, ob das der
 * automatische Vorschlag war oder ein manueller Override.
 */
async function finalLadderPositions(
	admin: SupabaseClient,
	currentCycleId: string,
	config: BoxLeagueConfig
): Promise<{ playerId: string; rating: number; toLadderPosition: number }[]> {
	const ladder = await loadLadder(admin, currentCycleId, config);

	const { data: moved, error: err } = await admin
		.from('league_promotions')
		.select('player_id, to_ladder_position')
		.eq('cycle_id', currentCycleId)
		.eq('status', 'applied');
	if (err) throw error(500, err.message);

	const movedTo = new Map((moved ?? []).map((r) => [r.player_id, r.to_ladder_position] as const));

	const rows: { playerId: string; rating: number; toLadderPosition: number }[] = [];
	for (const box of ladder) {
		for (const p of box.lineup) {
			rows.push({
				playerId: p.playerId,
				rating: p.rating,
				toLadderPosition: movedTo.get(p.playerId) ?? box.ladderPosition
			});
		}
	}
	return rows;
}

export async function previewNextCycleGrouping(
	admin: SupabaseClient,
	currentCycleId: string,
	config: BoxLeagueConfig
): Promise<GroupedBox[]> {
	const rows = await finalLadderPositions(admin, currentCycleId, config);
	return groupPromotionsIntoBoxes(rows, config.boxSize);
}

/**
 * Legt den nächsten Zyklus (status='planned') aus dem bereits
 * bestätigten Auf-/Abstieg an. Der Aufrufer muss VORHER sicherstellen,
 * dass die Promotion für currentCycleId bereits festgeschrieben ist
 * (applyPromotionProposal) — diese Funktion prüft das nicht erneut,
 * sie liest nur, was schon entschieden wurde.
 */
export async function createNextCycle(
	admin: SupabaseClient,
	params: {
		seasonId: string;
		currentCycleId: string;
		ordinal: number;
		config: BoxLeagueConfig;
	}
): Promise<CreateCycleFromGroupsResult> {
	const groups = await previewNextCycleGrouping(admin, params.currentCycleId, params.config);
	if (groups.length === 0) {
		return { ok: false, message: 'Keine Aufstellung im aktuellen Zyklus gefunden.' };
	}

	return createCycleFromGroups(admin, {
		seasonId: params.seasonId,
		ordinal: params.ordinal,
		name: null,
		groups,
		rounds: params.config.rounds
	});
}

// ------------------------------------------------------------
// Veröffentlichen
// ------------------------------------------------------------

export type PublishCycleResult = { ok: true } | { ok: false; message: string };

/**
 * Schaltet einen 'planned'-Zyklus frei ("erste Spielrunde freischalten"):
 * status -> 'running'. Ist es der erste Zyklus einer 'draft'-Saison,
 * wechselt die Saison zugleich auf 'active' — das ist der Moment, in dem
 * der Saison-Assistent tatsächlich abgeschlossen ist. Ein eventuell noch
 * 'running' markierter Vorgänger-Zyklus derselben Saison wird
 * 'completed' — es soll immer höchstens einen laufenden Zyklus je Saison
 * geben.
 */
export async function publishCycle(
	admin: SupabaseClient,
	cycleId: string
): Promise<PublishCycleResult> {
	const { data: cycle, error: cErr } = await admin
		.from('league_cycles')
		.select('id, season_id, status')
		.eq('id', cycleId)
		.maybeSingle();
	if (cErr) return { ok: false, message: cErr.message };
	if (!cycle) return { ok: false, message: 'Zyklus nicht gefunden.' };
	if (cycle.status !== 'planned') {
		return { ok: false, message: 'Dieser Zyklus ist bereits veröffentlicht.' };
	}

	const { error: prevErr } = await admin
		.from('league_cycles')
		.update({ status: 'completed' })
		.eq('season_id', cycle.season_id)
		.eq('status', 'running');
	if (prevErr) return { ok: false, message: prevErr.message };

	const { error: cycleErr } = await admin
		.from('league_cycles')
		.update({ status: 'running' })
		.eq('id', cycleId);
	if (cycleErr) return { ok: false, message: cycleErr.message };

	const season = await loadSeason(admin, cycle.season_id);
	if (season?.status === 'draft') {
		const { error: seasonErr } = await admin
			.from('league_seasons')
			.update({ status: 'active' })
			.eq('id', cycle.season_id);
		if (seasonErr) return { ok: false, message: seasonErr.message };
	}

	return { ok: true };
}
