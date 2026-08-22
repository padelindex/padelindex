import { describe, expect, it } from 'vitest';
import {
	FULL_OVERLAP_MINUTES,
	MATCHMAKING_WEIGHTS,
	MIN_DISPLAY_SCORE,
	bestOverlap,
	calculateMatchmakingScore,
	distanceKm,
	locationFactor,
	overlapMinutes,
	qualityForScore,
	ratingProximityFactor,
	weightsTotal,
	type ScoringPlayer,
	type ScoringSlot
} from './matchmaking';

const slot = (over: Partial<ScoringSlot> = {}): ScoringSlot => ({
	weekday: 1,
	specificDate: null,
	startTime: '18:00',
	endTime: '20:00',
	matchType: 'friendly',
	preferredFormat: 'open',
	desiredLevel: 'similar',
	clubId: 'club-a',
	maxDistanceKm: 25,
	...over
});

const player = (over: Partial<ScoringPlayer> = {}): ScoringPlayer => ({
	rating: 4.0,
	matchesPlayed: 20,
	clubId: 'club-a',
	latitude: null,
	longitude: null,
	profileCompleteness: 1,
	lastMatchAt: '2026-03-15T12:00:00Z',
	...over
});

const NOW = new Date('2026-03-20T12:00:00Z');

describe('Gewichtung', () => {
	it('summiert sich auf genau 100', () => {
		expect(weightsTotal()).toBe(100);
	});

	it('entspricht der abgesprochenen Verteilung', () => {
		expect(MATCHMAKING_WEIGHTS).toEqual({
			timeOverlap: 30,
			ratingProximity: 25,
			location: 20,
			formatAndType: 15,
			activity: 10
		});
	});
});

describe('overlapMinutes', () => {
	it('rechnet die Überschneidung am gleichen Wochentag', () => {
		expect(overlapMinutes(slot({ startTime: '18:00', endTime: '20:00' }), slot({ startTime: '19:00', endTime: '21:00' }))).toBe(60);
	});

	it('liefert 0 bei unterschiedlichen Wochentagen', () => {
		expect(overlapMinutes(slot({ weekday: 1 }), slot({ weekday: 2 }))).toBe(0);
	});

	it('liefert 0 bei aneinandergrenzenden, nicht überlappenden Zeiten', () => {
		expect(overlapMinutes(slot({ startTime: '18:00', endTime: '19:00' }), slot({ startTime: '19:00', endTime: '20:00' }))).toBe(0);
	});

	it('erkennt vollständige Enthaltung', () => {
		expect(overlapMinutes(slot({ startTime: '17:00', endTime: '22:00' }), slot({ startTime: '19:00', endTime: '20:30' }))).toBe(90);
	});

	it('vergleicht konkrete Daten exakt', () => {
		const a = slot({ weekday: null, specificDate: '2026-03-23' });
		const b = slot({ weekday: null, specificDate: '2026-03-23' });
		const c = slot({ weekday: null, specificDate: '2026-03-24' });
		expect(overlapMinutes(a, b)).toBeGreaterThan(0);
		expect(overlapMinutes(a, c)).toBe(0);
	});

	it('bringt ein konkretes Datum mit einer wöchentlichen Zeit zusammen, wenn der Wochentag passt', () => {
		// Der Aufrufer legt bei datierten Slots den Wochentag mit ab (siehe
		// weekdayOfDate in availability.ts) — sonst wäre kein Treffer möglich.
		const dated = slot({ weekday: 1, specificDate: '2026-03-23' });
		const weekly = slot({ weekday: 1, specificDate: null });
		expect(overlapMinutes(dated, weekly)).toBeGreaterThan(0);
	});
});

describe('bestOverlap', () => {
	it('findet über mehrere Slots das beste Paar', () => {
		const mine = [slot({ weekday: 1, startTime: '18:00', endTime: '19:00' }), slot({ weekday: 3, startTime: '10:00', endTime: '14:00' })];
		const theirs = [slot({ weekday: 3, startTime: '11:00', endTime: '13:30' })];
		const best = bestOverlap(mine, theirs);
		expect(best.minutes).toBe(150);
		expect(best.mySlot?.weekday).toBe(3);
	});

	it('liefert 0 und keine Slots, wenn nichts passt', () => {
		const best = bestOverlap([slot({ weekday: 1 })], [slot({ weekday: 5 })]);
		expect(best.minutes).toBe(0);
		expect(best.mySlot).toBeNull();
	});

	it('kommt mit leeren Listen klar', () => {
		expect(bestOverlap([], [slot()]).minutes).toBe(0);
		expect(bestOverlap([slot()], []).minutes).toBe(0);
	});
});

