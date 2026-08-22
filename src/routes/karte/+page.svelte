<script lang="ts">
	// ============================================================
	// PadelIndex — /karte
	// ============================================================
	// Übersicht aller erfassten Padel-Anlagen in Deutschland, mit
	// Hervorhebung derer, die PadelIndex nutzen.
	//
	// EHRLICHKEIT ÜBER DEN DATENSTAND: das Verzeichnis erhebt keinen
	// Anspruch auf Vollständigkeit und sagt das auch. Anlagen ohne
	// Koordinaten erscheinen nicht auf der Karte, stehen aber in der
	// Liste und werden gezählt — statt sie stillschweigend zu verlieren.
	//
	// DIE LISTE IST KEIN BEIWERK: eine Karte ist für Screenreader und
	// Tastaturnutzung praktisch wertlos. Dieselben Daten stehen deshalb
	// als bedienbare Liste darunter, nicht als Zusatz, sondern als
	// gleichwertiger Weg. Sie rendert außerdem serverseitig — die Seite
	// ist damit auch ohne JavaScript und für Suchmaschinen vollständig.

	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import VenueMap from '$lib/components/VenueMap.svelte';
	import { filterVenues, type VenueFilter } from '$lib/venues';
	import type { PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	let { data }: { data: PageData } = $props();

	let filter = $state<VenueFilter>('all');
	let query = $state('');
	let selectedId = $state<string | null>(null);

	const shown = $derived(filterVenues(data.venues, filter, query));
	const shownOnMap = $derived(shown.filter((v) => v.lat !== null));
	const FILTERS: VenueFilter[] = ['all', 'partner', 'non_partner'];
	const FILTER_LABELS = $derived({
		all: m.karte_filter_all(),
		partner: m.karte_legend_partner(),
		non_partner: m.karte_filter_non_partner()
	});

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));
</script>

