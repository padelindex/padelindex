// ============================================================
// PadelIndex — Matchmaking-Score (reine Funktionen)
// ============================================================
// Bekommt zwei bereits geladene "Kandidaten"-Objekte und gibt einen Score
// 0-100 plus die Gründe zurück. Keine Datenbankzugriffe — der teure Teil
// (welche Spieler überhaupt in Frage kommen) passiert vorgelagert in
// lib/server/matchmaking.ts, hier wird nur noch bewertet.
//
// Die Gewichtung liegt zentral in MATCHMAKING_WEIGHTS und summiert sich auf
// 100. Wer sie ändert, ändert sie an genau einer Stelle; assertWeightsSum100()
// unten macht daraus einen Testfall statt einer stillen Verschiebung.

import type {
	AvailabilityMatchType,
	DesiredLevel,
	PreferredFormat
} from './availability';
import { toMinutes } from './availability';

export type MatchmakingWeights = {
	timeOverlap: number;
	ratingProximity: number;
	location: number;
	formatAndType: number;
	activity: number;
};

export const MATCHMAKING_WEIGHTS: MatchmakingWeights = {
	timeOverlap: 30,
	ratingProximity: 25,
	location: 20,
	formatAndType: 15,
	activity: 10
};

export function weightsTotal(weights: MatchmakingWeights = MATCHMAKING_WEIGHTS): number {
	return (
		weights.timeOverlap +
		weights.ratingProximity +
		weights.location +
		weights.formatAndType +
		weights.activity
	);
}

/** Ab wann ein Vorschlag überhaupt angezeigt wird. Darunter: nur auf ausdrücklichen Wunsch. */
export const MIN_DISPLAY_SCORE = 50;

export type MatchQuality = 'excellent' | 'good' | 'possible' | 'weak';

export const MATCH_QUALITY_LABELS: Record<MatchQuality, string> = {
	excellent: 'Sehr guter Match',
	good: 'Guter Match',
	possible: 'Möglich',
	weak: 'Nicht ideal'
};

export function qualityForScore(score: number): MatchQuality {
	if (score >= 85) return 'excellent';
	if (score >= 70) return 'good';
	if (score >= MIN_DISPLAY_SCORE) return 'possible';
	return 'weak';
}

// ------------------------------------------------------------
// Eingaben
// ------------------------------------------------------------

export type ScoringSlot = {
	weekday: number | null;
	specificDate: string | null;
	startTime: string;
	endTime: string;
	matchType: AvailabilityMatchType;
	preferredFormat: PreferredFormat;
	desiredLevel: DesiredLevel;
	clubId: string | null;
	maxDistanceKm: number;
};

export type ScoringPlayer = {
	rating: number;
	matchesPlayed: number;
	clubId: string | null;
	/** null, solange kein Verein Koordinaten gepflegt hat — siehe Migration 0013. */
	latitude: number | null;
	longitude: number | null;
	/** Für den Aktivitäts-Anteil: wie viele Profilfelder ausgefüllt sind (0-1). */
	profileCompleteness: number;
	lastMatchAt: string | null;
};

export type ScoringInput = {
	me: { player: ScoringPlayer; slots: ScoringSlot[] };
	candidate: { player: ScoringPlayer; slots: ScoringSlot[] };
	/** Wie oft schon zusammen gespielt — mehr Abwechslung wird leicht bevorzugt. */
	timesPlayedTogether?: number;
	now?: Date;
};

export type MatchSuggestionScore = {
	score: number;
	quality: MatchQuality;
	reasons: string[];
	breakdown: {
		timeOverlap: number;
		ratingProximity: number;
		location: number;
		formatAndType: number;
		activity: number;
	};
};

// ------------------------------------------------------------
// Zeitüberschneidung
// ------------------------------------------------------------

/** Zwei Slots beschreiben denselben Tag, wenn Datum ODER Wochentag zusammenpassen. */
function sameDay(a: ScoringSlot, b: ScoringSlot): boolean {
	if (a.specificDate && b.specificDate) return a.specificDate === b.specificDate;
	if (a.weekday !== null && b.weekday !== null) return a.weekday === b.weekday;
	// Ein konkretes Datum trifft eine wöchentliche Zeit, wenn der Wochentag passt.
	// weekdayOfDate() wird bewusst vom Aufrufer vorberechnet in weekday abgelegt,
	// deshalb reicht hier der Vergleich beider Felder.
	if (a.specificDate && b.weekday !== null) return a.weekday === b.weekday;
	if (b.specificDate && a.weekday !== null) return a.weekday === b.weekday;
	return false;
}

/** Überschneidung zweier Slots in Minuten (0 = keine). */
export function overlapMinutes(a: ScoringSlot, b: ScoringSlot): number {
	if (!sameDay(a, b)) return 0;
	const start = Math.max(toMinutes(a.startTime), toMinutes(b.startTime));
	const end = Math.min(toMinutes(a.endTime), toMinutes(b.endTime));
	return Math.max(0, end - start);
}

