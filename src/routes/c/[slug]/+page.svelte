<script lang="ts">
	import { page } from '$app/state';
	import ClubLeaderboard from '$lib/components/ClubLeaderboard.svelte';
	import RatingLegend from '$lib/components/RatingLegend.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import { jsonLd } from '$lib/jsonld';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { mainNav } from '$lib/landing/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const clubName = $derived(data.board?.club.name ?? m.club_default_name());
	const clubUrl = $derived(`https://padelindex.de/c/${page.params.slug}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));

	const breadcrumbs = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' },
				{ '@type': 'ListItem', position: 2, name: clubName, item: clubUrl }
			]
		})
	);

	// Nur Seite 1: eine ItemList soll die vollständige Rangliste
	// beschreiben, nicht nur einen Ausschnitt — bei Paginierung würde ein
	// "Rang 26" ohne die Ränge 1–25 mehr verwirren als nützen.
	const itemList = $derived.by(() => {
		if (!data.board || data.board.page > 1) return null;
		return jsonLd({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: m.club_og_title({ clubName }),
			itemListElement: data.board.players.map((p) => ({
				'@type': 'ListItem',
				position: p.rank,
				name: p.name,
				url: `https://padelindex.de/p/${p.handle}`
			}))
		});
	});
	const description = $derived(m.club_meta_description({ clubName }));
	// Vereinsseiten sind indexierbar und werden verlinkt, deshalb eine
	// eigene Canonical-URL statt der Startseiten-Angabe. Ab Seite 2 zeigt
	// jede Seite auf sich selbst statt auf Seite 1 — die Spielerlisten
	// unterscheiden sich wirklich, eine Weiterleitung des Canonical auf
	// Seite 1 würde Google die hinteren Seiten faktisch verstecken.
	const canonical = $derived.by(() => {
		const base = `https://padelindex.de${page.url.pathname}`;
		const current = data.board?.page ?? 1;
		return current > 1 ? `${base}?page=${current}` : base;
	});
</script>

<svelte:head>
	<title>{m.club_title({ clubName })}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	{#if data.board && data.board.page > 1}
		<link
			rel="prev"
			href="https://padelindex.de{localizeHref(`/c/${page.params.slug}`)}{data.board.page - 1 > 1
				? `?page=${data.board.page - 1}`
				: ''}"
		/>
	{/if}
	{#if data.board && data.board.page < data.board.totalPages}
		<link
			rel="next"
			href="https://padelindex.de{localizeHref(`/c/${page.params.slug}`)}?page={data.board.page +
				1}"
		/>
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.club_og_title({ clubName })} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${breadcrumbs}</script>`}
	{#if itemList}
		{@html `<script type="application/ld+json">${itemList}</script>`}
	{/if}
</svelte:head>

<LandingNav links={mainNav()} />

<section class="sec sec-light">
	<div class="wrap" style="max-width: 720px">
		<div class="sec-head">
			<span class="eyebrow">{m.club_eyebrow()}</span>
			<h1>{data.board?.club.name ?? m.club_default_name()}</h1>
			<p class="muted">
				{m.club_intro_p()}
			</p>
			<div style="margin-top: 14px">
				<RatingLegend />
			</div>
		</div>
		<div style="margin-top: 36px">
			<ClubLeaderboard board={data.board} unavailable={data.unavailable} />
		</div>
		{#if data.board && data.board.totalPages > 1}
			<nav class="pager" aria-label={m.club_pager_aria()}>
				{#if data.board.page > 1}
					<a class="pager-btn" href="?page={data.board.page - 1}">{m.club_prev()}</a>
				{:else}
					<span class="pager-btn disabled">{m.club_prev()}</span>
				{/if}
				<span class="pager-status">
					{m.club_pager_status({
						page: data.board.page,
						totalPages: data.board.totalPages,
						total: data.board.total
					})}
				</span>
				{#if data.board.page < data.board.totalPages}
					<a class="pager-btn" href="?page={data.board.page + 1}">{m.club_next()}</a>
				{:else}
					<span class="pager-btn disabled">{m.club_next()}</span>
				{/if}
			</nav>
		{/if}
		{#if data.board}
			<p class="claim-cta">
				{m.club_claim_cta_pre()}
				<a href={localizeHref(`/c/${data.board.club.slug}/beanspruchen`)}
					>{m.club_claim_cta_link()}</a
				>
			</p>
			<p class="claim-cta muted-cta">
				{m.club_join_cta_pre()}
				<a href={localizeHref('/#anmelden')}>{m.club_join_cta_link()}</a>
			</p>
		{/if}
	</div>
</section>

<style>
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 18px;
		flex-wrap: wrap;
	}

	.pager-btn {
		padding: 8px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		font-size: 13px;
		text-decoration: none;
		color: inherit;
		white-space: nowrap;
	}

	.pager-btn:not(.disabled):hover {
		background: rgba(15, 110, 92, 0.08);
	}

	.pager-btn.disabled {
		color: var(--muted-light);
		border-color: transparent;
	}

	.pager-status {
		font-size: 12px;
		color: var(--muted-light);
		text-align: center;
	}

	.claim-cta {
		margin-top: 20px;
		text-align: center;
		font-size: 13px;
		color: var(--muted-light);
	}
	.claim-cta.muted-cta {
		margin-top: 8px;
	}
</style>