describe('ratingProximityFactor', () => {
	it('belohnt bei "ähnlich" das gleiche Rating am stärksten', () => {
		expect(ratingProximityFactor(4.0, 4.0, 'similar')).toBe(1);
		expect(ratingProximityFactor(4.0, 4.5, 'similar')).toBeCloseTo(0.5, 5);
		expect(ratingProximityFactor(4.0, 5.5, 'similar')).toBe(0);
	});

	it('belohnt bei "etwas stärker" ein Rating leicht über dem eigenen', () => {
		expect(ratingProximityFactor(4.0, 4.5, 'slightly_stronger')).toBe(1);
		// Gleich stark ist hier NICHT ideal — der Wunsch war ja ein stärkerer Gegner.
		expect(ratingProximityFactor(4.0, 4.0, 'slightly_stronger')).toBeCloseTo(0.5, 5);
	});

	it('belohnt bei "deutlich stärker" einen klar stärkeren Gegner', () => {
		// toBeCloseTo statt toBe: 5.2 - 4.0 ist in IEEE-754 nicht exakt 1.2.
		expect(ratingProximityFactor(4.0, 5.2, 'much_stronger')).toBeCloseTo(1, 10);
		expect(ratingProximityFactor(4.0, 4.0, 'much_stronger')).toBe(0);
	});

	it('ist bei "egal" tolerant, aber nicht blind', () => {
		expect(ratingProximityFactor(4.0, 4.0, 'any')).toBe(1);
		expect(ratingProximityFactor(4.0, 5.0, 'any')).toBeCloseTo(0.75, 5);
		// Extreme Unterschiede bleiben auch bei "egal" unattraktiv.
		expect(ratingProximityFactor(0.5, 6.5, 'any')).toBe(0);
	});

	it('wird nie negativ', () => {
		expect(ratingProximityFactor(0.5, 7.0, 'similar')).toBe(0);
		expect(ratingProximityFactor(7.0, 0.5, 'much_stronger')).toBe(0);
	});
});

describe('distanceKm', () => {
	it('gibt null zurück, solange Koordinaten fehlen', () => {
		expect(distanceKm({ latitude: null, longitude: null }, { latitude: 48.1, longitude: 11.5 })).toBeNull();
	});

	it('rechnet eine bekannte Strecke plausibel (München–Nürnberg ≈ 150 km)', () => {
		const km = distanceKm({ latitude: 48.137, longitude: 11.575 }, { latitude: 49.452, longitude: 11.077 });
		expect(km).not.toBeNull();
		expect(km!).toBeGreaterThan(140);
		expect(km!).toBeLessThan(165);
	});

	it('liefert 0 für identische Punkte', () => {
		expect(distanceKm({ latitude: 48.1, longitude: 11.5 }, { latitude: 48.1, longitude: 11.5 })).toBeCloseTo(0, 6);
	});
});

describe('locationFactor', () => {
	it('gibt für den gleichen Verein die volle Punktzahl', () => {
		const result = locationFactor(player({ clubId: 'a' }), player({ clubId: 'a' }), 25);
		expect(result).toEqual({ factor: 1, sameClub: true, km: 0 });
	});

	it('fällt ohne Koordinaten auf einen neutralen Wert zurück statt auf 0', () => {
		const result = locationFactor(player({ clubId: 'a' }), player({ clubId: 'b' }), 25);
		expect(result.sameClub).toBe(false);
		expect(result.km).toBeNull();
		expect(result.factor).toBeGreaterThan(0);
		expect(result.factor).toBeLessThan(1);
	});

	it('wertet mit Koordinaten nach Entfernung ab und schneidet jenseits der Grenze ab', () => {
		const near = locationFactor(
			player({ clubId: 'a', latitude: 48.137, longitude: 11.575 }),
			player({ clubId: 'b', latitude: 48.15, longitude: 11.58 }),
			25
		);
		const tooFar = locationFactor(
			player({ clubId: 'a', latitude: 48.137, longitude: 11.575 }),
			player({ clubId: 'b', latitude: 49.452, longitude: 11.077 }),
			25
		);
		expect(near.factor).toBeGreaterThan(0.8);
		expect(tooFar.factor).toBe(0);
	});

	it('behandelt zwei vereinslose Spieler nicht als "gleicher Verein"', () => {
		const result = locationFactor(player({ clubId: null }), player({ clubId: null }), 25);
		expect(result.sameClub).toBe(false);
	});
});

describe('qualityForScore', () => {
	it('bildet die abgesprochenen Schwellen ab', () => {
		expect(qualityForScore(100)).toBe('excellent');
		expect(qualityForScore(85)).toBe('excellent');
		expect(qualityForScore(84)).toBe('good');
		expect(qualityForScore(70)).toBe('good');
		expect(qualityForScore(69)).toBe('possible');
		expect(qualityForScore(MIN_DISPLAY_SCORE)).toBe('possible');
		expect(qualityForScore(MIN_DISPLAY_SCORE - 1)).toBe('weak');
		expect(qualityForScore(0)).toBe('weak');
	});
});

