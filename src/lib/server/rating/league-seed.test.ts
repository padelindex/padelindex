import { describe, expect, it } from 'vitest';
import {
	LEAGUE_BOTTOM_DISPLAY,
	LEAGUE_TOP_DISPLAY,
	seedFromLeagueRank,
	seedWithoutRank
} from './league-seed';
import { BASE_SIGMA, toDisplayRating } from './rating';

describe('seedFromLeagueRank', () => {
	it('bildet Rang 1 auf das obere Ende der Skala ab', () => {
		const seed = seedFromLeagueRank(1, 84);
		expect(toDisplayRating(seed.mu, seed.sigma)).toBeCloseTo(LEAGUE_TOP_DISPLAY, 1);
	});

	it('bildet den letzten Rang auf das untere Ende ab', () => {
		const seed = seedFromLeagueRank(84, 84);
		expect(toDisplayRating(seed.mu, seed.sigma)).toBeCloseTo(LEAGUE_BOTTOM_DISPLAY, 1);
	});

	it('hält die Reihenfolge der Liga ein', () => {
		const ratings = [1, 10, 40, 70, 84].map((r) => {
			const s = seedFromLeagueRank(r, 84);
			return toDisplayRating(s.mu, s.sigma);
		});
		const sorted = [...ratings].sort((a, b) => b - a);
		expect(ratings).toEqual(sorted);
	});

	it('bleibt unter der vollen Startunsicherheit, aber deutlich darüber als bei echten Matches', () => {
		const seed = seedFromLeagueRank(20, 84);
		expect(seed.sigma).toBeLessThan(BASE_SIGMA);
		expect(seed.sigma).toBeGreaterThan(BASE_SIGMA * 0.5);
	});

	it('fängt Ränge außerhalb der Liga ab', () => {
		expect(seedFromLeagueRank(0, 84).mu).toEqual(seedFromLeagueRank(1, 84).mu);
		expect(seedFromLeagueRank(999, 84).mu).toEqual(seedFromLeagueRank(84, 84).mu);
	});

	it('setzt einen einzelnen Spieler in die Mitte', () => {
		const seed = seedFromLeagueRank(1, 1);
		const mid = (LEAGUE_TOP_DISPLAY + LEAGUE_BOTTOM_DISPLAY) / 2;
		expect(seed.targetDisplay).toBeCloseTo(mid, 4);
	});
});

describe('seedWithoutRank', () => {
	it('startet mit voller Unsicherheit', () => {
		expect(seedWithoutRank().sigma).toBe(BASE_SIGMA);
	});

	it('liegt zwischen den Skalenenden', () => {
		const d = seedWithoutRank().targetDisplay;
		expect(d).toBeGreaterThan(LEAGUE_BOTTOM_DISPLAY);
		expect(d).toBeLessThan(LEAGUE_TOP_DISPLAY);
	});
});
