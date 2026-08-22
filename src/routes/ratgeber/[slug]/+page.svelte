<script lang="ts">
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import Breadcrumbs from '$lib/components/guides/Breadcrumbs.svelte';
	import TableOfContents from '$lib/components/guides/TableOfContents.svelte';
	import GuideBox from '$lib/components/guides/GuideBox.svelte';
	import RelatedGuides from '$lib/components/guides/RelatedGuides.svelte';
	import GuideCTA from '$lib/components/guides/GuideCTA.svelte';
	import FAQAccordion from '$lib/components/guides/FAQAccordion.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { page } from '$app/state';
	import { mainNav } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import { categoryLabels, difficultyLabels } from '$lib/guides';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { dateLocaleFor } from '$lib/i18n/date';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const guide = $derived(data.guide);
	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));

	const articleSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: guide.title,
			description: guide.metaDescription,
			dateModified: guide.updatedAt,
			datePublished: guide.updatedAt,
			inLanguage: dateLocaleFor(getLocale()),
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
					name: m.guide_breadcrumb_ratgeber(),
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
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={guide.metaTitle} />
	<meta property="og:description" content={guide.metaDescription} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${articleSchema}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchema}</script>`}
	{#if faqSchema}
		{@html `<script type="application/ld+json">${faqSchema}</script>`}
	{/if}
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light">
		<div class="wrap narrow">
			<Breadcrumbs
				items={[
					{ label: m.guide_breadcrumb_home(), href: localizeHref('/') },
					{ label: m.guide_breadcrumb_ratgeber(), href: localizeHref('/ratgeber') },
					{ label: guide.title }
				]}
			/>

			<div class="badges">
				<span class="badge">{categoryLabels()[guide.category]}</span>
				<span class="badge badge-outline">{difficultyLabels()[guide.difficulty]}</span>
				<span class="meta">{m.guide_reading_time({ minutes: guide.readingTime })}</span>
				<span class="meta"
					>{m.guide_updated_on({
						date: new Date(guide.updatedAt).toLocaleDateString(dateLocaleFor(getLocale()))
					})}</span
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
					heading={m.guide_cta_heading()}
					text={m.guide_cta_text()}
					primaryHref={localizeHref('/quiz')}
					primaryLabel={m.guide_cta_primary_label()}
					secondaryHref="/level-schaetzen"
					secondaryLabel={m.guide_cta_secondary_label()}
				/>

				{#if guide.faq.length > 0}
					<section class="content-section">
						<h2>{m.guide_faq_heading()}</h2>
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
