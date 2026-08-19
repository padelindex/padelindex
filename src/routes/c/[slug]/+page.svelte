<script lang="ts">
	import { page } from '$app/state';
	import ClubLeaderboard from '$lib/components/ClubLeaderboard.svelte';
	import RatingLegend from '$lib/components/RatingLegend.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const clubName = $derived(data.board?.club.name ?? 'Verein');
	const description = $derived(
		`Öffentliches Level-Ranking von ${clubName} auf PadelIndex — aus bestätigten Matches, mit Sicherheitsgrad je Spieler.`
	);
	// Vereinsseiten sind indexierbar und werden verlinkt, deshalb eine
	// eigene Canonical-URL statt der Startseiten-Angabe.
	const canonical = $derived(`https://padelindex.de/c/${page.params.slug}`);
</script>

<svelte:head>
	<title>{clubName} — Level-Ranking | PadelIndex</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="{clubName} — Level-Ranking" />
	<meta property="og:description" content={description} />
	<meta name="theme-color" content="#0B1E26" />
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
</style>
