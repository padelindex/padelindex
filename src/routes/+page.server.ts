// Der Board-Lookup dient nur noch der letzten CTA-Zeile ("Du spielst
// schon beim STC Oberland? Profil beanspruchen"), die auf der
// Startseite bleibt. Der eigentliche Vereins-Bereich (ClubShowcase,
// Tarife, Demo-Formular) lebt seit Block 4 unter /vereine — siehe
// src/routes/vereine/+page.server.ts.
//
// Bewusst fehlertolerant: fällt Supabase aus oder gibt es den Verein
// (noch) nicht, rendert die Seite ohne Ranking weiter. Eine Landingpage
// darf nicht an einer Datenbank hängen.

import type { PageServerLoad } from './$types';
import { getClubLeaderboard } from '$lib/server/leaderboard';
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

	return { board };
};
