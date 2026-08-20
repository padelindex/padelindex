<script lang="ts">
	import { page } from '$app/state';
	import ClubLeaderboard from '$lib/components/ClubLeaderboard.svelte';
	import RatingLegend from '$lib/components/RatingLegend.svelte';
	import { jsonLd } from '$lib/jsonld';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const clubName = $derived(data.board?.club.name ?? 'Verein');
	const clubUrl = $derived(`https://padelindex.de/c/${page.params.slug}`);

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
			name: `${clubName} — Level-Ranking`,
			itemListElement: data.board.players.map((p) => ({
				'@type': 'ListItem',
				position: p.rank,
				name: p.name,
				url: `https://padelindex.de/p/${p.handle}`
			}))
		});
	});
	const description = $derived(
		`Öffentliches Level-Ranking von ${clubName} auf PadelIndex — aus bestätigten Matches, mit Sicherheitsgrad je Spieler.`
	);
	// Vereinsseiten sind indexierbar und werden verlinkt, deshalb eine
	// eigene Canonical-URL statt der Startseiten-Angabe. Ab Seite 2 zeigt
	// jede Seite auf sich selbst statt auf Seite 1 — die Spielerlisten
	// unterscheiden sich wirklich, eine Weiterleitung des Canonical auf
	// Seite 1 würde Google die hinteren Seiten faktisch verstecken.
	const canonical = $derived.by(() => {
		const base = `https://padelindex.de/c/${page.params.slug}`;
		const current = data.board?.page ?? 1;
		return current > 1 ? `${base}?page=${current}` : base;
	});
</script>

<svelte:head>
	<title>{clubName} — Level-Ranking | PadelIndex</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if data.board && data.board.page > 1}
		<link
			rel="prev"
			href="https://padelindex.de/c/{page.params.slug}{data.board.page - 1 > 1
				? `?page=${data.board.page - 1}`
				: ''}"
		/>
	{/if}
	{#if data.board && data.board.page < data.board.totalPages}
		<link rel="next" href="https://padelindex.de/c/{page.params.slug}?page={data.board.page + 1}" />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="{clubName} — Level-Ranking" />
	<meta property="og:description" content={description} />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${breadcrumbs}</script>`}
	{#if itemList}
		{@html `<script type="application/ld+json">${itemList}</script>`}
	{/if}
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		<a class="btn btn-primary" href="/#anmelden">Platz sichern</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 720px">
		<div class="sec-head">
			<span class="eyebrow">Vereinsranking</span>
			<h2>{data.board?.club.name ?? 'Verein'}</h2>
			<p class="muted">
				Öffentliche Rangliste aus bestätigten Matches. Der Ring neben der Zahl zeigt, wie sicher der
				Wert ist.
			</p>
			<div style="margin-top: 14px">
				<RatingLegend />
			</div>
		</div>
		<div style="margin-top: 36px">
			<ClubLeaderboard board={data.board} unavailable={data.unavailable} />
		</div>
		{#if data.board && data.board.totalPages > 1}
			<nav class="pager" aria-label="Seiten">
				{#if data.board.page > 1}
					<a class="pager-btn" href="?page={data.board.page - 1}">← Vorherige</a>
				{:else}
					<span class="pager-btn disabled">← Vorherige</span>
				{/if}
				<span class="pager-status">
					Seite {data.board.page} von {data.board.totalPages} · {data.board.total} Spieler
				</span>
				{#if data.board.page < data.board.totalPages}
					<a class="pager-btn" href="?page={data.board.page + 1}">Nächste →</a>
				{:else}
					<span class="pager-btn disabled">Nächste →</span>
				{/if}
			</nav>
		{/if}
		{#if data.board}
			<p class="claim-cta">
				Du stehst in der Ligatabelle?
				<a href="/c/{data.board.club.slug}/beanspruchen">Profil beanspruchen</a>
			</p>
			<p class="claim-cta muted-cta">
				Dein Verein ist noch nicht dabei?
				<a href="/#anmelden">Für deinen Verein eintragen</a>
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
		opacity: 0.5;
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
