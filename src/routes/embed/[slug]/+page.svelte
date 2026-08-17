<script lang="ts">
	import ClubLeaderboard from '$lib/components/ClubLeaderboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.board?.club.name ?? 'Ranking'} — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="embed-shell">
	<ClubLeaderboard board={data.board} unavailable={data.unavailable} compact />
</div>

<style>
	:global(body) {
		background: transparent;
	}
	.embed-shell {
		padding: 0;
		max-width: 640px;
		margin: 0 auto;
	}
</style>
