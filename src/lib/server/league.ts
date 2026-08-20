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
	isBoxComplete,
	proposePromotions,
	roundPairings,
	type BoxLeagueConfig,
	type BoxMatchResult,
	type BoxMatchStatus,
	type BoxStanding,
	type PromotionProposal
} from '$lib/league/box-americano';

export type League = {
	id: string;
	clubId: string | null;
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
			: d.tiebreakers
	};
}

export async function loadLeague(sb: SupabaseClient, slug: string): Promise<League | null> {
	const { data, error: err } = await sb
		.from('leagues')
		.select('id, club_id, name, slug, format, config')
		.eq('slug', slug)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) return null;

	return {
		id: data.id,
		clubId: data.club_id,
		name: data.name,
		slug: data.slug,
		format: data.format,
		config: readConfig(data.config)
	};
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
		.select('box_id, seat, role, player_id, name, handle')
		.in('box_id', boxIds);
	if (lErr) throw error(500, lErr.message);

	const { data: roundRows, error: rErr } = await admin
		.from('league_box_matches')
		.select(
			`id, box_id, round_number, status, match_id, winner_team,
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
			role: row.role
		});
		lineupByBox.set(row.box_id, list);
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
			confirmed: m?.status === 'confirmed'
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
			status: r.status
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

	const savedBy = new Map((saved ?? []).map((r) => [r.player_id, r.status as PromotionRow['saved']]));

	return proposals.map((p) => ({
		...p,
		playerName: nameOf.get(p.playerId) ?? 'Unbekannt',
		saved: savedBy.get(p.playerId) ?? null
	}));
}

/**
 * Bestätigt den Vorschlag: schreibt ihn als 'applied' fest. Bewusst nur
 * ein Protokoll — die Boxen des Folgezyklus baut ein Admin daraus, das
 * ist kein automatischer Schritt.
 */
export async function applyPromotionProposal(
	admin: SupabaseClient,
	cycleId: string,
	decidedBy: string,
	config: BoxLeagueConfig
): Promise<number> {
	const rows = await loadPromotionProposal(admin, cycleId, config);
	const movable = rows.filter((r) => r.direction !== 'stay' && !r.warning);
	if (movable.length === 0) return 0;

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
	return movable.length;
}
