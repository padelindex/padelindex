<script lang="ts">
	import { page } from '$app/state';
	import { safeRedirectTarget } from '$lib/auth';

	const next = $derived(
		safeRedirectTarget(page.url.searchParams.get('next'), { origin: page.url.origin })
	);
</script>

<svelte:head>
	<title>Link ungültig — PadelIndex</title>
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
	<div class="wrap" style="max-width: 480px; text-align: center">
		<h1>Link ungültig oder abgelaufen</h1>
		<p class="muted">
			Bestätigungslinks gelten nur einmal und laufen nach einiger Zeit ab. Fordere einfach einen
			neuen an.
		</p>
		<a class="btn btn-primary" href={next} style="margin-top: 24px; display: inline-block">
			Zurück
		</a>
	</div>
</section>
