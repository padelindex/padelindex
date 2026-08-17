import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const POST: RequestHandler = async ({ request }) => {
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
		const sb = supabaseAdmin();
		const { error } = await sb.from('waitlist').insert({ email });
		if (error) {
			if (error.code === '23505') return json({ ok: true });
			console.error('waitlist insert', error);
			return json({ message: 'Konnte nicht eingetragen werden.' }, { status: 500 });
		}
		return json({ ok: true });
	} catch {
		return json(
			{ message: 'Konnte nicht eingetragen werden. Bitte später erneut versuchen.' },
			{ status: 500 }
		);
	}
};