<svelte:head>
	<title>{m.karte_meta_title()}</title>
	<meta name="description" content={m.karte_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.karte_og_title()} />
	<meta property="og:description" content={m.karte_og_description()} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.karte_eyebrow()}</span>
				<h1 use:reveal={{ delay: 0.05 }}>{m.karte_h1()}</h1>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{#if data.venues.length === 0}
						{m.karte_intro_empty()}
					{:else}
						{m.karte_intro_stats({
							count: data.venues.length,
							unit: data.venues.length === 1 ? m.karte_count_singular() : m.karte_count_plural(),
							partnerCount: data.partnerCount
						})}
						<a
							href="mailto:kontakt@padelindex.de?subject={encodeURIComponent(
								m.karte_missing_venue_subject()
							)}"
						>
							{m.karte_intro_link()}
						</a>.
					{/if}
				</p>
			</div>

			<!-- ============================ LEGENDE ============================ -->
			<ul class="legend" use:reveal>
				<li><span class="dot dot-partner" aria-hidden="true"></span> {m.karte_legend_partner()}</li>
				<li><span class="dot dot-open" aria-hidden="true"></span> {m.karte_legend_open()}</li>
			</ul>

			<!-- ============================ FILTER + SUCHE ============================ -->
			<div class="controls" use:reveal>
				<div class="filters" role="group" aria-label={m.karte_filter_aria()}>
					{#each FILTERS as f (f)}
						<button
							type="button"
							class="chip"
							class:active={filter === f}
							aria-pressed={filter === f}
							onclick={() => (filter = f)}
						>
							{FILTER_LABELS[f]}
						</button>
					{/each}
				</div>

				<div class="searchbox">
					<label class="sr-only" for="venue-search">{m.karte_search_label()}</label>
					<input
						id="venue-search"
						type="search"
						placeholder={m.karte_search_placeholder()}
						bind:value={query}
						autocomplete="off"
					/>
				</div>
			</div>

			<p class="count" role="status" aria-live="polite">
				{shown.length}
				{shown.length === 1 ? m.karte_count_singular() : m.karte_count_plural()}
				{#if shown.length !== shownOnMap.length}
					· {m.karte_count_no_coords({ count: shown.length - shownOnMap.length })}
				{/if}
			</p>

			<!-- ============================ KARTE ============================ -->
			{#if shownOnMap.length > 0}
				<VenueMap venues={shownOnMap} bind:selectedId />
			{/if}

			<!-- ============================ LISTE ============================ -->
			<h2 class="listtitle" use:reveal>{m.karte_list_title()}</h2>

			{#if shown.length === 0}
				<p class="empty">
					{m.karte_empty()}
				</p>
			{:else}
				<ul class="venues">
					{#each shown as v (v.id)}
						<li class="venue" class:partner={v.isPartner} class:active={selectedId === v.id}>
							<div class="v-head">
								<h3>{v.name}</h3>
								<span class="badge" class:badge-partner={v.isPartner}>
									{v.isPartner ? m.karte_legend_partner() : m.karte_filter_non_partner()}
								</span>
							</div>

							{#if v.address || v.city}
								<p class="v-addr">
									{#if v.address}{v.address}{/if}
									{#if v.address && (v.postalCode || v.city)}<br />{/if}
									{[v.postalCode, v.city].filter(Boolean).join(' ')}
								</p>
							{/if}

							<div class="v-links">
								{#if v.lat !== null}
									<button type="button" class="linkish" onclick={() => (selectedId = v.id)}>
										{m.karte_show_on_map()}
									</button>
								{/if}
								{#if v.website}
									<a href={v.website} target="_blank" rel="noopener noreferrer"
										>{m.karte_website()}</a
									>
								{/if}
								{#if v.isPartner && v.clubSlug}
									<a href={localizeHref(`/c/${v.clubSlug}`)}>{m.karte_ranking()}</a>
								{/if}
							</div>

							{#if !v.isPartner}
								<div class="v-cta">
									<p>{m.karte_owner_cta_p()}</p>
									<div class="v-cta-actions">
										<a class="btn btn-primary" href={localizeHref('/vereine#demo')}
											>{m.karte_owner_cta_link()}</a
										>
										<a
											class="linkish"
											href="mailto:kontakt@padelindex.de?subject={encodeURIComponent(
												m.venuemap_email_subject({ name: v.name })
											)}"
										>
											kontakt@padelindex.de
										</a>
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	h1 {
		margin-top: 18px;
	}
	.sec-head .muted {
		margin-top: 14px;
		max-width: 62ch;
	}
	.sec-head a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		list-style: none;
		margin: 28px 0 0;
		padding: 0;
		font-size: 14px;
		color: var(--muted-light);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 1.5px solid var(--night);
		flex-shrink: 0;
	}
	.dot-partner {
		background: #16a394;
	}
	.dot-open {
		background: #e9b23c;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		justify-content: space-between;
		margin-top: 20px;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		padding: 8px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light);
		background: transparent;
		color: var(--muted-light);
		font-family: var(--body);
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s,
			background 0.15s;
	}
	.chip:hover {
		border-color: var(--court);
		color: var(--court-deep, #0f6e5c);
	}
	.chip.active {
		background: var(--court);
		border-color: var(--court);
		color: #04231f;
	}
	.searchbox {
		flex: 1 1 220px;
		max-width: 340px;
	}
	.searchbox input {
		width: 100%;
		padding: 10px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light);
		background: #fff;
		color: var(--ink);
		font-family: var(--body);
		font-size: 14px;
	}
	.searchbox input::placeholder {
		color: var(--muted-light);
	}

	.count {
		margin-top: 14px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.05em;
		color: var(--muted-light);
	}

	.listtitle {
		margin-top: 44px;
		font-size: clamp(22px, 2.6vw, 30px);
	}
	.empty {
		margin-top: 16px;
		color: var(--muted-light);
	}

	.venues {
		list-style: none;
		margin: 20px 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}
	.venue {
		padding: 18px;
		border-radius: 14px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2);
		border-left: 4px solid #e9b23c;
	}
	.venue.partner {
		border-left-color: #16a394;
	}
	.venue.active {
		border-color: var(--court);
	}
	.v-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}
	.v-head h3 {
		font-size: 17px;
	}
	.badge {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 3px 9px;
		border-radius: 100px;
		background: rgba(233, 178, 60, 0.22);
		color: #7a5300;
		white-space: nowrap;
	}
	.badge-partner {
		background: rgba(22, 163, 148, 0.16);
		color: var(--court-deep, #0f6e5c);
	}
	.v-addr {
		margin-top: 8px;
		font-size: 13.5px;
		color: var(--muted-light);
		line-height: 1.5;
	}
	.v-links {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin-top: 12px;
		font-size: 13.5px;
	}
	.v-links a,
	.linkish {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}
	.v-links a:hover,
	.linkish:hover {
		border-bottom-color: currentColor;
	}
	.linkish {
		background: none;
		border: none;
		border-bottom: 1px solid transparent;
		padding: 0;
		font-family: var(--body);
		font-size: inherit;
		cursor: pointer;
	}

	.v-cta {
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--line-light);
	}
	.v-cta p {
		font-size: 13.5px;
		color: var(--ink);
	}
	.v-cta-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin-top: 10px;
		font-size: 13.5px;
	}
</style>
