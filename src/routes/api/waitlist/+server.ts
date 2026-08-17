import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, { status: 400 });
	}

	const email =
		typeof body === 'object' && body && 'email' in body && typeof body.email === 'string'
			? body.email.trim().toLowerCase()
			: '';

	if (!EMAIL_RE.test(email)) {
		return json({ message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, { status: 400 });
	}

	try {
		const sb = supabaseAdmin(platform);
		const { error } = await sb.from('waitlist').insert({ email });
		if (error) {
			if (error.code === '23505') return json({ ok: true });
			console.error('waitlist insert', error);
			return json({ message: 'Konnte nicht eingetragen werden.' }, { status: 500 });
		}
		return json({ ok: true });
	} catch (err) {
		const detail = err instanceof Error ? err.message : String(err);
		console.error('waitlist exception', detail);
		if (detail.includes('SUPABASE_SERVICE_ROLE_KEY')) {
			return json(
				{
					message:
						'Server ist nicht mit Supabase verbunden (Secret Key fehlt in Cloudflare).'
				},
				{ status: 503 }
			);
		}
		return json(
			{ message: 'Konnte nicht eingetragen werden. Bitte später erneut versuchen.' },
			{ status: 500 }
		);
	}
};
