<script lang="ts">
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import GuideHero from '$lib/components/guides/GuideHero.svelte';
	import GuideCategoryCard from '$lib/components/guides/GuideCategoryCard.svelte';
	import GuideCard from '$lib/components/guides/GuideCard.svelte';
	import GuideCTA from '$lib/components/guides/GuideCTA.svelte';
	import FAQAccordion from '$lib/components/guides/FAQAccordion.svelte';
	import { mainNav } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import {
		CATEGORY_LABELS,
		type GuideCategory,
		guidesByCategory,
		popularGuides,
		beginnerGuides,
		searchGuides
	} from '$lib/guides';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const CATEGORIES = Object.keys(CATEGORY_LABELS) as GuideCategory[];

	let query = $state('');
	const filtered = $derived(searchGuides(data.guides, query));

	const popular = $derived(popularGuides(data.guides));
	const beginner = $derived(beginnerGuides(data.guides));

	const faq = [
		{
			question: 'Ist der PadelIndex-Ratgeber kostenlos?',
			answer: 'Ja, alle Ratgeberartikel sind frei zugänglich und kostenlos.'
		},
		{
			question: 'Für wen ist der Ratgeber gedacht?',
			answer:
				'Für alle: komplette Anfänger, Freizeitspieler, Fortgeschrittene und alle, die sich für Padel interessieren — von den Grundregeln bis zu Taktik-Details.'
		},
		{
			question: 'Wie aktuell sind die Inhalte?',
			answer:
				'Wir pflegen die Artikel laufend und ergänzen sie um neue Themen. Jeder Artikel zeigt oben, wann er zuletzt aktualisiert wurde.'
		},
		{
			question: 'Wie finde ich passende Mitspieler oder einen Verein?',
			answer:
				'Auf der Karte findest du Padel-Anlagen in Deutschland, und mit dem PadelIndex-Level-Test bekommst du eine erste Einschätzung deines Spielniveaus.'
		}
	];

	const faqSchema = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: { '@type': 'Answer', text: item.answer }
		}))
	});

	const breadcrumbSchema = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' },
			{ '@type': 'ListItem', position: 2, name: 'Ratgeber', item: 'https://padelindex.de/ratgeber' }
		]
	});
</script>

<svelte:head>
	<title>Padel Ratgeber: Regeln, Ausrüstung, Technik und Taktik einfach erklärt — PadelIndex</title>
	<meta
		name="description"
		content="Der PadelIndex-Ratgeber: Regeln, Ausrüstung, Technik und Taktik verständlich erklärt — für Anfänger, Freizeitspieler und Fortgeschrittene."
	/>
	<link rel="canonical" href="https://padelindex.de/ratgeber" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/ratgeber" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta
		property="og:title"
		content="Padel Ratgeber: Regeln, Ausrüstung, Technik und Taktik einfach erklärt"
	/>
	<meta
		property="og:description"
		content="Alles, was du wissen musst, um mit Padel zu starten, besser zu werden und dein Spiel cleverer zu machen."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${faqSchema}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchema}</script>`}
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light">
		<div class="wrap">
			<GuideHero
				eyebrow="PadelIndex Ratgeber"
				headline="Padel Ratgeber: Regeln, Ausrüstung, Technik und Taktik einfach erklärt"
				subheadline="Alles, was du wissen musst, um mit Padel zu starten, besser zu werden und dein Spiel cleverer zu machen."
				primaryHref="/quiz"
				primaryLabel="Padel-Wissen testen"
				secondaryHref="#kategorien"
				secondaryLabel="Ratgeber entdecken"
			/>

			<div class="search-row">
				<label for="guide-search" class="sr-only">Ratgeber durchsuchen</label>
				<input
					id="guide-search"
					type="search"
					placeholder="Suche z. B. „Schläger“ oder „Aufschlag“ …"
					bind:value={query}
				/>
			</div>

			<div class="cat-grid" id="kategorien">
				{#each CATEGORIES as category (category)}
					<GuideCategoryCard {category} count={guidesByCategory(data.guides, category).length} />
				{/each}
			</div>
		</div>
	</section>

	{#if query.trim()}
		<section class="sec sec-light">
			<div class="wrap">
				<h2>Suchergebnisse für „{query}“</h2>
				{#if filtered.length === 0}
					<p class="muted">Keine Artikel gefunden. Versuch einen anderen Suchbegriff.</p>
				{:else}
					<div class="grid">
						{#each filtered as guide (guide.slug)}
							<GuideCard {guide} />
						{/each}
					</div>
				{/if}
			</div>
		</section>
	{:else}
		{#each CATEGORIES as category (category)}
			<section class="sec sec-light" id="kategorie-{category}">
				<div class="wrap">
					<h2>{CATEGORY_LABELS[category]}</h2>
					<div class="grid">
						{#each guidesByCategory(data.guides, category) as guide (guide.slug)}
							<GuideCard {guide} />
						{/each}
					</div>
				</div>
			</section>
		{/each}

		<section class="sec sec-light">
			<div class="wrap">
				<h2>Beliebte Ratgeber</h2>
				<div class="grid">
					{#each popular as guide (guide.slug)}
						<GuideCard {guide} />
					{/each}
				</div>
			</div>
		</section>

		<section class="sec sec-light">
			<div class="wrap">
				<h2>Für Anfänger empfohlen</h2>
				<div class="grid">
					{#each beginner as guide (guide.slug)}
						<GuideCard {guide} />
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<section class="sec sec-light">
		<div class="wrap" style="max-width: 720px">
			<GuideCTA
				heading="Weißt du, wie stark du wirklich spielst?"
				text="Der PadelIndex-Level-Test gibt dir in wenigen Fragen eine erste Einschätzung deines Spielniveaus."
				primaryHref="/level-schaetzen"
				primaryLabel="Level jetzt schätzen"
				secondaryHref="/karte"
				secondaryLabel="Padelclub finden"
			/>
		</div>
	</section>

	<section class="sec sec-light">
		<div class="wrap" style="max-width: 720px">
			<h2>Häufige Fragen</h2>
			<FAQAccordion items={faq} />
		</div>
	</section>
</main>

<LandingFooter />

<style>
	main {
		background: var(--chalk);
	}

	.search-row {
		max-width: 480px;
		margin: 0 auto 40px;
	}

	.search-row input {
		width: 100%;
		box-sizing: border-box;
		padding: 14px 20px;
		border-radius: 100px;
		border: 1px solid var(--line-light);
		background: #fff;
		font-family: var(--body);
		font-size: 14.5px;
	}

	.search-row input:focus-visible {
		outline: 2px solid var(--court-deep);
		outline-offset: 2px;
	}

	.cat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px;
	}

	h2 {
		font-size: 22px;
		margin: 0 0 20px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 16px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
