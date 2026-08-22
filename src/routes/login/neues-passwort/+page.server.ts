// ============================================================
// PadelIndex — Neues Passwort setzen (nach Recovery-Link)
// ============================================================
// Landet hier nach /auth/confirm?type=recovery — verifyOtp() dort hat
// bereits eine Session über den Cookie-Client hergestellt (locals.user
// ist gesetzt). Ohne diese Session ist der Link ungültig/abgelaufen.
//
// Läuft über den Session-Client (locals.supabase), nicht service_role:
// updateUser() ändert per Definition nur die eigene, gerade
// authentifizierte Identität.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isStrongEnoughPassword } from '$lib/register';

export const load: PageServerLoad = async ({ locals }) => {
	return { hasRecoverySession: Boolean(locals.user) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.supabase || !locals.user) {
			return { message: 'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.' };
		}

		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const passwordRepeat = String(form.get('passwordRepeat') ?? '');

		if (!isStrongEnoughPassword(password)) {
			return { message: 'Mindestens 8 Zeichen, mit Groß-, Kleinbuchstaben und einer Zahl.' };
		}
		if (password !== passwordRepeat) {
			return { message: 'Die Passwörter stimmen nicht überein.' };
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			return { message: error.message };
		}

		// Frisches Passwort gesetzt — bewusst ausloggen und zur normalen
		// Anmeldung schicken, statt die Recovery-Session weiterlaufen zu
		// lassen (gleiches Prinzip wie die Bestätigung nach der Registrierung:
		// jede Verifizierungs-Aktion endet an /login, nicht in einer
		// automatisch eingeloggten Session).
		await locals.supabase.auth.signOut();
		throw redirect(303, '/login?next=%2Fspieler%2Fmein-profil');
	}
};
