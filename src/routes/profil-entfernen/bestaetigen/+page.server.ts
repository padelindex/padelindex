import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { confirmDelisting } from '$lib/server/delisting';

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token') ?? '';
	return await confirmDelisting(supabaseAdmin(platform), token);
};
