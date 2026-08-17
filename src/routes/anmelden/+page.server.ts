// ============================================================
// PadelIndex — Re-Login für bereits beanspruchte Profile
// ============================================================
//
// /c/[slug]/beanspruchen legt neue Verknüpfungen an (player.claim_status
// muss 'unclaimed' sein). Ohne diese Seite gäbe es keinen Weg zurück,
// sobald die Session einmal abgelaufen ist oder der Browser gewechselt
// wird — der Claim-Flow lehnt ein bereits beanspruchtes Profil ab.
//
// shouldCreateUser: false verhindert, dass hier neue Konten entstehen.
// Die Antwort ist bewusst immer gleich, ob die Adresse existiert oder
// nicht — sonst ließe sich über die Fehlermeldung erraten, wer schon
// registriert ist (User-Enumeration).

import type { Actions, PageServerLoad } from './$types';
import { supabaseAnon } from '$lib/server/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const load: PageServerLoad = async ({ locals }) => {
	return { alreadyLoggedIn: Boolean(locals.user) };
};

export const actions: Actions = {
	default: async ({ request, url, platform }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!EMAIL_RE.test(email)) {
			return { message: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
		}

		const sb = supabaseAnon(platform);
		if (!sb) {
			return { message: 'Supabase ist noch nicht verbunden.' };
		}

		await sb.auth.signInWithOtp({
			email,
			options: { shouldCreateUser: false, emailRedirectTo: `${url.origin}/konto` }
		});

		return { sent: true };
	}
};
