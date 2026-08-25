// Saison-Assistent, Schritt 1+2: die aktuelle aktive Saison archivieren
// (inklusive ihrer laufenden Zyklen) und die neue als 'draft' anlegen.
// Bewusst eine einzige Aktion — siehe createSeason() in league-seasons.ts.

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { requireLeagueAdmin } from '$lib/server/league-admin';
import { activeSeason, createSeason } from '$lib/server/league-seasons';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);
	const currentSeason = await activeSeason(admin, league.id);
	return { league, currentSeason };
};

export const actions: Actions = {
	default: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);

		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const plannedRaw = String(form.get('plannedCycles') ?? '').trim();
		const plannedCycles = plannedRaw ? Number(plannedRaw) : null;
		if (plannedCycles !== null && (!Number.isInteger(plannedCycles) || plannedCycles < 1)) {
			return fail(400, {
				message: 'Anzahl Zyklen muss eine ganze Zahl ≥ 1 sein (oder leer bleiben).'
			});
		}

		const result = await createSeason(admin, league.id, { name, plannedCycles });
		if (!result.ok) return fail(400, { message: result.message });

		throw redirect(303, `/liga/${league.slug}/verwaltung/saisons/${result.seasonId}/teilnehmer`);
	}
};
