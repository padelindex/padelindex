// ============================================================
// PadelIndex — Quiz: lokalisierte Content-Quelle
// ============================================================
// Content liegt je Sprache in src/lib/content/quiz/{de,en,es}.ts (kein
// CMS) — identische Fragen-IDs/Struktur, nur der Text unterscheidet
// sich. Gleiches Muster wie guidesFor() in guides.ts.

import type { Locale } from './paraglide/runtime';
import type { QuizDifficulty, QuizDifficultySlug, QuizQuestion, QuizResultTier } from './quiz';
import { QUIZ_DIFFICULTIES_DE, QUIZ_RESULT_TIERS_DE, QUIZ_QUESTIONS_DE } from './content/quiz/de';
import { QUIZ_DIFFICULTIES_EN, QUIZ_RESULT_TIERS_EN, QUIZ_QUESTIONS_EN } from './content/quiz/en';
import { QUIZ_DIFFICULTIES_ES, QUIZ_RESULT_TIERS_ES, QUIZ_QUESTIONS_ES } from './content/quiz/es';

export function difficultiesFor(locale: Locale): QuizDifficulty[] {
	switch (locale) {
		case 'en':
			return QUIZ_DIFFICULTIES_EN;
		case 'es':
			return QUIZ_DIFFICULTIES_ES;
		default:
			return QUIZ_DIFFICULTIES_DE;
	}
}

export function resultTiersFor(locale: Locale): QuizResultTier[] {
	switch (locale) {
		case 'en':
			return QUIZ_RESULT_TIERS_EN;
		case 'es':
			return QUIZ_RESULT_TIERS_ES;
		default:
			return QUIZ_RESULT_TIERS_DE;
	}
}

export function allQuestionsFor(locale: Locale): QuizQuestion[] {
	switch (locale) {
		case 'en':
			return QUIZ_QUESTIONS_EN;
		case 'es':
			return QUIZ_QUESTIONS_ES;
		default:
			return QUIZ_QUESTIONS_DE;
	}
}

export function questionsFor(locale: Locale, difficulty: QuizDifficultySlug): QuizQuestion[] {
	return allQuestionsFor(locale).filter((q) => q.difficulty === difficulty);
}
