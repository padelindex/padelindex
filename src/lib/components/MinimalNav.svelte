<script lang="ts">
	// Die schlanke Nav (nur Logo + optional ein Aktions-Link) für Auth-,
	// Rechts- und Task-Seiten, die bewusst KEIN volles Hauptmenü zeigen
	// sollen (Registrierung, Login, Impressum, ein Match anlegen, ...) —
	// dieselbe Markup lag vorher als Kopie in über 20 Dateien.
	import type { Snippet } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { brandHref = '/', children }: { brandHref?: string; children?: Snippet } = $props();

	// Ein Anker auf der aktuellen Seite selbst (z. B. "#top") bleibt
	// unangetastet, nur ein echter Pfad braucht localizeHref().
	const localizedBrandHref = $derived(
		brandHref.startsWith('#') ? brandHref : localizeHref(brandHref)
	);
</script>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href={localizedBrandHref} aria-label={m.nav_brand_aria()}>
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		{@render children?.()}
	</div>
</nav>