/** Beste Überschneidung über alle Slot-Paare — plus der Slot, der sie erzeugt hat. */
export function bestOverlap(
	mine: ScoringSlot[],
	theirs: ScoringSlot[]
): { minutes: number; mySlot: ScoringSlot | null; theirSlot: ScoringSlot | null } {
	let best = { minutes: 0, mySlot: null as ScoringSlot | null, theirSlot: null as ScoringSlot | null };
	for (const a of mine) {
		for (const b of theirs) {
			const minutes = overlapMinutes(a, b);
			if (minutes > best.minutes) best = { minutes, mySlot: a, theirSlot: b };
		}
	}
	return best;
}

/** 90 Minuten (eine Platzbuchung) gelten als volle Überschneidung. */
export const FULL_OVERLAP_MINUTES = 90;

// ------------------------------------------------------------
// Entfernung
// ------------------------------------------------------------

/** Haversine in km. Nur nutzbar, wenn beide Vereine Koordinaten haben. */
export function distanceKm(
	a: { latitude: number | null; longitude: number | null },
	b: { latitude: number | null; longitude: number | null }
): number | null {
	if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null) {
		return null;
	}
	const R = 6371;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b.latitude - a.latitude);
	const dLon = toRad(b.longitude - a.longitude);
	const lat1 = toRad(a.latitude);
	const lat2 = toRad(b.latitude);

	const h =
		Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ------------------------------------------------------------
// Teil-Scores (jeweils 0..1, werden unten gewichtet)
// ------------------------------------------------------------

function timeOverlapFactor(minutes: number): number {
	return Math.min(1, minutes / FULL_OVERLAP_MINUTES);
}

/**
 * Rating-Nähe im Kontext des GEWÜNSCHTEN Niveaus: wer "deutlich stärker"
 * sucht, soll für einen gleich starken Gegner NICHT die volle Punktzahl
 * bekommen. Der Wunsch definiert also das Ziel-Delta, nicht "je näher, desto
 * besser".
 */
export function ratingProximityFactor(
	myRating: number,
	theirRating: number,
	desired: DesiredLevel
): number {
	const delta = theirRating - myRating; // positiv = Gegner ist stärker

	if (desired === 'any') {
		// Rating ist egal -> nur grobe Plausibilität, damit 0.5 vs 6.5 nicht
		// als Traumpaarung durchgeht.
		return Math.max(0, 1 - Math.abs(delta) / 4);
	}

	const target = desired === 'similar' ? 0 : desired === 'slightly_stronger' ? 0.5 : 1.2;
	// Toleranz um das Ziel-Delta; 1.0 Ratingpunkte daneben -> 0.
	return Math.max(0, 1 - Math.abs(delta - target) / 1.0);
}

/**
 * Standort: gleicher Verein ist die stärkste Aussage, die dieses Schema
 * hergibt. Koordinaten sind vorbereitet (Migration 0013), aber noch nirgends
 * gepflegt — solange sie fehlen, gibt es für "anderer Verein" einen neutralen
 * Teilwert statt einer erfundenen Entfernung.
 */
export function locationFactor(
	me: ScoringPlayer,
	candidate: ScoringPlayer,
	maxDistanceKm: number
): { factor: number; sameClub: boolean; km: number | null } {
	const sameClub = me.clubId !== null && me.clubId === candidate.clubId;
	if (sameClub) return { factor: 1, sameClub: true, km: 0 };

	const km = distanceKm(me, candidate);
	if (km === null) return { factor: 0.4, sameClub: false, km: null };
	if (km > maxDistanceKm) return { factor: 0, sameClub: false, km };
	return { factor: Math.max(0, 1 - km / Math.max(1, maxDistanceKm)), sameClub: false, km };
}

function formatCompatible(a: PreferredFormat, b: PreferredFormat): boolean {
	return a === 'open' || b === 'open' || a === b;
}

function formatAndTypeFactor(mine: ScoringSlot | null, theirs: ScoringSlot | null): number {
	if (!mine || !theirs) return 0;
	const typeMatch = mine.matchType === theirs.matchType ? 1 : 0;
	const formatMatch = formatCompatible(mine.preferredFormat, theirs.preferredFormat) ? 1 : 0;
	// Beide Hälften zählen gleich viel; ein exakt gleicher Matchtyp ist die
	// deutlichere Absichtserklärung, das Format ist oft schlicht "offen".
	return (typeMatch + formatMatch) / 2;
}

