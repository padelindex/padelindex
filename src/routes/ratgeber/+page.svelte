<script lang="ts">
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import GuideHero from '$lib/components/guides/GuideHero.svelte';
	import GuideCategoryCard from '$lib/components/guides/GuideCategoryCard.svelte';
	import GuideCard from '$lib/components/guides/GuideCard.svelte';
	import GuideCTA from '$lib/components/guides/GuideCTA.svelte';
	import FAQAccordion from '$lib/components/guides/FAQAccordion.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { page } from '$app/state';
	import { mainNav } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import {
		categoryLabels,
		type GuideCategory,
		guidesByCategory,
		popularGuides,
		beginnerGuides,
		searchGuides
	} from '$lib/guides';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ogLocaleFor } from '$lib/i18n/hreflang';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const CATEGORIES = $derived(Object.keys(categoryLabels()) as GuideCategory[]);
	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));

	let query = $state('');
	const filtered = $derived(searchGuides(data.guides, query));

	const popular = $derived(popularGuides(data.guides));
	const beginner = $derived(beginnerGuides(data.guides));

	const faq = $derived([
		{ question: m.ratgeber_faq_q1(), answer: m.ratgeber_faq_a1() },
		{ question: m.ratgeber_faq_q2(), answer: m.ratgeber_faq_a2() },
		{ question: m.ratgeber_faq_q3(), answer: m.ratgeber_faq_a3() },
		{ question: m.ratgeber_faq_q4(), answer: m.ratgeber_faq_a4() }
	]);

	const faqSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: faq.map((item) => ({
				'@type': 'Question',
				name: item.question,
				acceptedAnswer: { '@type': 'Answer', text: item.answer }
			}))
		})
	);

	const breadcrumbSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' },
				{
					'@type': 'ListItem',
					position: 2,
					name: m.guide_breadcrumb_ratgeber(),
					item: 'https://padelindex.de/ratgeber'
				}
			]
		})
	);
</script>

<svelte:head>
	<title>{m.ratgeber_meta_title()}</title>
	<meta name="description" content={m.ratgeber_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.ratgeber_og_title()} />
	<meta property="og:description" content={m.ratgeber_og_description()} />
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
				eyebrow={m.ratgeber_hero_eyebrow()}
				headline={m.ratgeber_og_title()}
				subheadline={m.ratgeber_og_description()}
				primaryHref={localizeHref('/quiz')}
				primaryLabel={m.ratgeber_hero_primary_label()}
				secondaryHref="#kategorien"
				secondaryLabel={m.ratgeber_hero_secondary_label()}
			/>

			<div class="search-row">
				<label for="guide-search" class="sr-only">{m.ratgeber_search_label()}</label>
				<input
					id="guide-search"
					type="search"
					placeholder={m.ratgeber_search_placeholder()}
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
				<h2>{m.ratgeber_search_results({ query })}</h2>
				{#if filtered.length === 0}
					<p class="muted">{m.ratgeber_search_empty()}</p>
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
					<h2>{categoryLabels()[category]}</h2>
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
				<h2>{m.ratgeber_popular_heading()}</h2>
				<div class="grid">
					{#each popular as guide (guide.slug)}
						<GuideCard {guide} />
					{/each}
				</div>
			</div>
		</section>

		<section class="sec sec-light">
			<div class="wrap">
				<h2>{m.ratgeber_beginner_heading()}</h2>
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
				heading={m.ratgeber_cta_heading()}
				text={m.ratgeber_cta_text()}
				primaryHref="/level-schaetzen"
				primaryLabel={m.ratgeber_cta_primary_label()}
				secondaryHref={localizeHref('/karte')}
				secondaryLabel={m.ratgeber_cta_secondary_label()}
			/>
		</div>
	</section>

	<section class="sec sec-light">
		<div class="wrap" style="max-width: 720px">
			<h2>{m.guide_faq_heading()}</h2>
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
