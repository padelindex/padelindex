// ============================================================
// PadelIndex — Vereins-Admin: Prämien pflegen
// ============================================================
//
// Nur für Admins des jeweiligen Vereins (club_admins, siehe
// 0009_club_admin.sql). isClubAdmin() wird bewusst im load UND in JEDER
// einzelnen Action erneut geprüft — der Slug in der URL ist
// Nutzereingabe, ein POST kann direkt gegen jeden beliebigen
// Vereins-Slug abgesetzt werden, unabhängig davon, was das UI anzeigt.

import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { isClubAdmin } from '$lib/server/club-admin';
import {
	createReward,
	loadRewardCatalogForAdmin,
	setRewardActive,
	updateReward,
	type RewardInput
} from '$lib/server/rewards';

async function requireClubAdmin(
	locals: App.Locals,
	slug: string,
	url: URL
): Promise<{ id: string; slug: string; name: string }> {
	if (!locals.player || !locals.supabase) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const { data: club } = await locals.supabase
		.from('clubs')
		.select('id, slug, name')
		.eq('slug', slug)
		.maybeSingle();
	if (!club) throw error(404, 'Verein nicht gefunden');

	const admin = await isClubAdmin(locals.supabase, club.id, locals.player.id);
	if (!admin) throw error(403, 'Kein Admin-Zugriff auf diesen Verein.');

	return club;
}

function readRewardForm(form: FormData): RewardInput {
	return {
		title: String(form.get('title') ?? ''),
		description: String(form.get('description') ?? ''),
		cost: Number(form.get('cost'))
	};
}

export const load: PageServerLoad = async ({ params, locals, url, platform }) => {
	const club = await requireClubAdmin(locals, params.slug, url);
	const rewards = await loadRewardCatalogForAdmin(supabaseAdmin(platform), club.id);
	return { club, rewards };
};

export const actions: Actions = {
	create: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();

		const result = await createReward(supabaseAdmin(platform), club.id, readRewardForm(form));
		if (!result.ok) return { rewardError: result.message };
		return { rewardSaved: true };
	},

	update: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const rewardId = String(form.get('rewardId') ?? '');
		if (!rewardId) return { rewardError: 'Ungültige Anfrage.' };

		const result = await updateReward(
			supabaseAdmin(platform),
			club.id,
			rewardId,
			readRewardForm(form)
		);
		if (!result.ok) return { rewardError: result.message };
		return { rewardSaved: true };
	},

	toggleActive: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const rewardId = String(form.get('rewardId') ?? '');
		const active = form.get('active') === 'true';
		if (!rewardId) return { rewardError: 'Ungültige Anfrage.' };

		const result = await setRewardActive(supabaseAdmin(platform), club.id, rewardId, active);
		if (!result.ok) return { rewardError: result.message };
		return { rewardSaved: true };
	}
};
