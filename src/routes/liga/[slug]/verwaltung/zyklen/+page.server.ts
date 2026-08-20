import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { listCycles, requireLeagueAdmin } from '$lib/server/league-admin';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const cycles = await listCycles(supabaseAdmin(platform), league.id);
	return { league, cycles };
};
