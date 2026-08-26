import { describe, expect, it } from 'vitest';
import {
	CHALLENGE_RANGE_CONFIG,
	MAX_ACTIVE_OUTGOING_CHALLENGES,
	PLAY_REQUEST_RESEND_COOLDOWN_HOURS,
	RECHALLENGE_COOLDOWN_DAYS,
	canChallenge,
	canTransitionChallenge,
	canTransitionPlayRequest,
	getChallengeRange,
	isExpired,
	isRankChallengeable,
	playRequestResendCooldownHoursLeft
} from './challenge-rules';

describe('getChallengeRange', () => {
	it('große Rangliste: genau 10 Plätze nach oben (Beispiel aus der Anforderung)', () => {
		// Rang 25 von 100 -> 20 % wären 20, gedeckelt auf default 10 -> 15..24
		const range = getChallengeRange(25, 100);
		expect(range.placesAbove).toBe(10);
		expect(range.startRank).toBe(15);
		expect(range.endRank).toBe(24);
	});

	it('kleine Rangliste: prozentual, aber mindestens 3 Plätze', () => {
		// 12 Spieler -> 20 % = 2.4 -> ceil 3 -> Minimum greift ohnehin
		const range = getChallengeRange(10, 12);
		expect(range.placesAbove).toBe(3);
		expect(range.startRank).toBe(7);
		expect(range.endRank).toBe(9);
	});

	it('überschreitet nie das Maximum von 15', () => {
		const generous = { ...CHALLENGE_RANGE_CONFIG, defaultPlacesAbove: 50 };
		const range = getChallengeRange(80, 500, generous);
		expect(range.placesAbove).toBeLessThanOrEqual(15);
		expect(range.placesAbove).toBe(15);
	});

	it('unterschreitet nie das Minimum von 3', () => {
		const range = getChallengeRange(5, 4);
		expect(range.placesAbove).toBe(3);
	});

	it('Rang 1 kann niemanden herausfordern', () => {
		expect(getChallengeRange(1, 50).startRank).toBeNull();
		expect(getChallengeRange(1, 50).endRank).toBeNull();
	});

	it('startRank rutscht nie unter 1', () => {
		// Rang 4 mit 10 erlaubten Plätzen würde rechnerisch bei -6 landen
		const range = getChallengeRange(4, 200);
		expect(range.startRank).toBe(1);
		expect(range.endRank).toBe(3);
	});

	it('leere oder einköpfige Rangliste liefert keine Range', () => {
		expect(getChallengeRange(1, 1).startRank).toBeNull();
		expect(getChallengeRange(5, 1).startRank).toBeNull();
	});
});

describe('isRankChallengeable', () => {
	it('akzeptiert die Ränder der Range und lehnt alles daneben ab', () => {
		// Rang 25 von 100 -> 15..24
		expect(isRankChallengeable(25, 15, 100)).toBe(true);
		expect(isRankChallengeable(25, 24, 100)).toBe(true);
		expect(isRankChallengeable(25, 14, 100)).toBe(false); // zu weit oben
		expect(isRankChallengeable(25, 25, 100)).toBe(false); // man selbst
		expect(isRankChallengeable(25, 26, 100)).toBe(false); // schlechter platziert
	});
});

