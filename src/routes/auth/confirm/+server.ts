// ============================================================
// PadelIndex — Magic-Link-Bestätigung (token_hash)
// ============================================================
//
// signInWithOtp() läuft server-seitig ohne Nutzer-Browser im Spiel (siehe
// claims.ts) — ein PKCE-Code-Austausch würde deshalb scheitern: der
// code_verifier läge im Storage unseres Server-Aufrufs, nicht im
// Cookie-Storage des Browsers, der später auf den Link klickt.
//
// token_hash + verifyOtp() braucht dagegen keinen gemeinsamen State
// zwischen Versand und Einlösung — genau das richtige Werkzeug hier.
// Voraussetzung: das Magic-Link-E-Mail-Template in Supabase muss
// {{ .TokenHash }} statt {{ .ConfirmationURL }} verwenden, siehe README.

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeRedirectTarget } from '$lib/auth';

export const GET: RequestHandler = async ({ url, locals }) => {
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	// next kommt aus {{ .RedirectTo }} im E-Mail-Template — immer eine
	// absolute URL (emailRedirectTo verlangt das). origin normalisiert sie
	// auf ihren Pfad, sofern sie zu dieser Seite gehört.
	const next = safeRedirectTarget(url.searchParams.get('next'), { origin: url.origin });

	if (tokenHash && type && locals.supabase) {
		const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash });
		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, `/auth/fehler?next=${encodeURIComponent(next)}`);
};
