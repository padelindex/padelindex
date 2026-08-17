import { describe, expect, it } from 'vitest';
import {
	BASE_SIGMA,
	computeDominance,
	computeMatchRatings,
	computeTokenGrants,
	marginFactor,
	seedRating,
	streakFactor,
	toDisplayRating,
	type PlayerState
} from './rating';

function player(id: string, mu = 25, sigma = BASE_SIGMA, matches = 0, streak = 0): PlayerState {
	return { playerId: id, mu, sigma, matchesPlayed: matches, currentStreak: streak };
}

describe('toDisplayRating', () => {
	it('maps a fresh player near the low end of 0–7', () => {
		const rating = toDisplayRating(25, BASE_SIGMA);
		expect(rating).toBeGreaterThanOrEqual(0);
		expect(rating).toBeLessThan(2);
	});

	it('clamps to 0–7', () => {
		expect(toDisplayRating(0, 0)).toBe(0);
		expect(toDisplayRating(100, 0)).toBe(7);
	});
});

describe('seedRating', () => {
	it('starts conservatively below the self-assessed level', () => {
		const seed = seedRating(4);
		expect(seed.sigma).toBe(BASE_SIGMA);
		expect(toDisplayRating(seed.mu, seed.sigma)).toBeLessThan(4);
	});
});

describe('margin and streak', () => {
	it('treats 6:0 6:0 as high dominance', () => {
		expect(
			computeDominance(
				[
					{ team1Games: 6, team2Games: 0 },
					{ team1Games: 6, team2Games: 0 }
				],
				true
			)
		).toBe(1);
		expect(marginFactor(1)).toBeCloseTo(1.3);
	});

	it('amplifies only when a streak continues', () => {
		expect(streakFactor(3, true)).toBeGreaterThan(1);
		expect(streakFactor(3, false)).toBe(1);
		expect(streakFactor(0, true)).toBe(1);
	});
});

describe('computeMatchRatings', () => {
	it('moves winners up and losers down in a 2v2', () => {
		const results = computeMatchRatings({
			team1: [player('a'), player('b')],
			team2: [player('c'), player('d')],
			sets: [
				{ team1Games: 6, team2Games: 3 },
				{ team1Games: 6, team2Games: 2 }
			]
		});
		expect(results).toHaveLength(4);
		const a = results.find((r) => r.playerId === 'a');
		const c = results.find((r) => r.playerId === 'c');
		expect(a?.factors.won).toBe(true);
		expect(c?.factors.won).toBe(false);
		expect(a!.muAfter).toBeGreaterThan(a!.muBefore);
		expect(c!.muAfter).toBeLessThan(c!.muBefore);
		expect(a!.sigmaAfter).toBeLessThanOrEqual(a!.sigmaBefore);
	});
});

describe('computeTokenGrants', () => {
	it('credits play, win, and a 50-match milestone', () => {
		const states = [player('a', 25, BASE_SIGMA, 49, 0), player('b', 25, BASE_SIGMA, 49, 0)];
		const results = computeMatchRatings({
			team1: states,
			team2: [player('c'), player('d')],
			sets: [
				{ team1Games: 6, team2Games: 1 },
				{ team1Games: 6, team2Games: 1 }
			]
		});
		const grants = computeTokenGrants(results, [...states, player('c'), player('d')], 'manual');
		const forA = grants.filter((g) => g.playerId === 'a');
		expect(forA.some((g) => g.reason === 'match_played' && g.amount === 10)).toBe(true);
		expect(forA.some((g) => g.reason === 'match_won' && g.amount === 15)).toBe(true);
		expect(forA.some((g) => g.reason === 'milestone' && g.amount === 100)).toBe(true);
	});
});
