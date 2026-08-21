<script lang="ts">
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import Breadcrumbs from '$lib/components/guides/Breadcrumbs.svelte';
	import TableOfContents from '$lib/components/guides/TableOfContents.svelte';
	import GuideBox from '$lib/components/guides/GuideBox.svelte';
	import RelatedGuides from '$lib/components/guides/RelatedGuides.svelte';
	import GuideCTA from '$lib/components/guides/GuideCTA.svelte';
	import FAQAccordion from '$lib/components/guides/FAQAccordion.svelte';
	import { MAIN_NAV } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '$lib/guides';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const guide = $derived(data.guide);
	const canonical = $derived(`https://padelindex.de/ratgeber/${guide.slug}`);

	const articleSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: guide.title,
			description: guide.metaDescription,
			dateModified: guide.updatedAt,
			datePublished: guide.updatedAt,
			inLanguage: 'de-DE',
			author: { '@type': 'Organization', name: 'PadelIndex' },
			publisher: { '@type': 'Organization', name: 'PadelIndex' },
			mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
		})
	);

	const faqSchema = $derived(
		guide.faq.length > 0
			? jsonLd({
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: guide.faq.map((item) => ({
						'@type': 'Question',
						name: item.question,
						acceptedAnswer: { '@type': 'Answer', text: item.answer }
					}))
				})
			: null
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
					name: 'Ratgeber',
					item: 'https://padelindex.de/ratgeber'
				},
				{ '@type': 'ListItem', position: 3, name: guide.title, item: canonical }
			]
		})
	);

	const tocEntries = $derived(guide.sections.map((s) => ({ id: s.id, heading: s.heading })));
</script>

<svelte:head>
	<title>{guide.metaTitle} — PadelIndex</title>
	<meta name="description" content={guide.metaDescription} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content={guide.metaTitle} />
	<meta property="og:description" content={guide.metaDescription} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${articleSchema}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchema}</script>`}
	{#if faqSchema}
		{@html `<script type="application/ld+json">${faqSchema}</script>`}
	{/if}
</svelte:head>

<LandingNav links={MAIN_NAV} />

<main>
	<section class="sec sec-light">
		<div class="wrap narrow">
			<Breadcrumbs
				items={[
					{ label: 'PadelIndex', href: '/' },
					{ label: 'Ratgeber', href: '/ratgeber' },
					{ label: guide.title }
				]}
			/>

			<div class="badges">
				<span class="badge">{CATEGORY_LABELS[guide.category]}</span>
				<span class="badge badge-outline">{DIFFICULTY_LABELS[guide.difficulty]}</span>
				<span class="meta">{guide.readingTime} Min. Lesezeit</span>
				<span class="meta"
					>Aktualisiert am {new Date(guide.updatedAt).toLocaleDateString('de-DE')}</span
				>
			</div>

			<h1>{guide.title}</h1>
			<p class="intro">{guide.excerpt}</p>
		</div>
	</section>

	<section class="sec sec-light article-sec">
		<div class="wrap narrow article-layout">
			<aside class="toc-col">
				<TableOfContents entries={tocEntries} />
			</aside>

			<article>
				{#each guide.sections as section (section.id)}
					<section id={section.id} class="content-section">
						<h2>{section.heading}</h2>
						{#each section.paragraphs ?? [] as paragraph (paragraph)}
							<p>{paragraph}</p>
						{/each}
						{#if section.box}
							<GuideBox box={section.box} />
						{/if}
					</section>
				{/each}

				<GuideCTA
					heading="Bereit, dein Wissen zu testen?"
					text="Im PadelIndex-Quiz merkst du sofort, wie sicher du dich mit Regeln, Technik und Taktik fühlst."
					primaryHref="/quiz"
					primaryLabel="Zum Padel-Quiz"
					secondaryHref="/level-schaetzen"
					secondaryLabel="Mein Level schätzen"
				/>

				{#if guide.faq.length > 0}
					<section class="content-section">
						<h2>Häufige Fragen</h2>
						<FAQAccordion items={guide.faq} />
					</section>
				{/if}

				<RelatedGuides guides={data.related} />
			</article>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	main {
		background: var(--chalk);
	}

	.narrow {
		max-width: 880px;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}

	.badge {
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 4px 12px;
		border-radius: 100px;
		background: rgba(12, 110, 100, 0.1);
		color: var(--court-deep);
	}

	.badge-outline {
		background: transparent;
		border: 1px solid var(--line-light);
		color: var(--muted-light);
	}

	.meta {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--muted-light);
	}

	h1 {
		font-size: clamp(28px, 4vw, 40px);
		margin: 0 0 14px;
	}

	.intro {
		font-size: 16.5px;
		line-height: 1.65;
		color: var(--muted-light);
		max-width: 680px;
	}

	.article-sec {
		padding-top: 0;
	}

	.article-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 32px;
		align-items: start;
	}

	.toc-col {
		order: -1;
	}

	.content-section {
		margin-bottom: 34px;
	}

	.content-section h2 {
		font-size: 21px;
		margin: 0 0 14px;
		scroll-margin-top: 20px;
	}

	.content-section p {
		font-size: 15px;
		line-height: 1.7;
		color: var(--ink);
		margin: 0 0 12px;
	}

	@media (min-width: 960px) {
		.article-layout {
			grid-template-columns: 220px 1fr;
		}

		.toc-col {
			order: 0;
		}
	}
</style>
