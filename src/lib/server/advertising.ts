// ============================================================
// PadelIndex — Werbe- & Sponsoring-System: Admin-CRUD
// ============================================================
// Schreiben läuft über service_role wie überall in diesem Schema (siehe
// platform-admin.ts) — campaigns hat bewusst keine INSERT/UPDATE-Policies,
// die eigentliche Autorisierung ("ist das der Plattform-Owner?") prüft der
// Aufrufer VOR jedem Call über requirePlatformOwner() aus platform-owner.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CAMPAIGN_POSITIONS, type Campaign, type CampaignPosition } from '$lib/advertising';

type CampaignRow = {
	id: string;
	sponsor_name: string;
	logo_url: string | null;
	banner_url: string;
	target_url: string;
	campaign_name: string;
	start_date: string;
	end_date: string;
	position: string;
	target_region: string | null;
	impressions: number;
	clicks: number;
	is_active: boolean;
	created_at: string;
};

function mapRow(row: CampaignRow): Campaign {
	return {
		id: row.id,
		sponsorName: row.sponsor_name,
		logoUrl: row.logo_url,
		bannerUrl: row.banner_url,
		targetUrl: row.target_url,
		campaignName: row.campaign_name,
		startDate: row.start_date,
		endDate: row.end_date,
		position: row.position as CampaignPosition,
		targetRegion: row.target_region,
		impressions: row.impressions,
		clicks: row.clicks,
		isActive: row.is_active,
		createdAt: row.created_at
	};
}

export async function listCampaigns(admin: SupabaseClient): Promise<Campaign[]> {
	const { data, error } = await admin
		.from('campaigns')
		.select(
			'id, sponsor_name, logo_url, banner_url, target_url, campaign_name, start_date, end_date, position, target_region, impressions, clicks, is_active, created_at'
		)
		.order('created_at', { ascending: false });

	if (error) throw new Error(error.message);
	return (data ?? []).map(mapRow);
}

export type CampaignInput = {
	sponsorName: string;
	logoUrl: string;
	bannerUrl: string;
	targetUrl: string;
	campaignName: string;
	startDate: string;
	endDate: string;
	position: string;
	targetRegion: string;
	isActive: boolean;
};

export type CampaignWriteResult = { ok: true; id: string } | { ok: false; message: string };

function validateCampaignInput(input: CampaignInput): string | null {
	if (!input.sponsorName.trim()) return 'Sponsorname darf nicht leer sein.';
	if (!input.campaignName.trim()) return 'Kampagnenname darf nicht leer sein.';
	if (!input.bannerUrl.trim()) return 'Banner-URL darf nicht leer sein.';
	if (!input.targetUrl.trim()) return 'Ziel-URL darf nicht leer sein.';
	if (!CAMPAIGN_POSITIONS.includes(input.position as CampaignPosition)) {
		return 'Ungültige Platzierung.';
	}
	if (!input.startDate || !input.endDate) return 'Start- und Enddatum sind erforderlich.';
	if (new Date(input.endDate).getTime() <= new Date(input.startDate).getTime()) {
		return 'Enddatum muss nach dem Startdatum liegen.';
	}
	try {
		new URL(input.bannerUrl);
		new URL(input.targetUrl);
		if (input.logoUrl.trim()) new URL(input.logoUrl);
	} catch {
		return 'Banner-, Ziel- und Logo-URL müssen gültige URLs sein.';
	}
	return null;
}

function toRow(input: CampaignInput) {
	return {
		sponsor_name: input.sponsorName.trim(),
		logo_url: input.logoUrl.trim() || null,
		banner_url: input.bannerUrl.trim(),
		target_url: input.targetUrl.trim(),
		campaign_name: input.campaignName.trim(),
		start_date: new Date(input.startDate).toISOString(),
		end_date: new Date(input.endDate).toISOString(),
		position: input.position,
		target_region: input.targetRegion.trim() || null,
		is_active: input.isActive
	};
}

export async function createCampaign(
	admin: SupabaseClient,
	input: CampaignInput
): Promise<CampaignWriteResult> {
	const validationError = validateCampaignInput(input);
	if (validationError) return { ok: false, message: validationError };

	const { data, error } = await admin.from('campaigns').insert(toRow(input)).select('id').single();
	if (error) return { ok: false, message: error.message };
	return { ok: true, id: data.id };
}

export async function updateCampaign(
	admin: SupabaseClient,
	id: string,
	input: CampaignInput
): Promise<CampaignWriteResult> {
	const validationError = validateCampaignInput(input);
	if (validationError) return { ok: false, message: validationError };

	const { error } = await admin.from('campaigns').update(toRow(input)).eq('id', id);
	if (error) return { ok: false, message: error.message };
	return { ok: true, id };
}

export async function setCampaignActive(
	admin: SupabaseClient,
	id: string,
	isActive: boolean
): Promise<CampaignWriteResult> {
	const { error } = await admin.from('campaigns').update({ is_active: isActive }).eq('id', id);
	if (error) return { ok: false, message: error.message };
	return { ok: true, id };
}
