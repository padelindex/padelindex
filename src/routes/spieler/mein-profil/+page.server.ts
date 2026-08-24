// ============================================================
// PadelIndex — Mein Profil (privat)
// ============================================================
// Bewusst eine eigene, schlanke Seite statt /konto zu erweitern: /konto
// ist inzwischen ein breites Dashboard (Rating-Verlauf, Prämien, Liga,
// Club-Admin, …) — diese Seite zeigt nur die Identität aus der
// Registrierung (Vorname/Nachname/Geburtsdatum/Verein/E-Mail) plus eine
// Kurzfassung der Ranking-Daten. Kein Risiko für /konto, keine Änderung
// an loadSessionPlayer()/hooks.server.ts nötig.
//
// Läuft über den Session-Client — players_self_select (0005) filtert
// ohnehin auf die eigene Zeile, first_name/last_name/birth_date/club_name
// sind zusätzlich gar nicht per GRANT UPDATE beschreibbar (0019), aber
// lesbar sind sie hier trotzdem nur für den eingeloggten Eigentümer.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPlayerAvailabilities } from '$lib/server/availabilities';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.player || !locals.supabase || !locals.user) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const [{ data, error }, availabilities] = await Promise.all([
		locals.supabase
			.from('players')
			.select(
				'first_name, last_name, birth_date, club_name, display_name, handle, rating, matches_played, is_provisional, claim_status, avatar_url'
			)
			.eq('id', locals.player.id)
			.maybeSingle(),
		getPlayerAvailabilities(locals.supabase, locals.player.id)
	]);

	if (error || !data) {
		throw redirect(303, '/login');
	}

	return {
		email: locals.user.email ?? null,
		profile: {
			firstName: data.first_name,
			lastName: data.last_name,
			birthDate: data.birth_date,
			clubName: data.club_name,
			displayName: data.display_name,
			handle: data.handle,
			rating: Number(data.rating),
			matchesPlayed: data.matches_played,
			isProvisional: data.is_provisional,
			claimStatus: data.claim_status,
			avatarUrl: data.avatar_url
		},
		availabilityCount: availabilities.filter((a) => a.status === 'active').length
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) {
			await locals.supabase.auth.signOut();
		}
		throw redirect(303, '/');
	}
};
