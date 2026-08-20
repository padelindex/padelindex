import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { createCycle, listSeasons, nextCycleOrdinal, requireLeagueAdmin } from '$lib/server/league-admin';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);

	const seasons = await listSeasons(admin, league.id);
	const latest = seasons.find((s) => s.status !== 'completed') ?? seasons[0] ?? null;
	const suggestedOrdinal = latest ? await nextCycleOrdinal(admin, latest.id) : 1;

	return { league, seasons, suggestedOrdinal, suggestedSeasonId: latest?.id ?? null };
};

export const actions: Actions = {
	default: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);

		const form = await request.formData();
		const seasonId = String(form.get('seasonId') ?? '') || null;
		const newSeasonName = String(form.get('newSeasonName') ?? '').trim() || null;
		const ordinalRaw = String(form.get('ordinal') ?? '');
		const name = String(form.get('name') ?? '').trim() || null;
		const startDate = String(form.get('startDate') ?? '');
		const endDate = String(form.get('endDate') ?? '');

		const ordinal = Number(ordinalRaw);
		if (!Number.isInteger(ordinal) || ordinal < 1) {
			return fail(400, { message: 'Zyklusnummer muss eine ganze Zahl ≥ 1 sein.' });
		}
		if (!startDate || !endDate) {
			return fail(400, { message: 'Bitte Start- und Enddatum angeben.' });
		}

		const result = await createCycle(supabaseAdmin(platform), league.id, {
			seasonId,
			newSeasonName,
			ordinal,
			name,
			startDate,
			endDate
		});

		if (!result.ok) return fail(400, { message: result.message });

		throw redirect(303, `/liga/${league.slug}/verwaltung/zyklen/${result.cycleId}`);
	}
};
