// ============================================================
// PadelIndex — Super-Admin: Vereine & Vereins-Admins
// ============================================================
// Zugriff ausschließlich für PLATFORM_OWNER_EMAIL (siehe
// lib/server/platform-owner.ts) — kein Rollensystem, solange eine
// einzelne Person administriert. 404 statt 403 bei fehlender
// Berechtigung: kein Oracle, dass es diese Seite überhaupt gibt.

import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { requirePlatformOwner } from '$lib/server/platform-owner';
import {
	addClubAdmin,
	createClub,
	loadClubOverview,
	removeClubAdmin,
	searchClaimedPlayers,
	updateLicenseTier
} from '$lib/server/platform-admin';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	requirePlatformOwner(locals, platform, url);
	const clubs = await loadClubOverview(supabaseAdmin(platform));
	return { clubs };
};

export const actions: Actions = {
	createClub: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();

		const result = await createClub(supabaseAdmin(platform), {
			name: String(form.get('name') ?? ''),
			slug: String(form.get('slug') ?? ''),
			licenseTier: String(form.get('licenseTier') ?? 'free')
		});
		if (!result.ok) return { clubError: result.message };
		return { clubSaved: true };
	},

	updateLicenseTier: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();
		const clubId = String(form.get('clubId') ?? '');
		const licenseTier = String(form.get('licenseTier') ?? '');
		if (!clubId) return { clubError: 'Ungültige Anfrage.' };

		const result = await updateLicenseTier(supabaseAdmin(platform), clubId, licenseTier);
		if (!result.ok) return { clubError: result.message };
		return { clubSaved: true };
	},

	searchAdmins: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();
		const query = String(form.get('query') ?? '');
		const clubId = String(form.get('clubId') ?? '');

		const results = await searchClaimedPlayers(supabaseAdmin(platform), query);
		return { searchQuery: query, searchClubId: clubId, searchResults: results };
	},

	addAdmin: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();
		const clubId = String(form.get('clubId') ?? '');
		const playerId = String(form.get('playerId') ?? '');
		if (!clubId || !playerId) return { adminError: 'Ungültige Anfrage.' };

		const result = await addClubAdmin(supabaseAdmin(platform), clubId, playerId);
		if (!result.ok) return { adminError: result.message };
		return { adminSaved: true };
	},

	removeAdmin: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();
		const clubId = String(form.get('clubId') ?? '');
		const playerId = String(form.get('playerId') ?? '');
		if (!clubId || !playerId) return { adminError: 'Ungültige Anfrage.' };

		const result = await removeClubAdmin(supabaseAdmin(platform), clubId, playerId);
		if (!result.ok) return { adminError: result.message };
		return { adminSaved: true };
	}
};
