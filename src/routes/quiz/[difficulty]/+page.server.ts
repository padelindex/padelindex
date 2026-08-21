import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { QUIZ_DIFFICULTIES, questionsFor } from '$lib/quiz-data';
import { GUIDES } from '$lib/guides-data';
import { findGuide } from '$lib/guides';
import type { QuizDifficultySlug } from '$lib/quiz';

const VALID_SLUGS: QuizDifficultySlug[] = ['anfaenger', 'fortgeschritten', 'experte'];

function isValidSlug(value: string): value is QuizDifficultySlug {
	return (VALID_SLUGS as string[]).includes(value);
}

export const load: PageServerLoad = ({ params }) => {
	if (!isValidSlug(params.difficulty)) {
		throw error(404, 'Unbekannter Schwierigkeitsgrad');
	}

	const difficulty = QUIZ_DIFFICULTIES.find((d) => d.slug === params.difficulty);
	if (!difficulty) {
		throw error(404, 'Unbekannter Schwierigkeitsgrad');
	}

	const questions = questionsFor(difficulty.slug);
	const recommendedGuides = difficulty.recommendedGuideSlugs
		.map((slug) => findGuide(GUIDES, slug))
		.filter((g) => g !== undefined);

	return { difficulty, questions, recommendedGuides };
};
