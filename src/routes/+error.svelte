<script lang="ts">
	import MinimalNav from '$lib/components/MinimalNav.svelte';

	let { error, status }: { error: { message: string }; status: number } = $props();
</script>

<svelte:head>
	<title>PadelIndex</title>
</svelte:head>

<MinimalNav />

<section class="sec">
	<div class="wrap">
		<span class="eyebrow">{status}</span>
		<h2 style="margin-top: 18px">{error?.message ?? 'Seite nicht gefunden'}</h2>
		<p class="muted" style="margin-top: 16px">
			<a href="/">Zurück zur Startseite</a>
		</p>
	</div>
</section>
