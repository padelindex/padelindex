// ============================================================
// PadelIndex — Spielanfragen (empfangen & gesendet)
// ============================================================
// Lesen über den Session-Client (RLS play_requests_involved_read — man
// sieht nur, woran man selbst beteiligt ist). Namen der Gegenseite löst
// der Admin-Client auf, erst NACHDEM RLS die Beteiligung bestätigt hat —
// gleiches Muster wie loadPendingMatches in matches.ts.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { getUnreadThreadKeys } from '$lib/server/chat';
import {
	acceptPlayRequest,
	cancelPlayRequest,
	declinePlayRequest,
	getPlayRequests
} from '$lib/server/play-requests';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (!locals.player || !locals.supabase) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const { incoming, outgoing } = await getPlayRequests(
		locals.supabase,
		supabaseAdmin(platform),
		locals.player.id
	);

	// Jede Spielanfrage ist zugleich ihr eigener Chat-Thread (thread_key ==
	// play_requests.id, siehe 0023_match_chat) — ein Request pro Person statt
	// pro Anfrage, weil match_message_reads ohnehin nur die eigenen Zeilen
	// hergibt (RLS).
	const unread = await getUnreadThreadKeys(
		locals.supabase,
		[...incoming, ...outgoing].map((r) => r.id)
	);

	return { incoming, outgoing, myPlayerId: locals.player.id, unreadThreadIds: [...unread] };
};

export const actions: Actions = {
	accept: async ({ request, locals, platform, url }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('requestId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await acceptPlayRequest(
			supabaseAdmin(platform),
			id,
			locals.player.id,
			locals.player.displayName,
			{ emailEnv: readEmailEnv(platform), baseUrl: url.origin }
		);
		if (!result.ok) return { error: result.message };
		return { done: true };
	},

	decline: async ({ request, locals, platform, url }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('requestId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await declinePlayRequest(
			supabaseAdmin(platform),
			id,
			locals.player.id,
			locals.player.displayName,
			{ emailEnv: readEmailEnv(platform), baseUrl: url.origin }
		);
		if (!result.ok) return { error: result.message };
		return { done: true };
	},

	cancel: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('requestId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await cancelPlayRequest(supabaseAdmin(platform), id, locals.player.id);
		if (!result.ok) return { error: result.message };
		return { done: true };
	}
};
