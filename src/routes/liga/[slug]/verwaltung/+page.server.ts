// Liga-Verwaltung: Auf-/Abstiegsvorschlag prüfen und bestätigen.
// Zugriff hat, wer Admin des Vereins ist, zu dem die Liga gehört —
// geprüft bei jedem Laden UND bei jeder Aktion (isClubAdmin).

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin, supabasePublic } from '$lib/server/supabase';
import { isClubAdmin } from '$lib/server/club-admin';
import {
	applyPromotionProposal,
	loadCurrentCycle,
	loadLadder,
	loadLeague,
	loadPromotionProposal
} from '$lib/server/league';

async function requireLeagueAdmin(
	platform: App.Platform | undefined,
	slug: string,
	playerId: string | undefined,
	pathname: string
) {
	const league = await loadLeague(supabasePublic(platform), slug);
	if (!league) throw error(404, 'Diese Liga gibt es nicht.');
	if (!playerId) throw redirect(303, `/anmelden?next=${encodeURIComponent(pathname)}`);
	if (!league.clubId) throw error(403, 'Diese Liga hat keinen Verein, der sie verwalten könnte.');

	const ok = await isClubAdmin(supabaseAdmin(platform), league.clubId, playerId);
	if (!ok) throw error(403, 'Nur Vereins-Admins können diese Liga verwalten.');

	return league;
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);

	const admin = supabaseAdmin(platform);
	const cycle = await loadCurrentCycle(admin, league.id);
	if (!cycle) return { league, cycle: null, ladder: [], proposal: [] };

	const [ladder, proposal] = await Promise.all([
		loadLadder(admin, cycle.id, league.config),
		loadPromotionProposal(admin, cycle.id, league.config)
	]);

	return { league, cycle, ladder, proposal };
};

export const actions: Actions = {
	applyPromotions: async ({ params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);

		const cycle = await loadCurrentCycle(admin, league.id);
		if (!cycle) return fail(400, { message: 'Kein Zyklus vorhanden.' });

		// Bewusst hart: solange irgendeine Box unvollständig ist oder eine
		// Warnung trägt, wird nichts festgeschrieben. Ein halb angewandter
		// Auf-/Abstieg wäre schlimmer als gar keiner.
		const proposal = await loadPromotionProposal(admin, cycle.id, league.config);
		const blocked = proposal.filter((p) => p.warning);
		if (blocked.length > 0) {
			return fail(409, {
				message: `${blocked.length} Einträge brauchen erst eine Entscheidung — nichts festgeschrieben.`
			});
		}

		const count = await applyPromotionProposal(
			admin,
			cycle.id,
			locals.player!.id,
			league.config
		);
		return { success: true, count };
	}
};
