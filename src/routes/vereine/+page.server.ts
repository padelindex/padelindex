// Der Vereins-Bereich lebt seit Block 4 des Website-Audits als eigene
// Route statt eines Anker-Abschnitts auf der Startseite (siehe
// src/routes/+page.server.ts für den historischen Kontext). Lädt
// dieselbe Pilotvereins-Vorschau, die vorher auf "/" stand.

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

	setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300' });

	return { board, trialOfferEnabled: readTrialOfferEnabled(platform) };
};
