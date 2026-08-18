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

export const load: PageServerLoad = async ({ params, platform }) => {
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

	return {
		profile,
		club,
		history: entries.slice(0, 20),
		form,
		preferredPartners,
		badges,
		tournamentMatches,
		longestStreakEver: longestStreak(chronological)
	};
};
