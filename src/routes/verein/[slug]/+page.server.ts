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
import {
	addExistingPlayerToClub,
	addUnclaimedMember,
	loadClubMembers,
	removeMemberFromClub,
	searchClaimablePlayersNotInClub
} from '$lib/server/club-members';
import { cancelPendingMatch, loadClubPendingMatches } from '$lib/server/matches';
import { updateClubSettings } from '$lib/server/club-settings';

async function requireClubAdmin(
	locals: App.Locals,
	slug: string,
	url: URL
): Promise<{ id: string; slug: string; name: string; accent: string | null }> {
	if (!locals.player || !locals.supabase) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const { data: club } = await locals.supabase
		.from('clubs')
		.select('id, slug, name, accent')
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
	const admin = supabaseAdmin(platform);

	const [rewards, members, pendingMatches] = await Promise.all([
		loadRewardCatalogForAdmin(admin, club.id),
		loadClubMembers(admin, club.id),
		loadClubPendingMatches(admin, club.id)
	]);

	return { club, rewards, members, pendingMatches };
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
	},

	searchMembers: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const query = String(form.get('query') ?? '');

		const results = await searchClaimablePlayersNotInClub(supabaseAdmin(platform), club.id, query);
		return { searchQuery: query, searchResults: results };
	},

	addExisting: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const playerId = String(form.get('playerId') ?? '');
		if (!playerId) return { memberError: 'Ungültige Anfrage.' };

		const result = await addExistingPlayerToClub(supabaseAdmin(platform), club.id, playerId);
		if (!result.ok) return { memberError: result.message };
		return { memberSaved: true };
	},

	addUnclaimed: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const displayName = String(form.get('displayName') ?? '');

		const result = await addUnclaimedMember(supabaseAdmin(platform), club.id, displayName);
		if (!result.ok) return { memberError: result.message };
		return { memberSaved: true };
	},

	removeMember: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const playerId = String(form.get('playerId') ?? '');
		if (!playerId) return { memberError: 'Ungültige Anfrage.' };

		const result = await removeMemberFromClub(supabaseAdmin(platform), club.id, playerId);
		if (!result.ok) return { memberError: result.message };
		return { memberSaved: true };
	},

	cancelMatch: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const matchId = String(form.get('matchId') ?? '');
		if (!matchId) return { matchError: 'Ungültige Anfrage.' };

		const result = await cancelPendingMatch(supabaseAdmin(platform), club.id, matchId);
		if (!result.ok) return { matchError: result.message };
		return { matchCancelled: true };
	},

	updateSettings: async ({ request, params, locals, url, platform }) => {
		const club = await requireClubAdmin(locals, params.slug, url);
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const accent = String(form.get('accent') ?? '');

		const result = await updateClubSettings(supabaseAdmin(platform), club.id, { name, accent });
		if (!result.ok) return { settingsError: result.message };
		return { settingsSaved: true };
	}
};
