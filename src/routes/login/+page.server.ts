// ============================================================
// PadelIndex — Login mit E-Mail + Passwort
// ============================================================
// Ergänzt /anmelden (Magic Link, weiterhin unverändert nutzbar — vor
// allem für Konten, die nie ein Passwort vergeben haben, z.B. über
// /c/[slug]/beanspruchen). Beide laufen über denselben Supabase-Auth-
// Cookie-Client aus hooks.server.ts, keine zweite Session-Verwaltung.
//
// Nicht bestätigte Accounts: signInWithPassword() schlägt dafür bereits
// serverseitig fehl (Supabase Auth, enable_confirmations = true), hier
// nur die passende Fehlermeldung + ein Weg, die Bestätigung erneut
// anzustoßen.

import type { Actions, PageServerLoad } from './$types';
import { supabaseAnon, supabaseAdmin } from '$lib/server/supabase';
import { isValidEmail } from '$lib/email';
import { safeRedirectTarget } from '$lib/auth';
import { checkRateLimit } from '$lib/server/rate-limit';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = safeRedirectTarget(url.searchParams.get('next'), {
		fallback: '/spieler/mein-profil'
	});
	return { alreadyLoggedIn: Boolean(locals.user), next };
};

export const actions: Actions = {
	// Kein "default": SvelteKit verbietet die Mischung aus "default" und
	// benannten Actions im selben actions-Objekt (wirft serverseitig einen
	// 500er auf JEDEN POST auf diese Route, unabhängig vom Ziel-Formular)
	// — siehe login: unten und die passende action="?/login" im
	// +page.svelte. Ohne diese Umbenennung war der klassische
	// E-Mail+Passwort-Login seit seiner Einführung nie funktionsfähig.
	login: async ({ request, url, platform, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		const next = safeRedirectTarget(String(form.get('next') ?? ''), {
			fallback: '/spieler/mein-profil'
		});

		if (!isValidEmail(email) || !password) {
			return { message: 'Bitte E-Mail-Adresse und Passwort eingeben.' };
		}

		const admin = supabaseAdmin(platform);
		const [ipOk, emailOk] = await Promise.all([
			checkRateLimit(admin, 'login:ip', getClientAddress()),
			checkRateLimit(admin, 'login:email', email)
		]);
		if (!ipOk || !emailOk) {
			return { message: 'Zu viele Loginversuche. Bitte versuch es in ein paar Minuten erneut.' };
		}

		const sb = supabaseAnon(platform);
		if (!sb) {
			return { message: 'Supabase ist noch nicht verbunden.' };
		}

		const { error } = await sb.auth.signInWithPassword({ email, password });

		if (error) {
			const unconfirmed =
				error.code === 'email_not_confirmed' || /not.confirmed/i.test(error.message);
			if (unconfirmed) {
				return {
					message: 'Bitte bestätige zuerst deine E-Mail-Adresse.',
					unconfirmedEmail: email
				};
			}
			// Absichtlich unspezifisch — "falsches Passwort" vs. "Konto
			// existiert nicht" ließe sich sonst durchprobieren.
			return { message: 'E-Mail oder Passwort ist falsch.' };
		}

		throw redirect(303, next);
	},

	resend: async ({ request, platform, url, getClientAddress }) => {
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
			checkRateLimit(admin, 'resend-confirmation:email', email)
		]);
		if (!ipOk || !emailOk) {
			return { message: 'Zu viele Anfragen. Bitte versuch es später erneut.' };
		}

		const sb = supabaseAnon(platform);
		if (sb) {
			await sb.auth.resend({
				type: 'signup',
				email,
				options: {
					emailRedirectTo: `${url.origin}/login`
				}
			});
		}

		// Immer dieselbe Antwort, unabhängig davon, ob die Adresse existiert
		// oder schon bestätigt ist (Anti-Enumeration, wie /anmelden).
		return { resent: true };
	}
};
