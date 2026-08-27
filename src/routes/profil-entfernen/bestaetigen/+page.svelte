<script lang="ts">
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Profil entfernt — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav />

<section class="sec sec-light">
	<div class="wrap" style="max-width: 480px">
		{#if data.ok}
			<div class="sec-head">
				<h1>Erledigt</h1>
				<p class="muted">
					Das Profil ist jetzt aus der öffentlichen Rangliste entfernt. Wer die alte Profilseite
					aufruft, sieht ab sofort nichts mehr davon.
				</p>
			</div>
		{:else}
			<div class="sec-head">
				<h1>Konnte nicht bestätigt werden</h1>
				<p class="err" role="alert">{data.message}</p>
			</div>
			<a class="btn btn-ghost-light" href="/profil-entfernen" style="margin-top: 8px; display: inline-block">
				Neuen Link anfordern
			</a>
		{/if}
	</div>
</section>

<style>
	.err {
		margin: 16px 0 0;
		font-size: 14px;
		color: #a3341f;
	}
</style>