describe('canChallenge', () => {
	const base = {
		challengerRank: 25,
		challengedRank: 20,
		totalPlayers: 100,
		activeOutgoingChallenges: 0,
		hasOpenChallengeAgainstTarget: false
	};

	it('erlaubt eine reguläre Challenge nach oben', () => {
		expect(canChallenge(base)).toEqual({ ok: true });
	});

	it('verhindert Selbst-Herausforderung', () => {
		expect(canChallenge({ ...base, challengedRank: 25 }).ok).toBe(false);
	});

	it('verhindert Herausforderung nach unten', () => {
		const result = canChallenge({ ...base, challengedRank: 40 });
		expect(result.ok).toBe(false);
		expect(result).toMatchObject({ message: expect.stringContaining('höher platzierte') });
	});

	it('verhindert Challenge außerhalb der Range', () => {
		const result = canChallenge({ ...base, challengedRank: 5 });
		expect(result.ok).toBe(false);
		expect(result).toMatchObject({ message: expect.stringContaining('15 bis 24') });
	});

	it('verhindert doppelte offene Challenge gegen denselben Gegner', () => {
		const result = canChallenge({ ...base, hasOpenChallengeAgainstTarget: true });
		expect(result.ok).toBe(false);
		expect(result).toMatchObject({ message: expect.stringContaining('bereits eine Challenge') });
	});

	it('begrenzt die Zahl gleichzeitig offener ausgehender Challenges', () => {
		const atLimit = canChallenge({
			...base,
			activeOutgoingChallenges: MAX_ACTIVE_OUTGOING_CHALLENGES
		});
		expect(atLimit.ok).toBe(false);

		const belowLimit = canChallenge({
			...base,
			activeOutgoingChallenges: MAX_ACTIVE_OUTGOING_CHALLENGES - 1
		});
		expect(belowLimit.ok).toBe(true);
	});

	it('sperrt nach einer Absage für die Cooldown-Dauer', () => {
		const now = new Date('2026-03-20T12:00:00Z');
		const justDeclined = new Date('2026-03-19T12:00:00Z').toISOString();
		const longAgo = new Date('2026-02-01T12:00:00Z').toISOString();

		expect(canChallenge({ ...base, lastDeclinedAt: justDeclined, now }).ok).toBe(false);
		expect(canChallenge({ ...base, lastDeclinedAt: longAgo, now }).ok).toBe(true);
	});

	it('Cooldown endet exakt nach RECHALLENGE_COOLDOWN_DAYS', () => {
		const now = new Date('2026-03-20T12:00:00Z');
		const exactly = new Date(now.getTime() - RECHALLENGE_COOLDOWN_DAYS * 86_400_000).toISOString();
		expect(canChallenge({ ...base, lastDeclinedAt: exactly, now }).ok).toBe(true);
	});

	it('respektiert einen Spieler, der keine Challenges annimmt', () => {
		expect(canChallenge({ ...base, targetAcceptsChallenges: false }).ok).toBe(false);
		expect(canChallenge({ ...base, targetAcceptsChallenges: true }).ok).toBe(true);
	});
});

describe('Statusübergänge', () => {
	it('erlaubt nur sinnvolle Challenge-Übergänge', () => {
		expect(canTransitionChallenge('pending', 'accepted')).toBe(true);
		expect(canTransitionChallenge('pending', 'declined')).toBe(true);
		expect(canTransitionChallenge('accepted', 'completed')).toBe(true);
	});

	it('lässt Endzustände nicht wiederbeleben', () => {
		expect(canTransitionChallenge('expired', 'accepted')).toBe(false);
		expect(canTransitionChallenge('declined', 'accepted')).toBe(false);
		expect(canTransitionChallenge('completed', 'pending')).toBe(false);
		expect(canTransitionChallenge('cancelled', 'accepted')).toBe(false);
	});

	it('erlaubt nur sinnvolle Anfrage-Übergänge', () => {
		expect(canTransitionPlayRequest('pending', 'accepted')).toBe(true);
		expect(canTransitionPlayRequest('pending', 'cancelled')).toBe(true);
		// Eine angenommene Anfrage ist abgeschlossen — kein nachträgliches Ablehnen.
		expect(canTransitionPlayRequest('accepted', 'declined')).toBe(false);
		expect(canTransitionPlayRequest('expired', 'accepted')).toBe(false);
	});
});

describe('isExpired', () => {
	const now = new Date('2026-03-20T12:00:00Z');

	it('erkennt abgelaufene und laufende Fristen', () => {
		expect(isExpired('2026-03-19T12:00:00Z', now)).toBe(true);
		expect(isExpired('2026-03-21T12:00:00Z', now)).toBe(false);
	});

	it('behandelt den exakten Ablaufzeitpunkt als abgelaufen', () => {
		expect(isExpired('2026-03-20T12:00:00Z', now)).toBe(true);
	});
});

describe('playRequestResendCooldownHoursLeft', () => {
	const now = new Date('2026-03-20T12:00:00Z');

	it('keine Sperre ohne vorherige Ablehnung', () => {
		expect(playRequestResendCooldownHoursLeft(null, now)).toBe(0);
	});

	it('sperrt direkt nach einer Ablehnung für die volle Cooldown-Dauer', () => {
		expect(playRequestResendCooldownHoursLeft(now.toISOString(), now)).toBe(
			PLAY_REQUEST_RESEND_COOLDOWN_HOURS
		);
	});

	it('zählt die verbleibenden Stunden herunter', () => {
		const declinedAt = new Date(now.getTime() - 20 * 3_600_000).toISOString();
		expect(playRequestResendCooldownHoursLeft(declinedAt, now)).toBe(4);
	});

	it('keine Sperre mehr, sobald die Cooldown-Dauer verstrichen ist', () => {
		const declinedAt = new Date(
			now.getTime() - PLAY_REQUEST_RESEND_COOLDOWN_HOURS * 3_600_000
		).toISOString();
		expect(playRequestResendCooldownHoursLeft(declinedAt, now)).toBe(0);
	});
});
