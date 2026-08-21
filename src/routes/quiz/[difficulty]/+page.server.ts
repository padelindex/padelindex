import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { difficultiesFor, questionsFor } from '$lib/quiz-data';
import { findGuide, guidesFor } from '$lib/guides';
import type { QuizDifficultySlug } from '$lib/quiz';

const VALID_SLUGS: QuizDifficultySlug[] = ['anfaenger', 'fortgeschritten', 'experte'];

function isValidSlug(value: string): value is QuizDifficultySlug {
	return (VALID_SLUGS as string[]).includes(value);
}

export const load: PageServerLoad = ({ params, locals }) => {
	if (!isValidSlug(params.difficulty)) {
		throw error(404, 'Unbekannter Schwierigkeitsgrad');
	}

	const difficulty = difficultiesFor(locals.locale).find((d) => d.slug === params.difficulty);
	if (!difficulty) {
		throw error(404, 'Unbekannter Schwierigkeitsgrad');
	}

	const questions = questionsFor(locals.locale, difficulty.slug);
	const guides = guidesFor(locals.locale);
	const recommendedGuides = difficulty.recommendedGuideSlugs
		.map((slug) => findGuide(guides, slug))
		.filter((g) => g !== undefined);

	return { difficulty, questions, recommendedGuides };
};
