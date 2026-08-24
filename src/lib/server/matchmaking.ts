// ============================================================
// PadelIndex — Matchvorschläge (Datenzugriff + Orchestrierung)
// ============================================================
// Ablauf bewusst zweistufig, damit das Scoring nicht auf der ganzen
// Spielertabelle läuft:
//
//   1. VORFILTER in SQL — jeder mit aktiver Verfügbarkeit kommt grundsätzlich
//      in Frage; habe ich selbst Zeiten, wird zusätzlich auf meine eigenen
//      Wochentage vorgefiltert (reine Optimierung).
//   2. SCORING in TypeScript (lib/matchmaking.ts) — nur wenn ich selbst
//      mindestens einen aktiven Slot habe (mySlots.length > 0). Ohne eigene
//      Zeiten gibt es kein Scoring, aber trotzdem die volle Liste: "kein
//      Voraussetzungs-Zeitplan, um andere mit Zeiten zu sehen" ist die
//      Kernanforderung dieses Features, siehe canScore unten.
//
// Fremde Verfügbarkeiten sind per RLS NICHT direkt lesbar (siehe 0013):
// Der Query läuft über service_role. Nach außen geht bewusst nicht der volle
// Wochenplan, sondern nur grobe Badges (Wochentag + Vormittag/Nachmittag/
// Abend, siehe formatAvailabilityBadge) und — bei Scoring — der eine Slot mit
// der besten Überschneidung. Nie Kontaktdaten, nie die exakte Uhrzeit fremder
// Slots.

