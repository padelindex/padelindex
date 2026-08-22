import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { requestWaitlistSignup } from '$lib/server/waitlist';

function fail(status: number, message: string, detail?: string) {
	const suffix = detail && detail !== message ? ` (${detail})` : '';
	return json({ message: `${message}${suffix}` }, { status });
}

export const POST: RequestHandler = async ({ request, platform, url }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return fail(400, 'Bitte eine gültige E-Mail-Adresse eingeben.');
	}

	const read = (key: string) =>
		typeof body === 'object' && body && key in body && typeof (body as Record<string, unknown>)[key] === 'string'
			? ((body as Record<string, unknown>)[key] as string)
			: '';

	const email = read('email');
	const clubName = read('clubName');

	try {
		const result = await requestWaitlistSignup(supabaseAdmin(platform), email, clubName, {
			emailEnv: readEmailEnv(platform),
			baseUrl: url.origin
		});
		if (!result.ok) return fail(400, result.message);
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
