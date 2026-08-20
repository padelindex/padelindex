import { describe, expect, it } from 'vitest';
import {
	LEVEL_QUESTIONS,
	estimateLevel,
	formatLevelParam,
	levelBand,
	parseLevelParam
} from './level-estimator';

function allAnswers(points: number): Record<string, number> {
	return Object.fromEntries(LEVEL_QUESTIONS.map((q) => [q.id, points]));
}

describe('estimateLevel', () => {
	it('gives 0 for the lowest answer to every question', () => {
		expect(estimateLevel(allAnswers(0))).toBe(0);
	});

	it('gives 7 for the highest answer to every question', () => {
		expect(estimateLevel(allAnswers(4))).toBe(7);
	});

	it('treats missing answers as 0 points instead of skewing the average', () => {
		const partial = { erfahrung: 4, haeufigkeit: 4 };
		const full = { ...allAnswers(0), erfahrung: 4, haeufigkeit: 4 };
		expect(estimateLevel(partial)).toBe(estimateLevel(full));
	});

	it('rounds to the nearest 0.5 step', () => {
		const level = estimateLevel({ ...allAnswers(0), erfahrung: 1 });
		expect(level * 2).toBe(Math.round(level * 2));
	});

	it('stays within 0..7 even with out-of-range input', () => {
		const level = estimateLevel({ ...allAnswers(0), erfahrung: 99 });
		expect(level).toBeLessThanOrEqual(7);
		expect(level).toBeGreaterThanOrEqual(0);
	});
});

describe('levelBand', () => {
	it('picks the lowest band at level 0', () => {
		expect(levelBand(0).label).toBe('Einstieg');
	});

	it('picks the highest band at level 7', () => {
		expect(levelBand(7).label).toBe('Sehr stark');
	});

	it('is monotonic: higher level never returns an earlier band', () => {
		const order = ['Einstieg', 'Aufbau', 'Fortgeschritten', 'Starker Vereinsspieler', 'Sehr stark'];
		let lastIndex = -1;
		for (let level = 0; level <= 7; level += 0.5) {
			const idx = order.indexOf(levelBand(level).label);
			expect(idx).toBeGreaterThanOrEqual(lastIndex);
			lastIndex = idx;
		}
	});
});

describe('level param round-trip', () => {
	it('formats and parses back to the same value', () => {
		for (const level of [0, 0.5, 3, 4.5, 7]) {
			expect(parseLevelParam(formatLevelParam(level))).toBe(level);
		}
	});

	it('returns null for missing or invalid input', () => {
		expect(parseLevelParam(null)).toBeNull();
		expect(parseLevelParam('nicht-numerisch')).toBeNull();
	});

	it('clamps out-of-range query values instead of trusting them', () => {
		expect(parseLevelParam('99')).toBe(7);
		expect(parseLevelParam('-5')).toBe(0);
	});
});