import type { SupabaseClient } from '@supabase/supabase-js';
import { formatPlayerName } from '$lib/claim-match';
import { formatAvailabilityBadge, weekdayOfDate, type AvailabilityMatchType } from '$lib/availability';
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
	/**
	 * null, solange ich selbst keine (zum Filter passenden) Zeiten habe — dann
	 * gibt es nichts zu bewerten, nur eine schlichte Liste (siehe
	 * getMatchSuggestionsForPlayer).
	 */
	score: number | null;
	quality: MatchQuality | null;
	reasons: string[];
	/** Alle aktiven Zeiten des Kandidaten als Badges ("Di Abend") — unabhängig vom Scoring. */
	availabilityBadges: string[];
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
	show_full_name: boolean;
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
	// hasOwnAvailability entscheidet NUR "gibt es überhaupt eigene Zeiten"
	// (unabhängig vom Wochentagfilter) — sonst würde ein Filter auf einen
	// Tag ohne eigenen Slot fälschlich so aussehen, als hätte man gar keine
	// Zeiten hinterlegt. mySlots (für Scoring/Vorfilter) wird zusätzlich
	// vom Filter eingeschränkt.
	const { data: mineRaw } = await admin
		.from('player_availabilities')
		.select(AVAILABILITY_COLUMNS)
		.eq('player_id', playerId)
		.eq('status', 'active');

	const myAllSlots = ((mineRaw ?? []) as RawAvailability[])
		.map((r) => toScoringSlot(r, today))
		.filter((s): s is ScoringSlot => s !== null);
	const hasOwnAvailability = myAllSlots.length > 0;

	const mySlots = myAllSlots.filter(
		(s) => filters.weekday === null || filters.weekday === undefined || s.weekday === filters.weekday
	);

	// --- 2. Kandidaten: alle mit aktiven Zeiten ----------------------------
	// Ohne eigene Zeiten gibt es kein Scoring, aber die Kernanforderung bleibt:
	// jeder mit hinterlegten Zeiten soll trotzdem auftauchen (siehe unten,
	// Abschnitt 5) — deshalb wird der Kandidatenpool NIE an das eigene Fehlen
	// von Zeiten geknüpft.
	let candidateQuery = admin
		.from('player_availabilities')
		.select(AVAILABILITY_COLUMNS)
		.eq('status', 'active')
		.neq('player_id', playerId);

	if (filters.weekday !== null && filters.weekday !== undefined) {
		candidateQuery = candidateQuery.eq('weekday', filters.weekday);
	} else if (mySlots.length > 0) {
		// Reine Optimierung, wenn kein expliziter Filter gesetzt ist: nur
		// Kandidaten laden, die theoretisch an einem meiner Wochentage
		// passen könnten. Ohne eigene Slots entfällt das (dann zählt jeder).
		const myWeekdays = [...new Set(mySlots.map((s) => s.weekday).filter((w): w is number => w !== null))];
		if (myWeekdays.length > 0) candidateQuery = candidateQuery.in('weekday', myWeekdays);
	}
	if (filters.clubId) candidateQuery = candidateQuery.eq('club_id', filters.clubId);
	if (filters.matchType) candidateQuery = candidateQuery.eq('match_type', filters.matchType);

	const { data: candidateRaw } = await candidateQuery;
	const candidateRows = (candidateRaw ?? []) as RawAvailability[];
	if (candidateRows.length === 0) return { suggestions: [], hasOwnAvailability };

	// --- 3. Ausgeblendete/blockierte Spieler ------------------------------
	const { data: dismissals } = await admin
		.from('suggestion_dismissals')
		.select('dismissed_player_id')
		.eq('player_id', playerId);
	const hidden = new Set((dismissals ?? []).map((d) => d.dismissed_player_id));

	const candidateIds = [...new Set(candidateRows.map((r) => r.player_id))].filter(
		(id) => !hidden.has(id)
	);
	if (candidateIds.length === 0) return { suggestions: [], hasOwnAvailability };

	// --- 4. Spielerdaten + Vereinszugehörigkeit + Historie -----------------
	const [{ data: playersRaw }, { data: memberships }, { data: myMembership }, { data: myPlayerRaw }] =
		await Promise.all([
			admin
				.from('players')
				.select(
					'id, handle, display_name, claim_status, show_full_name, rating, matches_played, last_match_at, city, playing_hand, preferred_side, gender, self_assessed_level'
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
					'id, handle, display_name, claim_status, show_full_name, rating, matches_played, last_match_at, city, playing_hand, preferred_side, gender, self_assessed_level'
				)
				.eq('id', playerId)
				.maybeSingle()
		]);

	// myPlayerRaw fehlt praktisch nie (locals.player existiert ja bereits),
	// aber ohne eigene Zeilen lässt sich kein Scoring rechnen — dann eben
	// ohne, statt die ganze Liste zu verweigern.
	const myPlayer = myPlayerRaw as RawPlayer | null;
	const canScore = hasOwnAvailability && mySlots.length > 0 && myPlayer !== null;

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

	const meScoring: ScoringPlayer | null = myPlayer
		? {
				rating: Number(myPlayer.rating),
				matchesPlayed: myPlayer.matches_played,
				clubId: myClub?.club_id ?? null,
				latitude: myClub?.clubs?.latitude ?? null,
				longitude: myClub?.clubs?.longitude ?? null,
				profileCompleteness: profileCompleteness(myPlayer),
				lastMatchAt: myPlayer.last_match_at
			}
		: null;

	const togetherCount = canScore ? await countMatchesTogether(admin, playerId, candidateIds) : new Map<string, number>();

	// --- 5. Badges + (falls möglich) Scoring -------------------------------
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
		if (theirSlots.length === 0) continue;

		// Badges für die Kartenansicht — auf eindeutige Kombinationen reduziert,
		// damit fünf Slots am selben Abend nicht fünf identische Badges ergeben.
		const availabilityBadges = [...new Set(theirSlots.map((s) => formatAvailabilityBadge(s)))];

		if (!canScore || !meScoring) {
			// Kein Scoring möglich — einfache Liste ohne Bewertung, aber MIT
			// den Zeiten des Kandidaten, damit man die Überschneidung selbst
			// sehen kann. Das ist die Kernanforderung: keiner mit Zeiten fehlt
			// nur, weil ich selbst noch keine eingetragen habe.
			suggestions.push({
				playerId: row.id,
				handle: row.handle,
				name: formatPlayerName(row.display_name, row.claim_status, row.show_full_name),
				rating,
				matchesPlayed: row.matches_played,
				clubName: membership?.clubs?.name ?? null,
				score: null,
				quality: null,
				reasons: [],
				availabilityBadges,
				suggestedSlot: null
			});
			continue;
		}

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
			name: formatPlayerName(row.display_name, row.claim_status, row.show_full_name),
			rating,
			matchesPlayed: row.matches_played,
			clubName: membership?.clubs?.name ?? null,
			score: result.score,
			quality: result.quality,
			reasons: result.reasons,
			availabilityBadges,
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

	// Mit Scoring: beste Überschneidung zuerst (bestehendes Verhalten). Ohne
	// eigene Zeiten: einfache, stabile Reihenfolge nach Namen — das ist die
	// "einfache Umsetzung ohne Overlap-Scoring".
	if (canScore) {
		suggestions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
	} else {
		suggestions.sort((a, b) => a.name.localeCompare(b.name, 'de'));
	}

	return {
		suggestions: suggestions.slice(0, filters.limit ?? DEFAULT_SUGGESTION_LIMIT),
		hasOwnAvailability
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
