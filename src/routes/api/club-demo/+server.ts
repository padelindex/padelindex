import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { submitClubDemoRequest } from '$lib/server/club-demo';

function fail(status: number, message: string) {
	return json({ message }, { status });
}

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return fail(400, 'Ungültige Anfrage.');
	}

	const read = (key: string) =>
		typeof body === 'object' && body && key in body && typeof (body as Record<string, unknown>)[key] === 'string'
			? ((body as Record<string, unknown>)[key] as string)
			: '';

	try {
		const result = await submitClubDemoRequest(
			supabaseAdmin(platform),
			{
				clubName: read('clubName'),
				contactName: read('contactName'),
				email: read('email'),
				message: read('message')
			},
			{ emailEnv: readEmailEnv(platform), notifyTo: 'kontakt@padelindex.de' }
		);
		if (!result.ok) return fail(400, result.message);
		return json({ ok: true });
	} catch (err) {
		const detail = err instanceof Error ? err.message : String(err);
		console.error('club-demo exception', detail);
		return fail(500, 'Konnte nicht gesendet werden. Bitte später erneut versuchen.');
	}
};
