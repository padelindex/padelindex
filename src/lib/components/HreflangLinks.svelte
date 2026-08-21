<script lang="ts">
	// Rendert die vier hreflang-Alternates einer In-Scope-Seite (de/en/es +
	// x-default) — siehe src/lib/i18n/hreflang.ts für die einzige Quelle
	// der Wahrheit, die auch die Sitemap verwendet.

	import { hreflangLinksFor } from '$lib/i18n/hreflang';

	let { path }: { path: string } = $props();

	const links = $derived(hreflangLinksFor(path));
</script>

{#each links as link (link.hreflang)}
	<link rel="alternate" hreflang={link.hreflang} href={link.href} />
{/each}
