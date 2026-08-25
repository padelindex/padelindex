// Warteliste & Austritt/Ersatz mitten im Zyklus — siehe
// lib/server/league-admin.ts (departLeagueMember, listWaitlist) für die
// Begründung, warum das eine eigene Funktion braucht statt removeBoxMember
// wiederzuverwenden (die blockiert bei bereits gemeldeten Ergebnissen,
// hier ist genau das der Normalfall).

import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { departLeagueMember, loadCurrentCycle, loadLadder } from '$lib/server/league';
import { listWaitlist, requireLeagueAdmin } from '$lib/server/league-admin';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);

	const cycle = await loadCurrentCycle(admin, league.id);
	const [waitlist, boxes] = await Promise.all([
		listWaitlist(admin, league.id),
		cycle ? loadLadder(admin, cycle.id, league.config) : Promise.resolve([])
	]);

	return { league, cycle, waitlist, boxes };
};

export const actions: Actions = {
	depart: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);

		const form = await request.formData();
		const departingPlayerId = String(form.get('departingPlayerId') ?? '');
		const replacementRaw = String(form.get('replacementPlayerId') ?? '');
		const replacementPlayerId = replacementRaw === '' ? null : replacementRaw;

		if (!departingPlayerId) {
			return fail(400, { message: 'Kein Spieler ausgewählt.' });
		}

		const result = await departLeagueMember(
			admin,
			{
				leagueId: league.id,
				departingPlayerId,
				replacementPlayerId
			},
			{
				baseUrl: url.origin,
				leagueSlug: league.slug,
				leagueName: league.name,
				emailEnv: readEmailEnv(platform)
			}
		);

		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, replaced: replacementPlayerId !== null };
	}
};
