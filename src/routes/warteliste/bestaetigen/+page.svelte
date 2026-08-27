<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Warteliste bestätigt — PadelIndex</title>
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
				<h1>Bestätigt</h1>
				<p class="muted">
					Du bist auf der Warteliste. Wir melden uns, sobald dein Verein dabei ist.
				</p>
			</div>
		{:else}
			<div class="sec-head">
				<h1>Konnte nicht bestätigt werden</h1>
				<p class="err" role="alert">{data.message}</p>
			</div>
			<a class="btn btn-ghost-light" href="/#anmelden" style="margin-top: 8px; display: inline-block">
				Erneut eintragen
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
