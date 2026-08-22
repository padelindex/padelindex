<script lang="ts">
	/**
	 * Copyright (c) 2025–2026 Alec Hahn / Sportcenter Hahn GmbH
	 * All rights reserved.
	 * Proprietary and confidential.
	 * See LICENSE for details.
	 */

	import '$lib/styles/landing.css';
	import { jsonLd } from '$lib/jsonld';
	import { m } from '$lib/paraglide/messages.js';

	let { children, data } = $props();

	const organization = $derived({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'PadelIndex',
		url: 'https://padelindex.de',
		logo: 'https://padelindex.de/logo.svg',
		description: m.org_description()
	});
</script>

<svelte:head>
	<link
		rel="alternate"
		type="application/rss+xml"
		title="PadelIndex — Live-Ticker"
		href="/feed.xml"
	/>
	{@html `<script type="application/ld+json">${jsonLd(organization)}</script>`}
	{#if data.cfBeaconToken}
		<!-- Cloudflare Web Analytics: cookiefrei, kein eigenes Deployment
		     nötig (Website-Audit Block 6). Ohne Token im Dashboard konfiguriert
		     bleibt dieses Script komplett weg, siehe lib/server/env.ts. -->
		<script
			defer
			src="https://static.cloudflareinsights.com/beacon.min.js"
			data-cf-beacon={JSON.stringify({ token: data.cfBeaconToken })}
		></script>
	{/if}
</svelte:head>

{@render children()}
