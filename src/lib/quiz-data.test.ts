import { describe, it, expect } from 'vitest';
import { QUIZ_QUESTIONS, QUIZ_DIFFICULTIES, questionsFor } from './quiz-data';
import { GUIDES_DE as GUIDES } from './content/guides/de';

describe('quiz-data Integrität', () => {
	it('hat für jede Frage eine eindeutige ID', () => {
		const ids = QUIZ_QUESTIONS.map((q) => q.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('hat für jede der drei Schwierigkeiten mindestens 10 Fragen', () => {
		for (const d of QUIZ_DIFFICULTIES) {
			expect(questionsFor(d.slug).length).toBeGreaterThanOrEqual(10);
		}
	});

	it('hat pro Frage genau 4 Antwortoptionen mit den IDs A–D', () => {
		for (const q of QUIZ_QUESTIONS) {
			expect(q.options.map((o) => o.id).sort()).toEqual(['A', 'B', 'C', 'D']);
		}
	});

	it('hat pro Frage eine korrekte Antwort, die auch unter den Optionen existiert', () => {
		for (const q of QUIZ_QUESTIONS) {
			expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
		}
	});

	it('verlinkt relatedGuideSlugs nur auf existierende Ratgeberartikel', () => {
		const guideSlugs = new Set(GUIDES.map((g) => g.slug));
		for (const q of QUIZ_QUESTIONS) {
			for (const slug of q.relatedGuideSlugs) {
				expect(guideSlugs.has(slug), `${q.id} verlinkt auf unbekannten Ratgeber "${slug}"`).toBe(
					true
				);
			}
		}
	});

	it('verlinkt recommendedGuideSlugs je Schwierigkeit nur auf existierende Artikel', () => {
		const guideSlugs = new Set(GUIDES.map((g) => g.slug));
		for (const d of QUIZ_DIFFICULTIES) {
			for (const slug of d.recommendedGuideSlugs) {
				expect(guideSlugs.has(slug)).toBe(true);
			}
		}
	});

	it('hat für jede Schwierigkeit genau eine Konfiguration', () => {
		const slugs = QUIZ_DIFFICULTIES.map((d) => d.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(slugs.sort()).toEqual(['anfaenger', 'experte', 'fortgeschritten']);
	});
});

describe('questionsFor', () => {
	it('gibt nur Fragen der angefragten Schwierigkeit zurück', () => {
		const result = questionsFor('experte');
		expect(result.every((q) => q.difficulty === 'experte')).toBe(true);
	});
});
