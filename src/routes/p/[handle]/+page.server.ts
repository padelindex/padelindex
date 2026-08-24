// ============================================================
// PadelIndex — Öffentliches Spielerprofil
// ============================================================
// Kein Login nötig (wie /c/[slug]) — profile_public steuert, ob es die
// Seite überhaupt gibt. loadPublicProfile() gibt bei false/nicht
// gefunden bewusst dasselbe null zurück, damit hier nicht zwischen
// "gibt's nicht" und "privat" unterschieden werden kann (kein Oracle für
// "existiert dieser Handle").

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { loadPlayerClub } from '$lib/server/matches';
import {
	isMostImprovedInClub,
	loadPublicMatchHistory,
	loadPublicProfile
} from '$lib/server/player-profile';
import { computeFormCurve, computePreferredPartners } from '$lib/profile-stats';
import { computeBadges, longestStreak } from '$lib/badges';
import { loadClubRanking } from '$lib/server/challenges';
import { isRankChallengeable } from '$lib/challenge-rules';
import { loadH2HStats } from '$lib/server/h2h';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const admin = supabaseAdmin(platform);

	const profile = await loadPublicProfile(admin, params.handle);
	if (!profile) throw error(404, 'Profil nicht gefunden');

	const [club, { entries, mixedMatchCount }] = await Promise.all([
		loadPlayerClub(admin, profile.id),
		loadPublicMatchHistory(admin, profile.id)
	]);

	const mostImproved = club ? await isMostImprovedInClub(admin, club.id, profile.id) : false;

	// entries sind neueste-zuerst (für Anzeige/Formkurve); die Serie für
	// den Streak-Badge braucht chronologische Reihenfolge.
	const chronological = [...entries].reverse().map((e) => e.won);

	const badges = computeBadges({
		resultsChronological: chronological,
		mixedMatchCount,
		isMostImprovedInClub: mostImproved
	});

	const form = {
		w5: computeFormCurve(entries, 5),
		w10: computeFormCurve(entries, 10),
		w20: computeFormCurve(entries, 20)
	};

	const preferredPartners = computePreferredPartners(entries, 3);
	const tournamentMatches = entries.filter((e) => e.matchType === 'turnier');

	// Matchmaking-Aktionen nur für eingeloggte Besucher auf FREMDEN Profilen.
	// challengeable prüft dieselbe Range wie /challenges — der Button taucht
	// gar nicht erst auf, wenn die Challenge ohnehin abgelehnt würde. Die
	// eigentliche Prüfung passiert trotzdem nochmal serverseitig beim Senden
	// (createChallenge), das hier ist reine UI-Vorfilterung.
	const viewer = locals.player;
	const isOwnProfile = viewer?.id === profile.id;
	let challengeable = false;

	if (viewer && !isOwnProfile && club) {
		const viewerClub = await loadPlayerClub(admin, viewer.id);
		if (viewerClub?.id === club.id) {
			const ranking = await loadClubRanking(admin, club.id);
			const meRank = ranking.find((r) => r.playerId === viewer.id)?.rank;
			const targetRank = ranking.find((r) => r.playerId === profile.id)?.rank;
			challengeable =
				meRank !== undefined &&
				targetRank !== undefined &&
				isRankChallengeable(meRank, targetRank, ranking.length);
		}
	}

	// get_h2h_stats (0020) läuft über den Sessions-Client, nicht den Admin-
	// Client: die Funktion ist SECURITY INVOKER, RLS auf matches/
	// match_participants/match_sets bindet das Ergebnis an die eingeloggte
	// Person (viewer). Nur für fremde Profile, nur wenn eine Session steht.
	const h2h =
		viewer && !isOwnProfile && locals.supabase
			? await loadH2HStats(locals.supabase, viewer.id, profile.id)
			: null;

	return {
		profile,
		club,
		history: entries.slice(0, 20),
		form,
		preferredPartners,
		badges,
		tournamentMatches,
		longestStreakEver: longestStreak(chronological),
		viewer: viewer ? { isLoggedIn: true, isOwnProfile, challengeable } : null,
		h2h
	};
};
