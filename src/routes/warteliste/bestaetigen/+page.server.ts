import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { confirmWaitlistSignup } from '$lib/server/waitlist';

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token') ?? '';
	return await confirmWaitlistSignup(supabaseAdmin(platform), token);
};
