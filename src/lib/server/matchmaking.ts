// ============================================================
// PadelIndex — Matchvorschläge (Datenzugriff + Orchestrierung)
// ============================================================
// Ablauf bewusst zweistufig, damit das Scoring nicht auf der ganzen
// Spielertabelle läuft:
//
//   1. VORFILTER in SQL — nur Spieler mit aktiver Verfügbarkeit am
//      gleichen Wochentag wie mindestens einer meiner eigenen Slots.
//      Damit fällt der Großteil sofort weg, bevor irgendetwas gerechnet wird.
//   2. SCORING in TypeScript (lib/matchmaking.ts) — nur noch auf dieser
//      kleinen Menge, dafür mit allen Kriterien.
//
// Fremde Verfügbarkeiten sind per RLS NICHT direkt lesbar (siehe 0013):
// Der Query läuft über service_role und gibt nach außen ausschließlich
// aggregierte Vorschläge zurück — nie den Wochenplan einer anderen Person
// und niemals Kontaktdaten. Genau deshalb liegt das hier serverseitig und
// nicht als offene Tabelle im Client.

import type { SupabaseClient } from '@supabase/supabase-js';
import { abbreviateName } from '$lib/claim-match';
import { weekdayOfDate, type AvailabilityMatchType } from '$lib/availability';
import {
	MIN_DISPLAY_SCORE,
	calculateMatchmakingScore,
	type MatchQuality,
	type ScoringPlayer,
	type ScoringSlot
} from '$lib/matchmaking';

export type SuggestionFilters = {
	clubId?: string | null;
	minRating?: number | null;
	maxRating?: number | null;
	matchType?: AvailabilityMatchType | null;
	weekday?: number | null;
	/** Auch Vorschläge unterhalb der Anzeigegrenze mitliefern. */
	includeWeak?: boolean;
	limit?: number;
};

export type MatchSuggestion = {
	playerId: string;
	handle: string;
	name: string;
	rating: number;
	matchesPlayed: number;
	clubName: string | null;
	score: number;
	quality: MatchQuality;
	reasons: string[];
	/** Der Slot des Kandidaten, der die beste Überschneidung erzeugt hat — als Vorschlag fürs Anfrageformular. */
	suggestedSlot: {
		weekday: number | null;
		specificDate: string | null;
		startTime: string;
		endTime: string;
		matchType: AvailabilityMatchType;
		clubId: string | null;
	} | null;
};

type RawAvailability = {
	id: string;
	player_id: string;
	weekday: number | null;
	specific_date: string | null;
	start_time: string;
	end_time: string;
	club_id: string | null;
	max_distance_km: number;
	match_type: ScoringSlot['matchType'];
	preferred_format: ScoringSlot['preferredFormat'];
	desired_level: ScoringSlot['desiredLevel'];
};

type RawPlayer = {
	id: string;
	handle: string;
	display_name: string;
	claim_status: string;
	rating: number | string;
	matches_played: number;
	last_match_at: string | null;
	city: string | null;
	playing_hand: string | null;
	preferred_side: string | null;
	gender: string | null;
	self_assessed_level: number | string | null;
};

const AVAILABILITY_COLUMNS =
	'id, player_id, weekday, specific_date, start_time, end_time, club_id, max_distance_km, match_type, preferred_format, desired_level';

const trimTime = (v: string) => v.slice(0, 5);

/**
 * Datierte Slots bekommen ihren Wochentag mitberechnet, damit ein konkretes
 * Datum auch auf eine wöchentliche Zeit treffen kann (siehe sameDay() in
 * lib/matchmaking.ts). Abgelaufene Einzeltermine fallen dabei raus.
 */
function toScoringSlot(row: RawAvailability, today: string): ScoringSlot | null {
	if (row.specific_date && row.specific_date < today) return null;

	return {
		weekday: row.specific_date ? weekdayOfDate(row.specific_date) : row.weekday,
		specificDate: row.specific_date,
		startTime: trimTime(row.start_time),
		endTime: trimTime(row.end_time),
		matchType: row.match_type,
		preferredFormat: row.preferred_format,
		desiredLevel: row.desired_level,
		clubId: row.club_id,
		maxDistanceKm: row.max_distance_km
	};
}

/** 0..1 — wie vollständig ist das Profil (fließt in den Aktivitäts-Anteil ein). */
function profileCompleteness(p: RawPlayer): number {
	const fields = [p.city, p.playing_hand, p.preferred_side, p.gender, p.self_assessed_level];
	return fields.filter((f) => f !== null && f !== '').length / fields.length;
}

export const DEFAULT_SUGGESTION_LIMIT = 20;

