// ============================================================
// PadelIndex — Werbe- & Sponsoring-System: geteilte Typen & Helfer
// ============================================================
// Von Server (lib/server/advertising.ts, Admin-CRUD) UND Browser
// (AdBanner.svelte, öffentliches Ausliefern) genutzt — deshalb hier ohne
// $lib/server-Import, rein clientseitig lauffähig.

export const CAMPAIGN_POSITIONS = ['desktop_leaderboard', 'content_ad', 'mobile_banner'] as const;

export type CampaignPosition = (typeof CAMPAIGN_POSITIONS)[number];

export type Campaign = {
	id: string;
	sponsorName: string;
	logoUrl: string | null;
	bannerUrl: string;
	targetUrl: string;
	campaignName: string;
	startDate: string;
	endDate: string;
	position: CampaignPosition;
	targetRegion: string | null;
	impressions: number;
	clicks: number;
	isActive: boolean;
	createdAt: string;
};

export type CampaignMetric = 'impression' | 'click';

/** CTR in Prozent, gerundet auf zwei Nachkommastellen. 0 Impressionen → 0, nicht NaN/Infinity. */
export function campaignCtr(campaign: Pick<Campaign, 'clicks' | 'impressions'>): number {
	if (campaign.impressions <= 0) return 0;
	return Math.round((campaign.clicks / campaign.impressions) * 100 * 100) / 100;
}

/** Läuft die Kampagne genau jetzt (aktiv + im Datumsfenster)? Spiegelt die RLS-Policy campaigns_public_read_running. */
export function isCampaignRunning(
	campaign: Pick<Campaign, 'isActive' | 'startDate' | 'endDate'>,
	now = new Date()
): boolean {
	if (!campaign.isActive) return false;
	const start = new Date(campaign.startDate).getTime();
	const end = new Date(campaign.endDate).getTime();
	const t = now.getTime();
	return t >= start && t <= end;
}

/**
 * Zufällige Auswahl unter mehreren passenden Kampagnen. Aktuell gleichverteilt
 * (jede Kampagne gleich wahrscheinlich) — priority ist als Spalte bewusst noch
 * nicht angelegt (0027_advertising_campaigns.sql), diese Funktion ist aber
 * schon so gebaut, dass eine spätere Gewichtung nur den weight()-Aufruf
 * unten ersetzen muss, ohne AdBanner.svelte anzufassen.
 */
export function pickRandomCampaign<T extends { id: string }>(
	campaigns: readonly T[],
	weight: (campaign: T) => number = () => 1
): T | null {
	if (campaigns.length === 0) return null;
	if (campaigns.length === 1) return campaigns[0];

	const weights = campaigns.map((c) => Math.max(0, weight(c)));
	const total = weights.reduce((sum, w) => sum + w, 0);
	if (total <= 0) return campaigns[Math.floor(Math.random() * campaigns.length)];

	let roll = Math.random() * total;
	for (let i = 0; i < campaigns.length; i++) {
		roll -= weights[i];
		if (roll <= 0) return campaigns[i];
	}
	return campaigns[campaigns.length - 1];
}
