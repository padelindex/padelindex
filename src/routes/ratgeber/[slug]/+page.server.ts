import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { GUIDES } from '$lib/guides-data';
import { findGuide, relatedGuides } from '$lib/guides';

export const load: PageServerLoad = ({ params }) => {
	const guide = findGuide(GUIDES, params.slug);
	if (!guide) {
		throw error(404, 'Ratgeberartikel nicht gefunden');
	}

	return { guide, related: relatedGuides(GUIDES, guide) };
};
