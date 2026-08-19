import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { requestDelisting } from '$lib/server/delisting';

export const load: PageServerLoad = async ({ url }) => {
	return { handle: url.searchParams.get('handle') ?? '' };
};

export const actions: Actions = {
	default: async ({ request, platform, url }) => {
		const form = await request.formData();
		const handle = String(form.get('handle') ?? '');
		const email = String(form.get('email') ?? '');

		const result = await requestDelisting(supabaseAdmin(platform), handle, email, {
			emailEnv: readEmailEnv(platform),
			baseUrl: url.origin
		});

		if (!result.ok) return { error: result.message, handle };
		return { sent: true };
	}
};
