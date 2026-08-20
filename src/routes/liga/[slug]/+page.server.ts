// Öffentliche Liga-Ansicht: eigene Rangliste, unabhängig vom
// allgemeinen PadelIndex-Rating. Läuft über den Admin-Client, weil die
// Satzergebnisse (match_sets) per RLS auf Beteiligte beschränkt sind —
// Namen kommen trotzdem nur aus der anonymisierten View.
//
// KEIN Selbstanmelde-Flow für neue Konten hier (Rückfrage 20.08.,
// beantwortet: "Verein zuerst"): wer noch keinen PadelIndex-Account hat,
// landet auf der allgemeinen Warteliste (SignupForm, Doppel-Opt-in) mit
// vorausgefülltem Vereinsnamen — der Verein legt daraus bei Bedarf ein
// unbeanspruchtes Profil an, das die Person danach selbst claimt (wie
// überall sonst auf der Plattform). So entstehen keine Konten ohne
// Vereinsbezug, und der Verein bleibt der Anlaufpunkt.

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin, supabasePublic } from '$lib/server/supabase';
import { loadCurrentCycle, loadLadder, loadLeague } from '$lib/server/league';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await loadLeague(supabasePublic(platform), params.slug);
	if (!league) throw error(404, 'Diese Liga gibt es nicht.');

	const admin = supabaseAdmin(platform);
	const cycleId = url.searchParams.get('zyklus') ?? undefined;
	const cycle = await loadCurrentCycle(admin, league.id, cycleId);

	const ladder = cycle ? await loadLadder(admin, cycle.id, league.config) : [];

	// Für den "hier kannst du dein Ergebnis melden"-Hinweis.
	const myPlayerId = locals.player?.id ?? null;
	const myBoxId =
		myPlayerId === null
			? null
			: (ladder.find((b) => b.lineup.some((p) => p.playerId === myPlayerId))?.id ?? null);

	return { league, cycle, ladder, myBoxId, viewerLoggedIn: Boolean(locals.player) };
};