export async function getMatchSuggestionsForPlayer(
	admin: SupabaseClient,
	playerId: string,
	filters: SuggestionFilters = {}
): Promise<{ suggestions: MatchSuggestion[]; hasOwnAvailability: boolean }> {
	const today = new Date().toISOString().slice(0, 10);

	// --- 1. Eigene aktive Slots -------------------------------------------
	const { data: mineRaw } = await admin
		.from('player_availabilities')
		.select(AVAILABILITY_COLUMNS)
		.eq('player_id', playerId)
		.eq('status', 'active');

	const mySlots = ((mineRaw ?? []) as RawAvailability[])
		.map((r) => toScoringSlot(r, today))
		.filter((s): s is ScoringSlot => s !== null)
		.filter((s) => filters.weekday === null || filters.weekday === undefined || s.weekday === filters.weekday);

	if (mySlots.length === 0) {
		return { suggestions: [], hasOwnAvailability: false };
	}

	// --- 2. Vorfilter: nur passende Wochentage ----------------------------
	const myWeekdays = [...new Set(mySlots.map((s) => s.weekday).filter((w): w is number => w !== null))];

	let candidateQuery = admin
		.from('player_availabilities')
		.select(AVAILABILITY_COLUMNS)
		.eq('status', 'active')
		.neq('player_id', playerId);

	if (myWeekdays.length > 0) candidateQuery = candidateQuery.in('weekday', myWeekdays);
	if (filters.clubId) candidateQuery = candidateQuery.eq('club_id', filters.clubId);
	if (filters.matchType) candidateQuery = candidateQuery.eq('match_type', filters.matchType);

	const { data: candidateRaw } = await candidateQuery;
	const candidateRows = (candidateRaw ?? []) as RawAvailability[];
	if (candidateRows.length === 0) return { suggestions: [], hasOwnAvailability: true };

	// --- 3. Ausgeblendete/blockierte Spieler ------------------------------
	const { data: dismissals } = await admin
		.from('suggestion_dismissals')
		.select('dismissed_player_id')
		.eq('player_id', playerId);
	const hidden = new Set((dismissals ?? []).map((d) => d.dismissed_player_id));

	const candidateIds = [...new Set(candidateRows.map((r) => r.player_id))].filter(
		(id) => !hidden.has(id)
	);
	if (candidateIds.length === 0) return { suggestions: [], hasOwnAvailability: true };

	// --- 4. Spielerdaten + Vereinszugehörigkeit + Historie -----------------
	const [{ data: playersRaw }, { data: memberships }, { data: myMembership }, { data: myPlayerRaw }] =
		await Promise.all([
			admin
				.from('players')
				.select(
					'id, handle, display_name, claim_status, rating, matches_played, last_match_at, city, playing_hand, preferred_side, gender, self_assessed_level'
				)
				.in('id', candidateIds)
				.eq('profile_public', true),
			admin
				.from('club_memberships')
				.select('player_id, club_id, clubs(name, latitude, longitude)')
				.in('player_id', candidateIds),
			admin
				.from('club_memberships')
				.select('club_id, clubs(latitude, longitude)')
				.eq('player_id', playerId)
				.limit(1)
				.maybeSingle(),
			admin
				.from('players')
				.select(
					'id, handle, display_name, claim_status, rating, matches_played, last_match_at, city, playing_hand, preferred_side, gender, self_assessed_level'
				)
				.eq('id', playerId)
				.maybeSingle()
		]);

	if (!myPlayerRaw) return { suggestions: [], hasOwnAvailability: true };

	type MembershipRow = {
		player_id: string;
		club_id: string;
		clubs: { name: string; latitude: number | null; longitude: number | null } | null;
	};
	const clubByPlayer = new Map<string, MembershipRow>();
	for (const row of (memberships ?? []) as unknown as MembershipRow[]) {
		if (!clubByPlayer.has(row.player_id)) clubByPlayer.set(row.player_id, row);
	}

	const myClub = myMembership as unknown as {
		club_id: string;
		clubs: { latitude: number | null; longitude: number | null } | null;
	} | null;

	const myPlayer = myPlayerRaw as RawPlayer;
	const meScoring: ScoringPlayer = {
		rating: Number(myPlayer.rating),
		matchesPlayed: myPlayer.matches_played,
		clubId: myClub?.club_id ?? null,
		latitude: myClub?.clubs?.latitude ?? null,
		longitude: myClub?.clubs?.longitude ?? null,
		profileCompleteness: profileCompleteness(myPlayer),
		lastMatchAt: myPlayer.last_match_at
	};

	const togetherCount = await countMatchesTogether(admin, playerId, candidateIds);

	// --- 5. Scoring --------------------------------------------------------
	const slotsByPlayer = new Map<string, ScoringSlot[]>();
	for (const row of candidateRows) {
		const slot = toScoringSlot(row, today);
		if (!slot) continue;
		const list = slotsByPlayer.get(row.player_id) ?? [];
		list.push(slot);
		slotsByPlayer.set(row.player_id, list);
	}

	const minScore = filters.includeWeak ? 0 : MIN_DISPLAY_SCORE;
	const suggestions: MatchSuggestion[] = [];

	for (const row of ((playersRaw ?? []) as RawPlayer[])) {
		const rating = Number(row.rating);
		if (filters.minRating != null && rating < filters.minRating) continue;
		if (filters.maxRating != null && rating > filters.maxRating) continue;

		const membership = clubByPlayer.get(row.id);
		const theirSlots = slotsByPlayer.get(row.id) ?? [];

		const candidateScoring: ScoringPlayer = {
			rating,
			matchesPlayed: row.matches_played,
			clubId: membership?.club_id ?? null,
			latitude: membership?.clubs?.latitude ?? null,
			longitude: membership?.clubs?.longitude ?? null,
			profileCompleteness: profileCompleteness(row),
			lastMatchAt: row.last_match_at
		};

		const result = calculateMatchmakingScore({
			me: { player: meScoring, slots: mySlots },
			candidate: { player: candidateScoring, slots: theirSlots },
			timesPlayedTogether: togetherCount.get(row.id) ?? 0
		});

		if (result.score < minScore) continue;

		// Der Slot, der die beste Überschneidung erzeugt hat — als Vorbelegung
		// fürs Anfrageformular. Nur DIESER eine Slot wird nach außen gegeben,
		// nicht der komplette Wochenplan des Kandidaten.
		const best = theirSlots.reduce<ScoringSlot | null>((acc, slot) => {
			const overlapWithMine = mySlots.some(
				(mine) =>
					mine.weekday === slot.weekday &&
					Math.min(toMin(mine.endTime), toMin(slot.endTime)) >
						Math.max(toMin(mine.startTime), toMin(slot.startTime))
			);
			return overlapWithMine && !acc ? slot : acc;
		}, null);

		suggestions.push({
			playerId: row.id,
			handle: row.handle,
			name: row.claim_status === 'claimed' ? row.display_name : abbreviateName(row.display_name),
			rating,
			matchesPlayed: row.matches_played,
			clubName: membership?.clubs?.name ?? null,
			score: result.score,
			quality: result.quality,
			reasons: result.reasons,
			suggestedSlot: best
				? {
						weekday: best.weekday,
						specificDate: best.specificDate,
						startTime: best.startTime,
						endTime: best.endTime,
						matchType: best.matchType,
						clubId: best.clubId
					}
				: null
		});
	}

	suggestions.sort((a, b) => b.score - a.score);
	return {
		suggestions: suggestions.slice(0, filters.limit ?? DEFAULT_SUGGESTION_LIMIT),
		hasOwnAvailability: true
	};
}

