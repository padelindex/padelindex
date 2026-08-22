// Liga-Verwaltung: Auf-/Abstiegsvorschlag prüfen und bestätigen.
// Zugriff hat, wer Admin des Vereins ist, zu dem die Liga gehört —
// geprüft bei jedem Laden UND bei jeder Aktion (requireLeagueAdmin).

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { applyPromotionProposal, loadCurrentCycle, loadLadder, loadPromotionProposal } from '$lib/server/league';
import { requireLeagueAdmin } from '$lib/server/league-admin';

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

		const count = await applyPromotionProposal(admin, cycle.id, locals.player!.id, league.config);
		return { success: true, count };
	}
};
