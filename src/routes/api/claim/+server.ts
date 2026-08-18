import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startProfileClaim } from '$lib/server/claims';
import { isValidEmail } from '$lib/email';

const REASONS: Record<string, string> = {
	not_found: 'Dieses Profil gibt es in diesem Verein nicht.',
	already_claimed: 'Dieses Profil wurde bereits beansprucht.',
	pending_exists:
		'Für dieses Profil läuft bereits eine Bestätigung. Prüfe dein Postfach oder warte, bis der Link abgelaufen ist.'
};

export const POST: RequestHandler = async ({ request, url, platform }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Ungültige Anfrage.' }, { status: 400 });
	}

	const read = (key: string) =>
		typeof body === 'object' && body && key in body && typeof (body as never)[key] === 'string'
			? ((body as Record<string, string>)[key] as string).trim()
			: '';

	const slug = read('slug');
	const handle = read('handle');
	const email = read('email').toLowerCase();

	if (!slug || !handle) return json({ message: 'Ungültige Anfrage.' }, { status: 400 });
	if (!isValidEmail(email)) {
		return json({ message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, { status: 400 });
	}

	const result = await startProfileClaim(slug, handle, email, url.origin, platform);

	if (!result.ok) {
		return json({ message: REASONS[result.reason] ?? 'Nicht möglich.' }, { status: 409 });
	}

	return json({ ok: true });
};