/** Aktivität + Profilvollständigkeit: wer erreichbar und einschätzbar ist, wird bevorzugt. */
function activityFactor(candidate: ScoringPlayer, now: Date): number {
	const completeness = Math.max(0, Math.min(1, candidate.profileCompleteness));

	let recency = 0;
	if (candidate.lastMatchAt) {
		const days = (now.getTime() - new Date(candidate.lastMatchAt).getTime()) / 86_400_000;
		// Innerhalb von 30 Tagen gespielt = voll aktiv, nach 120 Tagen = 0.
		recency = Math.max(0, Math.min(1, 1 - (days - 30) / 90));
	}

	return 0.5 * completeness + 0.5 * recency;
}

// ------------------------------------------------------------
// Gesamtscore
// ------------------------------------------------------------

export function calculateMatchmakingScore(
	input: ScoringInput,
	weights: MatchmakingWeights = MATCHMAKING_WEIGHTS
): MatchSuggestionScore {
	const now = input.now ?? new Date();
	const { me, candidate } = input;

	const overlap = bestOverlap(me.slots, candidate.slots);
	const desired = overlap.mySlot?.desiredLevel ?? me.slots[0]?.desiredLevel ?? 'any';
	const maxDistance = overlap.mySlot?.maxDistanceKm ?? me.slots[0]?.maxDistanceKm ?? 25;

	const time = timeOverlapFactor(overlap.minutes);
	const rating = ratingProximityFactor(me.player.rating, candidate.player.rating, desired);
	const location = locationFactor(me.player, candidate.player, maxDistance);
	const formatType = formatAndTypeFactor(overlap.mySlot, overlap.theirSlot);
	const activity = activityFactor(candidate.player, now);

	const breakdown = {
		timeOverlap: time * weights.timeOverlap,
		ratingProximity: rating * weights.ratingProximity,
		location: location.factor * weights.location,
		formatAndType: formatType * weights.formatAndType,
		activity: activity * weights.activity
	};

	let raw =
		breakdown.timeOverlap +
		breakdown.ratingProximity +
		breakdown.location +
		breakdown.formatAndType +
		breakdown.activity;

	// Abwechslungs-Bonus: wer noch nie zusammen gespielt hat, rutscht leicht
	// nach oben. Bewusst klein (max. 3 Punkte) — es ist ein Tiebreaker, kein
	// eigenes Kriterium, und darf die Gewichtung oben nicht aushebeln.
	const together = input.timesPlayedTogether ?? 0;
	raw += together === 0 ? 3 : Math.max(0, 3 - together);

	// Ohne gemeinsame Zeit gibt es nichts vorzuschlagen — das ist die
	// Geschäftsgrundlage des ganzen Features, kein weiteres Kriterium unter
	// vielen. Ohne diese Sperre käme ein Spieler allein über Rating + Verein +
	// Aktivität auf ~58 Punkte und würde als "Möglich" angezeigt, obwohl die
	// beiden nie zur selben Zeit können. Deshalb hart unter die Anzeigegrenze.
	if (overlap.minutes === 0) {
		raw = Math.min(raw, MIN_DISPLAY_SCORE - 1);
	}

	const score = Math.max(0, Math.min(100, Math.round(raw)));

	return {
		score,
		quality: qualityForScore(score),
		reasons: buildReasons({ overlap, location, formatType, rating, together, candidate: candidate.player, me: me.player }),
		breakdown
	};
}

function buildReasons(ctx: {
	overlap: ReturnType<typeof bestOverlap>;
	location: ReturnType<typeof locationFactor>;
	formatType: number;
	rating: number;
	together: number;
	candidate: ScoringPlayer;
	me: ScoringPlayer;
}): string[] {
	const reasons: string[] = [];

	if (ctx.overlap.minutes >= FULL_OVERLAP_MINUTES) {
		reasons.push(`${Math.round(ctx.overlap.minutes / 60 * 10) / 10} h gemeinsame Zeit`);
	} else if (ctx.overlap.minutes > 0) {
		reasons.push(`${ctx.overlap.minutes} Min. gemeinsame Zeit`);
	}

	if (ctx.location.sameClub) {
		reasons.push('Gleicher Verein');
	} else if (ctx.location.km !== null) {
		reasons.push(`ca. ${Math.round(ctx.location.km)} km entfernt`);
	}

	if (ctx.rating >= 0.75) {
		const delta = Math.abs(ctx.candidate.rating - ctx.me.rating);
		reasons.push(delta < 0.3 ? 'Fast identisches Rating' : 'Passendes Spielniveau');
	}

	if (ctx.formatType >= 1) {
		const slot = ctx.overlap.theirSlot;
		if (slot) reasons.push(`Sucht ebenfalls: ${matchTypeShort(slot.matchType)}`);
	}

	if (ctx.together === 0) reasons.push('Noch nie zusammen gespielt');

	return reasons;
}

function matchTypeShort(type: AvailabilityMatchType): string {
	return {
		friendly: 'Freundschaftsspiel',
		competitive: 'Wettkampf',
		training: 'Training',
		tournament_prep: 'Turniervorbereitung'
	}[type];
}
