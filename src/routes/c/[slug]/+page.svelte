<script lang="ts">
	import ClubLeaderboard from '$lib/components/ClubLeaderboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.board?.club.name ?? 'Verein'} — PadelIndex</title>
	<meta
		name="description"
		content="Öffentliches Level-Ranking von {data.board?.club.name ??
			'diesem Verein'} auf PadelIndex."
	/>
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
		</div>
		<div style="margin-top: 36px">
			<ClubLeaderboard board={data.board} unavailable={data.unavailable} />
		</div>
		{#if data.board}
			<p class="claim-cta">
				Du stehst in der Ligatabelle?
				<a href="/c/{data.board.club.slug}/beanspruchen">Profil beanspruchen</a>
			</p>
		{/if}
	</div>
</section>

<style>
	.claim-cta {
		margin-top: 20px;
		text-align: center;
		font-size: 13px;
		color: var(--muted-light);
	}
</style>