function toMin(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

/**
 * Wie oft habe ich mit wem schon gespielt (bestätigte Matches)? Zwei
 * schmale Abfragen statt eines Joins pro Kandidat — die Schnittmenge
 * entsteht in TypeScript.
 */
async function countMatchesTogether(
	admin: SupabaseClient,
	playerId: string,
	candidateIds: string[]
): Promise<Map<string, number>> {
	const counts = new Map<string, number>();

	const { data: myMatches } = await admin
		.from('match_participants')
		.select('match_id')
		.eq('player_id', playerId);

	const matchIds = (myMatches ?? []).map((m) => m.match_id);
	if (matchIds.length === 0) return counts;

	const { data: others } = await admin
		.from('match_participants')
		.select('player_id')
		.in('match_id', matchIds)
		.in('player_id', candidateIds);

	for (const row of others ?? []) {
		counts.set(row.player_id, (counts.get(row.player_id) ?? 0) + 1);
	}
	return counts;
}

export type DismissResult = { ok: true } | { ok: false; message: string };

export async function dismissSuggestion(
	admin: SupabaseClient,
	playerId: string,
	dismissedPlayerId: string,
	blocked = false
): Promise<DismissResult> {
	if (playerId === dismissedPlayerId) {
		return { ok: false, message: 'Ungültige Anfrage.' };
	}

	const { error } = await admin
		.from('suggestion_dismissals')
		.upsert(
			{ player_id: playerId, dismissed_player_id: dismissedPlayerId, blocked },
			{ onConflict: 'player_id,dismissed_player_id' }
		);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

export async function undoDismissal(
	admin: SupabaseClient,
	playerId: string,
	dismissedPlayerId: string
): Promise<DismissResult> {
	const { error } = await admin
		.from('suggestion_dismissals')
		.delete()
		.eq('player_id', playerId)
		.eq('dismissed_player_id', dismissedPlayerId);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}