describe('calculateMatchmakingScore', () => {
	it('gibt der Idealpaarung einen sehr hohen Score', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player({ rating: 4.05 }), slots: [slot()] },
			timesPlayedTogether: 0,
			now: NOW
		});

		expect(result.score).toBeGreaterThanOrEqual(85);
		expect(result.quality).toBe('excellent');
	});

	it('bestraft fehlende Zeitüberschneidung deutlich', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot({ weekday: 1 })] },
			candidate: { player: player({ rating: 4.0 }), slots: [slot({ weekday: 4 })] },
			now: NOW
		});

		expect(result.breakdown.timeOverlap).toBe(0);
		// Ohne gemeinsame Zeit entfällt auch der Format-/Typ-Anteil, weil kein
		// Slot-Paar existiert, auf das er sich beziehen könnte.
		expect(result.breakdown.formatAndType).toBe(0);
		expect(result.score).toBeLessThan(MIN_DISPLAY_SCORE);
	});

	it('bewertet ein weit entferntes Rating schlechter als ein nahes', () => {
		const близко = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player({ rating: 4.1 }), slots: [slot()] },
			now: NOW
		});
		const weit = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player({ rating: 6.8 }), slots: [slot()] },
			now: NOW
		});

		expect(близко.score).toBeGreaterThan(weit.score);
		expect(weit.breakdown.ratingProximity).toBe(0);
	});

	it('respektiert die Gewichtsobergrenzen je Kategorie', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player(), slots: [slot()] },
			now: NOW
		});

		expect(result.breakdown.timeOverlap).toBeLessThanOrEqual(MATCHMAKING_WEIGHTS.timeOverlap);
		expect(result.breakdown.ratingProximity).toBeLessThanOrEqual(MATCHMAKING_WEIGHTS.ratingProximity);
		expect(result.breakdown.location).toBeLessThanOrEqual(MATCHMAKING_WEIGHTS.location);
		expect(result.breakdown.formatAndType).toBeLessThanOrEqual(MATCHMAKING_WEIGHTS.formatAndType);
		expect(result.breakdown.activity).toBeLessThanOrEqual(MATCHMAKING_WEIGHTS.activity);
	});

	it('deckelt den Score bei 100 (Abwechslungsbonus darf nicht überlaufen)', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot({ startTime: '08:00', endTime: '22:00' })] },
			candidate: { player: player({ rating: 4.0 }), slots: [slot({ startTime: '08:00', endTime: '22:00' })] },
			timesPlayedTogether: 0,
			now: NOW
		});
		expect(result.score).toBeLessThanOrEqual(100);
	});

	it('bevorzugt bei sonst gleichen Voraussetzungen neue Partner', () => {
		// Bewusst KEINE Idealpaarung: bei zwei bereits gedeckelten 100ern könnte
		// ein 3-Punkte-Tiebreaker nichts mehr ausrichten (und müsste es auch
		// nicht — beide sind dann "sehr guter Match").
		const args = {
			me: { player: player(), slots: [slot()] },
			candidate: {
				player: player({ rating: 4.6, clubId: 'club-b', profileCompleteness: 0.5 }),
				slots: [slot({ clubId: 'club-b' })]
			},
			now: NOW
		};
		const neu = calculateMatchmakingScore({ ...args, timesPlayedTogether: 0 });
		const oft = calculateMatchmakingScore({ ...args, timesPlayedTogether: 10 });
		expect(neu.score).toBeGreaterThan(oft.score);
	});

	it('wertet inaktive Spieler ab', () => {
		const aktiv = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player({ lastMatchAt: '2026-03-18T12:00:00Z' }), slots: [slot()] },
			now: NOW
		});
		const inaktiv = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player({ lastMatchAt: '2025-01-01T12:00:00Z' }), slots: [slot()] },
			now: NOW
		});
		expect(aktiv.breakdown.activity).toBeGreaterThan(inaktiv.breakdown.activity);
	});

	it('kommt ohne je gespieltes Match aus (lastMatchAt = null)', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot()] },
			candidate: { player: player({ lastMatchAt: null, matchesPlayed: 0 }), slots: [slot()] },
			now: NOW
		});
		expect(Number.isFinite(result.score)).toBe(true);
		expect(result.score).toBeGreaterThanOrEqual(0);
	});

	it('liefert nachvollziehbare Gründe', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot({ matchType: 'competitive' })] },
			candidate: { player: player({ rating: 4.02 }), slots: [slot({ matchType: 'competitive' })] },
			timesPlayedTogether: 0,
			now: NOW
		});

		expect(result.reasons).toContain('Gleicher Verein');
		expect(result.reasons).toContain('Noch nie zusammen gespielt');
		expect(result.reasons.some((r) => r.includes('Wettkampf'))).toBe(true);
		expect(result.reasons.some((r) => r.includes('gemeinsame Zeit'))).toBe(true);
	});

	it('kommt mit komplett leeren Slot-Listen klar, statt zu werfen', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [] },
			candidate: { player: player(), slots: [] },
			now: NOW
		});
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.breakdown.timeOverlap).toBe(0);
	});

	it('sieht eine 90-Minuten-Überschneidung als volle Zeitpunktzahl', () => {
		const result = calculateMatchmakingScore({
			me: { player: player(), slots: [slot({ startTime: '18:00', endTime: '19:30' })] },
			candidate: { player: player(), slots: [slot({ startTime: '18:00', endTime: '19:30' })] },
			now: NOW
		});
		expect(result.breakdown.timeOverlap).toBe(MATCHMAKING_WEIGHTS.timeOverlap);
		expect(FULL_OVERLAP_MINUTES).toBe(90);
	});
});
