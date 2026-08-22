// ============================================================
// PadelIndex — Padel Roulette: öffentliche Beitritts-Seite
// ============================================================
// Nur eingeloggte Vereinsmitglieder (wie /match/neu) — die eigentliche
// Vier-Personen- und Mitgliedschaftsprüfung läuft trotzdem nochmal in
// roulette_join() (0018), diese Seite prüft nur fürs UI vorab.

import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { loadOpenSlotsForClub, joinSlot, leaveSlot } from '$lib/server/roulette';

export const load: PageServerLoad = async ({ params, locals, url, platform }) => {
	if (!locals.player) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const admin = supabaseAdmin(platform);
	const { data: club, error: clubErr } = await admin
		.from('clubs')
		.select('id, slug, name')
		.eq('slug', params.slug)
		.maybeSingle();

	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');

	const slots = await loadOpenSlotsForClub(admin, club.id);
	return { club, slots, me: locals.player.id };
};

export const actions: Actions = {
	join: async ({ request, params, locals, platform }) => {
		if (!locals.player) return { message: 'Nicht angemeldet.' };

		const admin = supabaseAdmin(platform);
		const { data: club } = await admin.from('clubs').select('id').eq('slug', params.slug).maybeSingle();
		if (!club) return { message: 'Verein nicht gefunden.' };

		const form = await request.formData();
		const slotId = String(form.get('slotId') ?? '');
		if (!slotId) return { message: 'Kein Termin angegeben.' };

		const result = await joinSlot(admin, slotId, locals.player.id);
		if (!result.ok) return { message: result.message };
		return { ok: true };
	},

	leave: async ({ request, locals, platform }) => {
		if (!locals.player) return { message: 'Nicht angemeldet.' };

		const admin = supabaseAdmin(platform);
		const form = await request.formData();
		const slotId = String(form.get('slotId') ?? '');
		if (!slotId) return { message: 'Kein Termin angegeben.' };

		await leaveSlot(admin, slotId, locals.player.id);
		return { ok: true };
	}
};
