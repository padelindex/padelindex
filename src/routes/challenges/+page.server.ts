// ============================================================
// PadelIndex — Challenges
// ============================================================
// Die Rangliste eines Vereins ist der Kontext jeder Challenge (siehe
// Migration 0013, Annahme 1). Ohne Vereinsmitgliedschaft gibt es keinen
// Rang und damit auch keine Challenges.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import { loadPlayerClub } from '$lib/server/matches';
import {
	acceptChallenge,
	cancelChallenge,
	createChallenge,
	declineChallenge,
	getChallengeablePlayers,
	getChallenges
} from '$lib/server/challenges';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (!locals.player || !locals.supabase) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const admin = supabaseAdmin(platform);
	const club = await loadPlayerClub(admin, locals.player.id);

	const [challengeable, { incoming, outgoing }] = await Promise.all([
		club
			? getChallengeablePlayers(admin, locals.player.id, club.id)
			: Promise.resolve(null),
		getChallenges(locals.supabase, admin, locals.player.id)
	]);

	return { club, challengeable, incoming, outgoing };
};

/** Bis zu drei Terminvorschläge aus dem Formular einsammeln. */
function readSlots(form: FormData) {
	const slots: { date: string; startTime: string; endTime: string }[] = [];
	for (let i = 1; i <= 3; i++) {
		const date = String(form.get(`slot${i}Date`) ?? '');
		const startTime = String(form.get(`slot${i}Start`) ?? '');
		const endTime = String(form.get(`slot${i}End`) ?? '');
		if (date && startTime && endTime) slots.push({ date, startTime, endTime });
	}
	return slots;
}

export const actions: Actions = {
	challenge: async ({ request, locals, platform, url }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };

		const admin = supabaseAdmin(platform);
		const club = await loadPlayerClub(admin, locals.player.id);
		if (!club) return { error: 'Du bist in keinem Verein — ohne Rangliste keine Challenge.' };

		const form = await request.formData();
		const targetId = String(form.get('targetId') ?? '');
		if (!targetId) return { error: 'Ungültige Anfrage.' };

		const result = await createChallenge(
			admin,
			locals.player.id,
			{
				challengedPlayerId: targetId,
				clubId: club.id,
				proposedTimeSlots: readSlots(form),
				message: String(form.get('message') ?? '')
			},
			{
				emailEnv: readEmailEnv(platform),
				baseUrl: url.origin,
				challengerName: locals.player.displayName
			}
		);

		if (!result.ok) return { error: result.message };
		return { challengeSent: true };
	},

	accept: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('challengeId') ?? '');
		const slotIndex = Number(form.get('slotIndex') ?? 0);
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await acceptChallenge(
			supabaseAdmin(platform),
			id,
			locals.player.id,
			locals.player.displayName,
			Number.isFinite(slotIndex) ? slotIndex : 0
		);
		if (!result.ok) return { error: result.message };
		return { done: true };
	},

	decline: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('challengeId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await declineChallenge(
			supabaseAdmin(platform),
			id,
			locals.player.id,
			locals.player.displayName
		);
		if (!result.ok) return { error: result.message };
		return { done: true };
	},

	cancel: async ({ request, locals, platform }) => {
		if (!locals.player) return { error: 'Nicht angemeldet.' };
		const form = await request.formData();
		const id = String(form.get('challengeId') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await cancelChallenge(supabaseAdmin(platform), id, locals.player.id);
		if (!result.ok) return { error: result.message };
		return { done: true };
	}
};
