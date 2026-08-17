<script lang="ts">
	let { error, status }: { error: { message: string }; status: number } = $props();
</script>

<svelte:head>
	<title>PadelIndex</title>
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
	</div>
</nav>

<section class="sec">
	<div class="wrap">
		<span class="eyebrow">{status}</span>
		<h2 style="margin-top: 18px">{error.message}</h2>
		<p class="muted" style="margin-top: 16px">
			<a href="/">Zurück zur Startseite</a>
		</p>
	</div>
</section>
