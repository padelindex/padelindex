import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isUsableClaimQuery } from '$lib/claim-match';
import { lookupClaimableProfile } from '$lib/server/claims';

export const POST: RequestHandler = async ({ request, platform }) => {
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
	const name = read('name');

	if (!slug) return json({ message: 'Verein fehlt.' }, { status: 400 });
	if (!isUsableClaimQuery(name)) {
		return json({ message: 'Bitte Vor- und Nachnamen eingeben.' }, { status: 400 });
	}

	const profile = await lookupClaimableProfile(slug, name, platform);

	if (!profile) {
		return json({
			found: false,
			message:
				'Kein passendes Profil gefunden. Entweder wurde es schon beansprucht oder du bist noch nicht in der Ligatabelle.'
		});
	}

	return json({ found: true, profile });
};
