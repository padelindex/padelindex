// ============================================================
// PadelIndex — Quiz: Typen und reine Hilfsfunktionen
// ============================================================
// Reine Logik ohne DOM-Zugriff, damit Punktzahl-/Ergebnis-Berechnung
// unabhängig vom Svelte-Component testbar ist (gleiches Muster wie
// roulette-wheel.ts).

export type QuizDifficultySlug = 'anfaenger' | 'fortgeschritten' | 'experte';

export type QuizOptionId = 'A' | 'B' | 'C' | 'D';

export type QuizOption = {
	id: QuizOptionId;
	text: string;
};

export type QuizQuestion = {
	id: string;
	difficulty: QuizDifficultySlug;
	question: string;
	options: QuizOption[];
	correctOptionId: QuizOptionId;
	explanation: string;
	relatedGuideSlugs: string[];
};

export type QuizDifficulty = {
	slug: QuizDifficultySlug;
	label: string;
	description: string;
	color: string;
	metaTitle: string;
	metaDescription: string;
	recommendedGuideSlugs: string[];
};

export type QuizResultTier = {
	minPercentage: number;
	maxPercentage: number;
	title: string;
	text: string;
};

export function percentageFor(scoreCorrect: number, totalQuestions: number): number {
	if (totalQuestions <= 0) return 0;
	return Math.round((scoreCorrect / totalQuestions) * 100);
}

export function resultTierFor(tiers: QuizResultTier[], percentage: number): QuizResultTier {
	const match = tiers.find((t) => percentage >= t.minPercentage && percentage <= t.maxPercentage);
	// Fallback auf die höchste Stufe, falls Rundungsfehler eine 100%-Kante verfehlen — darf nie ohne Treffer bleiben.
	return match ?? tiers[tiers.length - 1];
}

export function shareText(
	difficulty: QuizDifficulty,
	scoreCorrect: number,
	total: number,
	percentage: number
): string {
	return `Ich habe beim PadelIndex-Quiz (${difficulty.label}) ${scoreCorrect} von ${total} Fragen richtig beantwortet (${percentage} %). Teste dein Padel-Wissen: https://padelindex.de/quiz/${difficulty.slug}`;
}
