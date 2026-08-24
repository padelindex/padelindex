// ============================================================
// PadelIndex — Passwort vergessen
// ============================================================
// resetPasswordForEmail() funktioniert unabhängig davon, ob das Konto
// schon ein Passwort hat — ein reiner Magic-Link-Account (siehe
// /c/[slug]/beanspruchen) kann sich hierüber genauso ein erstes Passwort
// setzen. /auth/confirm (bestehender Handler, type-agnostisch) verifiziert
// den Recovery-Link und leitet auf /login/neues-passwort weiter.

import type { Actions, PageServerLoad } from './$types';
import { supabaseAnon, supabaseAdmin } from '$lib/server/supabase';
import { isValidEmail } from '$lib/email';
import { checkRateLimit } from '$lib/server/rate-limit';

export const load: PageServerLoad = async ({ locals }) => {
	return { alreadyLoggedIn: Boolean(locals.user) };
};

export const actions: Actions = {
	default: async ({ request, url, platform, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!isValidEmail(email)) {
			return { message: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
		}

		const admin = supabaseAdmin(platform);
		const [ipOk, emailOk] = await Promise.all([
			checkRateLimit(admin, 'login:ip', getClientAddress()),
			checkRateLimit(admin, 'password-reset:email', email)
		]);
		if (!ipOk || !emailOk) {
			return { message: 'Zu viele Anfragen. Bitte versuch es später erneut.' };
		}

		const sb = supabaseAnon(platform);
		if (sb) {
			await sb.auth.resetPasswordForEmail(email, {
				redirectTo: `${url.origin}/auth/confirm?next=${encodeURIComponent('/login/neues-passwort')}`
			});
		}

		// Immer dieselbe Antwort — sonst ließe sich erraten, welche Adresse
		// registriert ist (Anti-Enumeration, wie /anmelden und /registrieren).
		return { sent: true };
	}
};
