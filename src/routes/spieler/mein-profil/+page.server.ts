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
import {
	isNonEmpty,
	isValidCalendarDate,
	ageInYears,
	MIN_REGISTRATION_AGE,
	MAX_PLAUSIBLE_AGE
} from '$lib/register';

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
	},

	// Trägt Vorname/Nachname/Geburtsdatum/Verein nach, wenn sie noch nie
	// gesetzt wurden — z.B. bei per Magic Link beanspruchten Vereins-
	// Profilen, die nie durch die Registrierung liefen. Einmal gesetzte
	// Werte bleiben gesperrt (siehe fill_own_registration_fields(),
	// 0030_self_fill_registration_fields.sql) — dieselbe Absicht wie bei
	// der Registrierung selbst, Altersklassen/Rankings sollen verlässlich
	// bleiben. Nur die Felder validieren, die tatsächlich ausgefüllt
	// wurden — welche das sind, entscheidet die UI (zeigt nur für aktuell
	// leere Felder ein Eingabefeld an).
	fillDetails: async ({ request, locals }) => {
		if (!locals.supabase || !locals.player) {
			return { detailsErrors: { general: 'Nicht angemeldet.' } };
		}

		const form = await request.formData();
		const firstName = String(form.get('firstName') ?? '').trim();
		const lastName = String(form.get('lastName') ?? '').trim();
		const birthDate = String(form.get('birthDate') ?? '').trim();
		const clubName = String(form.get('clubName') ?? '').trim();

		const errors: Record<string, string> = {};
		if (firstName && !isNonEmpty(firstName)) errors.firstName = 'Bitte einen kürzeren Namen eingeben.';
		if (lastName && !isNonEmpty(lastName)) errors.lastName = 'Bitte einen kürzeren Namen eingeben.';
		if (clubName && !isNonEmpty(clubName)) errors.clubName = 'Bitte einen kürzeren Namen eingeben.';
		if (birthDate) {
			if (!isValidCalendarDate(birthDate)) {
				errors.birthDate = 'Das ist kein gültiges Datum.';
			} else if (ageInYears(birthDate) < MIN_REGISTRATION_AGE) {
				errors.birthDate = `Du musst mindestens ${MIN_REGISTRATION_AGE} Jahre alt sein.`;
			} else if (ageInYears(birthDate) > MAX_PLAUSIBLE_AGE) {
				errors.birthDate = 'Bitte dein echtes Geburtsdatum eingeben.';
			}
		}

		if (Object.keys(errors).length > 0) {
			return { detailsErrors: errors };
		}

		const { error } = await locals.supabase.rpc('fill_own_registration_fields', {
			p_first_name: firstName || null,
			p_last_name: lastName || null,
			p_birth_date: birthDate || null,
			p_club_name: clubName || null
		});

		if (error) return { detailsErrors: { general: error.message } };
		return { detailsSaved: true };
	}
};
