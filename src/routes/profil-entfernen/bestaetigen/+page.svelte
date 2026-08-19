<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Profil entfernt — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 480px">
		{#if data.ok}
			<div class="sec-head">
				<h2>Erledigt</h2>
				<p class="muted">
					Das Profil ist jetzt aus der öffentlichen Rangliste entfernt. Wer die alte Profilseite
					aufruft, sieht ab sofort nichts mehr davon.
				</p>
			</div>
		{:else}
			<div class="sec-head">
				<h2>Konnte nicht bestätigt werden</h2>
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
