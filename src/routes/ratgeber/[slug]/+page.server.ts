import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findGuide, relatedGuides, guidesFor } from '$lib/guides';

export const load: PageServerLoad = ({ params, locals }) => {
	const guides = guidesFor(locals.locale);
	const guide = findGuide(guides, params.slug);
	if (!guide) {
		throw error(404, 'Ratgeberartikel nicht gefunden');
	}

	return { guide, related: relatedGuides(guides, guide) };
};
