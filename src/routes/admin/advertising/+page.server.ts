// ============================================================
// PadelIndex — Super-Admin: Werbe- & Sponsoring-Kampagnen
// ============================================================
// Gleiches Zugriffsmuster wie admin/+page.server.ts: ausschließlich
// PLATFORM_OWNER_EMAIL, 404 statt 403 ohne Berechtigung.

import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { requirePlatformOwner } from '$lib/server/platform-owner';
import {
	createCampaign,
	listCampaigns,
	setCampaignActive,
	updateCampaign,
	type CampaignInput
} from '$lib/server/advertising';

function readCampaignInput(form: FormData): CampaignInput {
	return {
		sponsorName: String(form.get('sponsorName') ?? ''),
		logoUrl: String(form.get('logoUrl') ?? ''),
		bannerUrl: String(form.get('bannerUrl') ?? ''),
		targetUrl: String(form.get('targetUrl') ?? ''),
		campaignName: String(form.get('campaignName') ?? ''),
		startDate: String(form.get('startDate') ?? ''),
		endDate: String(form.get('endDate') ?? ''),
		position: String(form.get('position') ?? ''),
		targetRegion: String(form.get('targetRegion') ?? ''),
		isActive: form.get('isActive') === 'on'
	};
}

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	requirePlatformOwner(locals, platform, url);
	const campaigns = await listCampaigns(supabaseAdmin(platform));
	return { campaigns };
};

export const actions: Actions = {
	create: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();

		const result = await createCampaign(supabaseAdmin(platform), readCampaignInput(form));
		if (!result.ok) return { error: result.message };
		return { saved: true };
	},

	update: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await updateCampaign(supabaseAdmin(platform), id, readCampaignInput(form));
		if (!result.ok) return { error: result.message };
		return { saved: true };
	},

	toggleActive: async ({ request, locals, platform, url }) => {
		requirePlatformOwner(locals, platform, url);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const isActive = form.get('isActive') === 'true';
		if (!id) return { error: 'Ungültige Anfrage.' };

		const result = await setCampaignActive(supabaseAdmin(platform), id, isActive);
		if (!result.ok) return { error: result.message };
		return { saved: true };
	}
};
