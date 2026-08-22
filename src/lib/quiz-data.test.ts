import { describe, it, expect } from 'vitest';
import { allQuestionsFor, difficultiesFor, questionsFor } from './quiz-data';
import { GUIDES_DE as GUIDES } from './content/guides/de';
import { QUIZ_QUESTIONS_DE } from './content/quiz/de';
import { QUIZ_QUESTIONS_EN } from './content/quiz/en';
import { QUIZ_QUESTIONS_ES } from './content/quiz/es';
import type { QuizQuestion } from './quiz';

const QUIZ_QUESTIONS = QUIZ_QUESTIONS_DE;
const QUIZ_DIFFICULTIES = difficultiesFor('de');

describe('quiz-data Integrität (DE)', () => {
	it('hat für jede Frage eine eindeutige ID', () => {
		const ids = QUIZ_QUESTIONS.map((q) => q.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('hat für jede der drei Schwierigkeiten mindestens 10 Fragen', () => {
		for (const d of QUIZ_DIFFICULTIES) {
			expect(questionsFor('de', d.slug).length).toBeGreaterThanOrEqual(10);
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
		const result = questionsFor('de', 'experte');
		expect(result.every((q) => q.difficulty === 'experte')).toBe(true);
	});
});

describe('Übersetzungsparität DE/EN/ES', () => {
	const locales: [string, QuizQuestion[]][] = [
		['en', QUIZ_QUESTIONS_EN],
		['es', QUIZ_QUESTIONS_ES]
	];

	it('hat in jeder Sprache dieselbe Anzahl Fragen', () => {
		for (const [, questions] of locales) {
			expect(questions.length).toBe(QUIZ_QUESTIONS.length);
		}
	});

	it('hat in jeder Sprache dieselben Frage-IDs in derselben Reihenfolge', () => {
		const deIds = QUIZ_QUESTIONS.map((q) => q.id);
		for (const [locale, questions] of locales) {
			expect(
				questions.map((q) => q.id),
				`IDs weichen ab für ${locale}`
			).toEqual(deIds);
		}
	});

	it('hat pro Frage in jeder Sprache dieselbe difficulty/correctOptionId/relatedGuideSlugs', () => {
		for (const [locale, questions] of locales) {
			for (const deQ of QUIZ_QUESTIONS) {
				const translated = questions.find((q) => q.id === deQ.id) as QuizQuestion;
				expect(translated.difficulty, `${deQ.id} (${locale})`).toBe(deQ.difficulty);
				expect(translated.correctOptionId, `${deQ.id} (${locale})`).toBe(deQ.correctOptionId);
				expect(translated.relatedGuideSlugs, `${deQ.id} (${locale})`).toEqual(
					deQ.relatedGuideSlugs
				);
				expect(
					translated.options.map((o) => o.id),
					`${deQ.id} (${locale})`
				).toEqual(deQ.options.map((o) => o.id));
			}
		}
	});

	it('hat in jeder Sprache dieselbe Anzahl Schwierigkeiten mit denselben Slugs', () => {
		const deSlugs = difficultiesFor('de').map((d) => d.slug);
		for (const locale of ['en', 'es'] as const) {
			expect(difficultiesFor(locale).map((d) => d.slug)).toEqual(deSlugs);
		}
	});

	it('gibt für jede Sprache dieselbe Gesamtanzahl Fragen über allQuestionsFor zurück', () => {
		for (const locale of ['de', 'en', 'es'] as const) {
			expect(allQuestionsFor(locale).length).toBe(QUIZ_QUESTIONS.length);
		}
	});
});
