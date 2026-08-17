import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAnon } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params, platform }) => {
	const sb = supabaseAnon(platform);
	if (!sb) return { club: null, unavailable: true as const };

	const { data: club, error: clubErr } = await sb
		.from('clubs')
		.select('name, slug')
		.eq('slug', params.slug)
		.maybeSingle();

	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');

	return { club, unavailable: false as const };
};
