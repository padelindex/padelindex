import { describe, it, expect } from 'vitest';
import { percentageFor, resultTierFor, shareText } from './quiz';
import { resultTiersFor, difficultiesFor } from './quiz-data';

const QUIZ_RESULT_TIERS = resultTiersFor('de');
const QUIZ_DIFFICULTIES = difficultiesFor('de');

describe('percentageFor', () => {
	it('rechnet Prozent korrekt', () => {
		expect(percentageFor(10, 10)).toBe(100);
		expect(percentageFor(0, 10)).toBe(0);
		expect(percentageFor(5, 10)).toBe(50);
	});

	it('rundet auf ganze Prozent', () => {
		expect(percentageFor(1, 3)).toBe(33);
		expect(percentageFor(2, 3)).toBe(67);
	});

	it('gibt 0 bei 0 Fragen zurück, statt durch 0 zu teilen', () => {
		expect(percentageFor(0, 0)).toBe(0);
	});
});

describe('resultTierFor', () => {
	it('findet die richtige Stufe für Randwerte', () => {
		expect(resultTierFor(QUIZ_RESULT_TIERS, 0).title).toBe('Noch Luft nach oben');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 39).title).toBe('Noch Luft nach oben');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 40).title).toBe('Solide Basis');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 69).title).toBe('Solide Basis');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 70).title).toBe('Starkes Padel-Wissen');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 89).title).toBe('Starkes Padel-Wissen');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 90).title).toBe('Padel-Experte');
		expect(resultTierFor(QUIZ_RESULT_TIERS, 100).title).toBe('Padel-Experte');
	});

	it('deckt jeden Prozentwert von 0 bis 100 ab (keine Lücke zwischen den Stufen)', () => {
		for (let p = 0; p <= 100; p++) {
			expect(() => resultTierFor(QUIZ_RESULT_TIERS, p)).not.toThrow();
			expect(resultTierFor(QUIZ_RESULT_TIERS, p)).toBeDefined();
		}
	});
});

describe('shareText', () => {
	it('enthält Schwierigkeit, Punktzahl und Link (DE)', () => {
		const difficulty = QUIZ_DIFFICULTIES[0];
		const url = `https://padelindex.de/quiz/${difficulty.slug}`;
		const text = shareText(difficulty, 8, 10, 80, url, 'de');
		expect(text).toContain(difficulty.label);
		expect(text).toContain('8');
		expect(text).toContain('10');
		expect(text).toContain('80 %');
		expect(text).toContain(url);
	});

	it('übersetzt den Text je nach übergebener locale', () => {
		const difficulty = difficultiesFor('en')[0];
		const url = `https://padelindex.de/en/quiz/${difficulty.slug}`;
		const text = shareText(difficulty, 8, 10, 80, url, 'en');
		expect(text).toContain('correctly');
		expect(text).toContain(url);
	});
});
