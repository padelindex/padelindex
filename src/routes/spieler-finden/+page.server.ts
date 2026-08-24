// ============================================================
// PadelIndex — Spieler finden (Matchvorschläge)
// ============================================================
// Die Vorschläge werden serverseitig berechnet (lib/server/matchmaking.ts)
// und NICHT bei jeder UI-Interaktion neu: Filter laufen über die URL, das
// heißt SvelteKit lädt genau einmal pro Filterwechsel neu. Der teure Teil
// ist zusätzlich zweistufig (SQL-Vorfilter, danach Scoring nur noch auf der
// kleinen Restmenge).

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { loadPlayerClub } from '$lib/server/matches';
import { dismissSuggestion, getMatchSuggestionsForPlayer } from '$lib/server/matchmaking';
import { createPlayRequest } from '$lib/server/play-requests';
import type { AvailabilityMatchType } from '$lib/availability';
import { AVAILABILITY_MATCH_TYPES } from '$lib/availability';

function numberOrNull(value: string | null): number | null {
	if (value === null || value.trim() === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (!locals.player || !locals.supabase) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const admin = supabaseAdmin(platform);
	const matchTypeParam = url.searchParams.get('matchType');
	const weekdayParam = numberOrNull(url.searchParams.get('weekday'));

	const filters = {
		clubId: url.searchParams.get('clubId') || null,
		minRating: numberOrNull(url.searchParams.get('minRating')),
		maxRating: numberOrNull(url.searchParams.get('maxRating')),
		matchType: AVAILABILITY_MATCH_TYPES.includes(matchTypeParam as AvailabilityMatchType)
			? (matchTypeParam as AvailabilityMatchType)
			: null,
		weekday: weekdayParam !== null && weekdayParam >= 0 && weekdayParam <= 6 ? weekdayParam : null,
		includeWeak: url.searchParams.get('includeWeak') === 'true'
	};

	const [{ suggestions, hasOwnAvailability }, club] = await Promise.all([
		getMatchSuggestionsForPlayer(admin, locals.player.id, filters),
		loadPlayerClub(admin, locals.player.id)
	]);

	return { suggestions, hasOwnAvailability, club, filters };
};

export const actions: Actions = {
	sendRequest: async ({ request, locals, platform, url }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();

		const result = await createPlayRequest(
			supabaseAdmin(platform),
			locals.player.id,
			{
				receiverId: String(form.get('receiverId') ?? ''),
				proposedDate: String(form.get('proposedDate') ?? ''),
				proposedStart: String(form.get('proposedStart') ?? ''),
				proposedEnd: String(form.get('proposedEnd') ?? ''),
				clubId: String(form.get('clubId') ?? '') || null,
				matchType: String(form.get('matchType') ?? 'friendly') as AvailabilityMatchType,
				message: String(form.get('message') ?? '')
			},
			{
				emailEnv: readEmailEnv(platform),
				baseUrl: url.origin,
				senderName: locals.player.displayName
			}
		);

		if (!result.ok) return { error: result.message };
		return { requestSent: true };
	},

	dismiss: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const targetId = String(form.get('playerId') ?? '');
		const blocked = form.get('blocked') === 'true';
		if (!targetId) return { error: 'Ungültige Anfrage.' };

		const result = await dismissSuggestion(
			supabaseAdmin(platform),
			locals.player.id,
			targetId,
			blocked
		);
		if (!result.ok) return { error: result.message };
		return { dismissed: true };
	}
};
