// ============================================================
// PadelIndex — Klassische Registrierung (E-Mail + Passwort)
// ============================================================
// Ergänzt den bestehenden Magic-Link-Login (Supabase Auth) um ein
// Passwort — keine zweite Auth-Lösung: signUp() legt dieselbe Zeile in
// auth.users an, derselbe Trigger handle_new_user() (siehe
// supabase/migrations/0019_password_auth.sql) verknüpft sie mit einem
// Spielerprofil, dieselben Cookies aus hooks.server.ts gelten danach.
//
// Bewusst IMMER dieselbe Erfolgsmeldung, egal ob die E-Mail neu ist oder
// schon existiert (Supabase selbst verhält sich bei aktivierter
// E-Mail-Bestätigung schon so: signUp() für eine bereits bestätigte
// Adresse "gelingt" ohne neue Mail zu verschicken) — sonst ließe sich
// über die Fehlermeldung erraten, wer schon registriert ist. Gleiches
// Muster wie /anmelden.

import type { Actions, PageServerLoad } from './$types';
import { supabaseAnon, supabaseAdmin } from '$lib/server/supabase';
import { isValidEmail } from '$lib/email';
import { validateRegisterInput, type RegisterFieldErrors, type RegisterInput } from '$lib/register';
import { checkRateLimit } from '$lib/server/rate-limit';

type RegisterFormValues = {
	firstName: string;
	lastName: string;
	birthDate: string;
	clubName: string;
	email: string;
};

const NO_ERRORS: RegisterFieldErrors = {};

export const load: PageServerLoad = async ({ locals }) => {
	return { alreadyLoggedIn: Boolean(locals.user) };
};

function readForm(form: FormData): RegisterInput {
	return {
		firstName: String(form.get('firstName') ?? '').trim(),
		lastName: String(form.get('lastName') ?? '').trim(),
		birthDate: String(form.get('birthDate') ?? '').trim(),
		clubName: String(form.get('clubName') ?? '').trim(),
		email: String(form.get('email') ?? '')
			.trim()
			.toLowerCase(),
		password: String(form.get('password') ?? ''),
		passwordRepeat: String(form.get('passwordRepeat') ?? '')
	};
}

export const actions: Actions = {
	default: async ({ request, url, platform, getClientAddress }) => {
		const form = await request.formData();
		const input = readForm(form);

		// Werte fürs erneute Anzeigen des Formulars — nie Passwörter zurückgeben.
		const values: RegisterFormValues = {
			firstName: input.firstName,
			lastName: input.lastName,
			birthDate: input.birthDate,
			clubName: input.clubName,
			email: input.email
		};

		const errors = validateRegisterInput(input, isValidEmail);
		if (Object.keys(errors).length > 0) {
			return { errors, values };
		}

		const admin = supabaseAdmin(platform);
		const allowed = await checkRateLimit(admin, 'register:ip', getClientAddress());
		if (!allowed) {
			return {
				errors: NO_ERRORS,
				values,
				message: 'Zu viele Registrierungsversuche. Bitte versuch es später erneut.'
			};
		}

		const sb = supabaseAnon(platform);
		if (!sb) {
			return { errors: NO_ERRORS, values, message: 'Supabase ist noch nicht verbunden.' };
		}

		const { error } = await sb.auth.signUp({
			email: input.email,
			password: input.password,
			options: {
				data: {
					first_name: input.firstName,
					last_name: input.lastName,
					birth_date: input.birthDate,
					club_name: input.clubName
				},
				emailRedirectTo: `${url.origin}/login`
			}
		});

		if (error) {
			// Supabase-Fehlermeldungen hier sind bereits nutzerverständlich und
			// enthalten keine sensiblen Details (z.B. "Password should be at
			// least 8 characters", "Signups not allowed for this instance").
			return { errors: NO_ERRORS, values, message: error.message };
		}

		return { sent: true };
	}
};
