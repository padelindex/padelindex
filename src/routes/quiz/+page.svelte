<script lang="ts">
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import DifficultyCard from '$lib/components/quiz/DifficultyCard.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { page } from '$app/state';
	import { mainNav } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import { difficultiesFor, questionsFor } from '$lib/quiz-data';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));
	const difficulties = $derived(difficultiesFor(getLocale()));

	const breadcrumbSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' },
				{
					'@type': 'ListItem',
					position: 2,
					name: m.quiz_breadcrumb_name(),
					item: 'https://padelindex.de/quiz'
				}
			]
		})
	);
</script>

<svelte:head>
	<title>{m.quiz_meta_title()}</title>
	<meta name="description" content={m.quiz_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.quiz_og_title()} />
	<meta property="og:description" content={m.quiz_og_description()} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${breadcrumbSchema}</script>`}
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light">
		<div class="wrap">
			<div class="hero">
				<span class="eyebrow">{m.quiz_eyebrow()}</span>
				<h1>{m.quiz_headline()}</h1>
				<p class="sub">
					{m.quiz_sub()}
				</p>
			</div>

			<div class="grid">
				{#each difficulties as difficulty (difficulty.slug)}
					<DifficultyCard
						{difficulty}
						questionCount={questionsFor(getLocale(), difficulty.slug).length}
					/>
				{/each}
			</div>

			<p class="footnote">
				{m.quiz_footnote_pre()}
				<a href={localizeHref('/ratgeber')}>{m.quiz_footnote_ratgeber_link()}</a
				>{m.quiz_footnote_mid()}
				<a href="/level-schaetzen">{m.quiz_footnote_level_link()}</a>
				{m.quiz_footnote_post()}
			</p>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	main {
		background: var(--chalk);
	}

	.hero {
		max-width: 640px;
		margin: 0 auto 44px;
		text-align: center;
	}

	h1 {
		margin: 10px 0 16px;
		font-size: clamp(30px, 4.2vw, 42px);
	}

	.sub {
		margin: 0;
		font-size: 16px;
		line-height: 1.6;
		color: var(--muted-light);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 18px;
		max-width: 880px;
		margin: 0 auto;
	}

	.footnote {
		max-width: 640px;
		margin: 36px auto 0;
		text-align: center;
		font-size: 13.5px;
		color: var(--muted-light);
	}

	.footnote a {
		color: var(--court-deep);
		font-weight: 600;
	}
</style>
