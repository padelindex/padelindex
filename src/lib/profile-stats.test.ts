import { describe, expect, it } from 'vitest';
import { computeFormCurve, computePreferredPartners } from './profile-stats';

describe('computeFormCurve', () => {
	it('rechnet Siegquote und Games-Differenz über das Fenster', () => {
		const entries = [
			{ won: true, myTeam: 1 as const, sets: [{ team1Games: 6, team2Games: 4 }] },
			{ won: false, myTeam: 2 as const, sets: [{ team1Games: 6, team2Games: 3 }] },
			{ won: true, myTeam: 1 as const, sets: [{ team1Games: 6, team2Games: 2 }] }
		];
		const curve = computeFormCurve(entries, 3);
		expect(curve.matchesCounted).toBe(3);
		expect(curve.winRate).toBeCloseTo(2 / 3, 3);
		// +2 (6:4) -3 (verloren als team2: 3-6) +4 (6:2) = 3
		expect(curve.gameDiff).toBe(3);
	});

	it('schneidet nur die ersten `window` Einträge (neueste zuerst)', () => {
		const entries = Array.from({ length: 20 }, (_, i) => ({
			won: i < 5,
			myTeam: 1 as const,
			sets: [{ team1Games: 6, team2Games: 0 }]
		}));
		expect(computeFormCurve(entries, 5).winRate).toBe(1);
		expect(computeFormCurve(entries, 10).winRate).toBe(0.5);
	});

	it('leere Historie -> alles 0, kein Crash', () => {
		expect(computeFormCurve([], 10)).toEqual({
			window: 10,
			matchesCounted: 0,
			winRate: 0,
			gameDiff: 0
		});
	});
});

describe('computePreferredPartners', () => {
	it('zählt nach Partner-id, nicht nach Namen (Namensgleichheit darf nicht verschmelzen)', () => {
		const entries = [
			{ partner: { id: 'a', handle: 'h-a', name: 'Max K.', claimed: true } },
			{ partner: { id: 'a', handle: 'h-a', name: 'Max K.', claimed: true } },
			{ partner: { id: 'b', handle: 'h-b', name: 'Max K.', claimed: false } },
			{ partner: null }
		];
		const result = computePreferredPartners(entries, 3);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ id: 'a', handle: 'h-a', name: 'Max K.', claimed: true, count: 2 });
		expect(result[1].count).toBe(1);
	});

	it('begrenzt auf top N', () => {
		const entries = [
			{ partner: { id: 'a', handle: 'h-a', name: 'A', claimed: true } },
			{ partner: { id: 'b', handle: 'h-b', name: 'B', claimed: true } },
			{ partner: { id: 'b', handle: 'h-b', name: 'B', claimed: true } },
			{ partner: { id: 'c', handle: 'h-c', name: 'C', claimed: true } },
			{ partner: { id: 'c', handle: 'h-c', name: 'C', claimed: true } },
			{ partner: { id: 'c', handle: 'h-c', name: 'C', claimed: true } }
		];
		const result = computePreferredPartners(entries, 2);
		expect(result.map((p) => p.id)).toEqual(['c', 'b']);
	});
});
