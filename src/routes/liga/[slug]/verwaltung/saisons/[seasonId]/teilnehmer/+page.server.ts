// Saison-Assistent, Schritt 2: Teilnehmer-Pool. Toggle "Nimmt teil" /
// "Pausiert" für bisherige Anmeldungen, plus Suche unter den noch nicht
// angemeldeten Vereinsmitgliedern. Nicht auf status='draft' beschränkt —
// dieselbe Seite eignet sich auch, um mitten in einer aktiven Saison
// jemanden zu pausieren, ohne die gesamte Warteliste-Seite zu bemühen.

import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { requireLeagueAdmin } from '$lib/server/league-admin';
import {
	addParticipant,
	listParticipants,
	listUnregisteredClubMembers,
	loadSeason,
	setParticipantStatus
} from '$lib/server/league-seasons';

async function loadSeasonOr404(
	admin: ReturnType<typeof supabaseAdmin>,
	leagueId: string,
	seasonId: string
) {
	const season = await loadSeason(admin, seasonId);
	if (!season || season.leagueId !== leagueId)
		throw error(404, 'Diese Saison gibt es in dieser Liga nicht.');
	return season;
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);
	const season = await loadSeasonOr404(admin, league.id, params.seasonId);

	if (!league.clubId) throw error(403, 'Diese Liga hat keinen Verein.');

	const [participants, candidates] = await Promise.all([
		listParticipants(admin, league.id),
		listUnregisteredClubMembers(admin, league.clubId, league.id)
	]);

	const canProceedToSeeding = season.status === 'draft' && season.cycleCount === 0;

	return { league, season, participants, candidates, canProceedToSeeding };
};

export const actions: Actions = {
	toggle: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadSeasonOr404(admin, league.id, params.seasonId);

		const form = await request.formData();
		const playerId = String(form.get('playerId') ?? '');
		const participating = form.get('participating') === 'true';
		if (!playerId) return fail(400, { message: 'Kein Spieler angegeben.' });

		const result = await setParticipantStatus(admin, league.id, playerId, participating);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	add: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadSeasonOr404(admin, league.id, params.seasonId);

		const form = await request.formData();
		const playerId = String(form.get('playerId') ?? '');
		if (!playerId) return fail(400, { message: 'Kein Spieler ausgewählt.' });

		const result = await addParticipant(admin, league.id, playerId);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	}
};
