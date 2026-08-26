<script lang="ts">
	// ============================================================
	// PadelIndex — Wiederverwendbarer Werbe-Slot
	// ============================================================
	// <AdBanner position="content_ad" region="muenchen" /> — holt sich
	// selbständig eine passende, GERADE laufende Kampagne direkt per
	// anon-Key vom Browser. Kein eigener Server-Endpunkt nötig: die
	// campaigns_public_read_running-Policy (0027_advertising_campaigns.sql)
	// lässt für anon/authenticated ohnehin nur Zeilen durch, die is_active
	// sind UND im Datumsfenster liegen — die Abfrage hier filtert nur noch
	// zusätzlich nach position/region.
	//
	// Ohne region-Prop werden nur plattformweite Kampagnen ausgeliefert
	// (target_region IS NULL). Mit region-Prop kommen zusätzlich Kampagnen
	// dazu, die genau diese Region ansprechen — eine Region-Kampagne wird
	// nie außerhalb ihrer Region gezeigt, eine plattformweite dagegen überall.
	//
	// Klick-/Impressions-Zählung läuft ausschließlich über die
	// increment_campaign_stat()-RPC (SECURITY DEFINER) — dieser Client hat
	// nie UPDATE-Rechte auf campaigns selbst.
	import { page } from '$app/state';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { createBrowserSupabase } from '$lib/supabase-browser';
	import {
		pickRandomCampaign,
		type Campaign,
		type CampaignMetric,
		type CampaignPosition
	} from '$lib/advertising';

	let { position, region }: { position: CampaignPosition; region?: string } = $props();

	const supabaseConfig = page.data.supabaseConfig as { url: string; anonKey: string } | null;
	const supabase: SupabaseClient | null = supabaseConfig
		? createBrowserSupabase(supabaseConfig.url, supabaseConfig.anonKey)
		: null;

	// Nur einfache Slugs durchlassen (defense in depth) — region landet unten
	// unmaskiert in einem PostgREST .or()-Filterausdruck, ein Komma oder
	// Punkt darin könnte sonst den Filter verbiegen.
	const REGION_PATTERN = /^[a-z0-9-]+$/i;

	let campaign = $state<Campaign | null>(null);
	let rootEl: HTMLElement | undefined = $state();
	let impressionLogged = false;

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

	async function loadCampaign() {
		if (!supabase) return;

		const nowIso = new Date().toISOString();
		const safeRegion = region && REGION_PATTERN.test(region) ? region : undefined;

		let query = supabase
			.from('campaigns')
			.select(
				'id, sponsor_name, logo_url, banner_url, target_url, campaign_name, start_date, end_date, position, target_region, impressions, clicks, is_active, created_at'
			)
			.eq('position', position)
			.eq('is_active', true)
			.lte('start_date', nowIso)
			.gte('end_date', nowIso);

		query = safeRegion
			? query.or(`target_region.is.null,target_region.eq.${safeRegion}`)
			: query.is('target_region', null);

		const { data, error } = await query;
		campaign = error || !data || data.length === 0 ? null : pickRandomCampaign(data.map(mapRow));
	}

	async function logMetric(metric: CampaignMetric) {
		if (!supabase || !campaign) return;
		try {
			await supabase.rpc('increment_campaign_stat', {
				p_campaign_id: campaign.id,
				p_metric: metric
			});
		} catch {
			// best-effort — eine verpasste Zählung blockiert weder Anzeige noch Klick
		}
	}

	function handleClick() {
		void logMetric('click');
	}

	$effect(() => {
		loadCampaign();
	});

	// Eigener Effect statt onMount: muss neu aufgesetzt werden, sobald erst
	// nach dem Laden eine Kampagne (und damit rootEl im DOM) verfügbar wird.
	$effect(() => {
		if (!rootEl || !campaign || impressionLogged) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !impressionLogged) {
						impressionLogged = true;
						void logMetric('impression');
						observer.disconnect();
					}
				}
			},
			{ threshold: 0.5 }
		);
		observer.observe(rootEl);

		return () => observer.disconnect();
	});
</script>

{#if campaign}
	<div class="ad-banner" bind:this={rootEl} data-position={position}>
		<span class="ad-banner__label">Anzeige</span>
		<a
			href={campaign.targetUrl}
			target="_blank"
			rel="sponsored noopener noreferrer"
			onclick={handleClick}
			aria-label={`${campaign.sponsorName}: ${campaign.campaignName}`}
		>
			<img
				src={campaign.bannerUrl}
				alt={`${campaign.sponsorName} – ${campaign.campaignName}`}
				loading="lazy"
			/>
		</a>
	</div>
{/if}

<style>
	.ad-banner {
		position: relative;
		display: block;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.03);
	}

	.ad-banner__label {
		position: absolute;
		top: 6px;
		left: 6px;
		z-index: 1;
		padding: 2px 8px;
		border-radius: 100px;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.ad-banner a {
		display: block;
	}

	.ad-banner img {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
