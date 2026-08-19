// ============================================================
// PadelIndex — Meine Spielzeiten
// ============================================================
// Nur für eingeloggte Spieler. Lesen läuft über den Session-Client
// (RLS availabilities_self_read), Schreiben über service_role — die
// Zugehörigkeitsprüfung steckt in jeder Service-Funktion nochmals im
// WHERE (player_id), nicht nur hier.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { loadPlayerClub } from '$lib/server/matches';
import {
	createAvailability,
	deleteAvailability,
	getPlayerAvailabilities,
	setAvailabilityStatus,
	updateAvailability
} from '$lib/server/availabilities';
import type {
	AvailabilityInput,
	AvailabilityMatchType,
	DesiredLevel,
	PreferredFormat
} from '$lib/availability';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (!locals.player || !locals.supabase) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const [availabilities, club] = await Promise.all([
		getPlayerAvailabilities(locals.supabase, locals.player.id),
		loadPlayerClub(supabaseAdmin(platform), locals.player.id)
	]);

	return { availabilities, club };
};

function readForm(form: FormData): AvailabilityInput {
	const isRecurring = form.get('isRecurring') !== 'false';
	const weekdayRaw = String(form.get('weekday') ?? '');
	const distanceRaw = Number(form.get('maxDistanceKm'));

	return {
		isRecurring,
		weekday: isRecurring && weekdayRaw !== '' ? Number(weekdayRaw) : null,
		specificDate: isRecurring ? null : String(form.get('specificDate') ?? '') || null,
		startTime: String(form.get('startTime') ?? ''),
		endTime: String(form.get('endTime') ?? ''),
		clubId: String(form.get('clubId') ?? '') || null,
		maxDistanceKm: Number.isFinite(distanceRaw) ? Math.trunc(distanceRaw) : 25,
		matchType: String(form.get('matchType') ?? 'friendly') as AvailabilityMatchType,
		preferredFormat: String(form.get('preferredFormat') ?? 'open') as PreferredFormat,
		desiredLevel: String(form.get('desiredLevel') ?? 'similar') as DesiredLevel
	};
}

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();

		const result = await createAvailability(supabaseAdmin(platform), locals.player.id, readForm(form));
		if (!result.ok) return { error: result.message };
		return { saved: true };
	},

	update: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('availabilityId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await updateAvailability(supabaseAdmin(platform), locals.player.id, id, readForm(form));
		if (!result.ok) return { error: result.message };
		return { saved: true };
	},

	toggle: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('availabilityId') ?? '');
		const next = form.get('status') === 'active' ? 'active' : 'paused';
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await setAvailabilityStatus(supabaseAdmin(platform), locals.player.id, id, next);
		if (!result.ok) return { error: result.message };
		return { saved: true };
	},

	remove: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('availabilityId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await deleteAvailability(supabaseAdmin(platform), locals.player.id, id);
		if (!result.ok) return { error: result.message };
		return { saved: true };
	}
};
