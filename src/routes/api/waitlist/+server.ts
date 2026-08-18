import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { isValidEmail } from '$lib/email';

function fail(status: number, message: string, detail?: string) {
	const suffix = detail && detail !== message ? ` (${detail})` : '';
	return json({ message: `${message}${suffix}` }, { status });
}

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return fail(400, 'Bitte eine gültige E-Mail-Adresse eingeben.');
	}

	const email =
		typeof body === 'object' && body && 'email' in body && typeof body.email === 'string'
			? body.email.trim().toLowerCase()
			: '';

	if (!isValidEmail(email)) {
		return fail(400, 'Bitte eine gültige E-Mail-Adresse eingeben.');
	}

	try {
		const sb = supabaseAdmin(platform);
		const { error } = await sb.from('waitlist').insert({ email });
		if (error) {
			if (error.code === '23505') return json({ ok: true });
			console.error('waitlist insert', error);
			return fail(500, 'Konnte nicht eingetragen werden.', error.message);
		}
		return json({ ok: true });
	} catch (err) {
		const detail = err instanceof Error ? err.message : String(err);
		console.error('waitlist exception', detail);
		if (detail.includes('SUPABASE_SERVICE_ROLE_KEY') || detail.includes('nicht konfiguriert')) {
			return fail(
				503,
				'Server ist nicht mit Supabase verbunden. Secret Key in Cloudflare als encrypted Secret setzen, nicht als Build-Variable.',
				detail
			);
		}
		return fail(500, 'Konnte nicht eingetragen werden. Bitte später erneut versuchen.', detail);
	}
};
