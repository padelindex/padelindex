<script lang="ts">
	import '$lib/styles/landing.css';
	import { jsonLd } from '$lib/jsonld';

	let { children } = $props();

	const organization = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'PadelIndex',
		url: 'https://padelindex.de',
		logo: 'https://padelindex.de/logo.svg',
		description:
			'Unabhängige Level-Rangliste für Padel-Amateure, berechnet aus bestätigten Matches statt Selbsteinschätzung.'
	};
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd(organization)}</script>`}
</svelte:head>

{@render children()}
