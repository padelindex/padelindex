import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		email: locals.user?.email ?? null,
		player: locals.player
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) {
			await locals.supabase.auth.signOut();
		}
		throw redirect(303, '/');
	}
};
