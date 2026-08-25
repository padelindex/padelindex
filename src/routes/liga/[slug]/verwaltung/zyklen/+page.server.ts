import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { listCycles, requireLeagueAdmin } from '$lib/server/league-admin';
import { activeSeason, listSeasonsForLeague } from '$lib/server/league-seasons';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);

	const [cycles, seasons, current] = await Promise.all([
		listCycles(admin, league.id),
		listSeasonsForLeague(admin, league.id),
		activeSeason(admin, league.id)
	]);

	// Saison-Umschalter: Standard ist die aktive Saison, sonst "alle" —
	// eine Liga ohne aktive Saison (z. B. noch nie eine angelegt) soll
	// nicht auf eine leere Auswahl laufen.
	const requested = url.searchParams.get('season');
	const selectedSeasonId = requested ?? current?.id ?? 'all';

	const filteredCycles =
		selectedSeasonId === 'all' ? cycles : cycles.filter((c) => c.seasonId === selectedSeasonId);

	return { league, cycles: filteredCycles, seasons, selectedSeasonId };
};
