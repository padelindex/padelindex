// Die Startseite zeigt im Vereins-Abschnitt das echte Ranking des
// Pilotvereins statt erfundener Namen — dieselbe Liste, die auch das
// Embed-Widget ausliefert. Das ist der ehrlichste Beleg dafür, dass das
// Widget nicht nur ein Mockup ist.
//
// Bewusst fehlertolerant: fällt Supabase aus oder gibt es den Verein
// (noch) nicht, rendert die Seite ohne Ranking weiter. Eine Landingpage
// darf nicht an einer Datenbank hängen.

import type { PageServerLoad } from './$types';
import { getClubLeaderboard } from '$lib/server/leaderboard';
import { readTrialOfferEnabled } from '$lib/server/env';
import type { LeaderboardResponse } from '$lib/leaderboard';

const PILOT_CLUB = 'stc-oberland';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	let board: LeaderboardResponse | null = null;

	try {
		board = await getClubLeaderboard(PILOT_CLUB, 5, platform);
	} catch {
		board = null;
	}

	// Öffentliche Rangliste, ändert sich selten — kurzer Cache entlastet
	// Supabase und macht die Startseite schneller.
	setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300' });

	return { board, trialOfferEnabled: readTrialOfferEnabled(platform) };
};
