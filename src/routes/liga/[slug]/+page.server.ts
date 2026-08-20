// Öffentliche Liga-Ansicht: eigene Rangliste, unabhängig vom
// allgemeinen PadelIndex-Rating. Läuft über den Admin-Client, weil die
// Satzergebnisse (match_sets) per RLS auf Beteiligte beschränkt sind —
// Namen kommen trotzdem nur aus der anonymisierten View.

import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidEmail } from '$lib/email';
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

export const actions: Actions = {
	/**
	 * Anmeldung für Leute ohne PadelIndex-Konto. Legt noch NICHTS in
	 * league_registrations an — das passiert erst, wenn die Person sich
	 * über /konto selbst auf die Warteliste einträgt (joinLeagueWaitlist),
	 * nachdem sie den Link geklickt hat. Bis dahin ist nichts als eine
	 * verschickte E-Mail passiert, genau wie beim Profil-Beanspruchen
	 * (siehe lib/server/claims.ts) — dieselbe token_hash+verifyOtp-Route
	 * /auth/confirm übernimmt den Rest.
	 *
	 * Gehört die E-Mail schon zu einem bestehenden Konto, verschickt
	 * Supabase trotz shouldCreateUser:true einfach einen normalen
	 * Login-Link statt ein zweites Konto anzulegen — dieselbe Anmeldung
	 * deckt also "neu hier" und "hab schon einen Account" gleichermaßen ab.
	 */
	signup: async ({ request, params, url, platform }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim().slice(0, 120);
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!name) return fail(400, { signupError: 'Bitte einen Namen angeben.' });
		if (!isValidEmail(email)) {
			return fail(400, { signupError: 'Bitte eine gültige E-Mail-Adresse angeben.' });
		}

		const { error: otpErr } = await supabasePublic(platform).auth.signInWithOtp({
			email,
			options: {
				shouldCreateUser: true,
				data: { display_name: name },
				emailRedirectTo: `${url.origin}/konto?join_league=${params.slug}`
			}
		});

		if (otpErr) return fail(502, { signupError: 'Link konnte nicht verschickt werden.' });
		return { signupSent: true };
	}
};
