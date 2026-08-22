<script lang="ts">
	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { jsonLd } from '$lib/jsonld';
	import { mainNav } from '$lib/landing/nav';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	// Antworten als reiner Text (ohne Markup) für das FAQPage-JSON-LD -
	// die sichtbaren Blöcke unten dürfen Links enthalten, das Schema
	// braucht Klartext.
	const faq = $derived([
		{ q: m.faq_q1(), a: m.faq_a1() },
		{ q: m.faq_q2(), a: m.faq_a2() },
		{ q: m.faq_q3(), a: m.faq_a3() },
		{ q: m.faq_q4(), a: m.faq_a4() },
		{ q: m.faq_q5(), a: m.faq_a5() },
		{ q: m.faq_q6(), a: m.faq_a6() },
		{ q: m.faq_q7(), a: m.faq_a7() },
		{ q: m.faq_q8(), a: m.faq_a8() },
		{ q: m.faq_q9(), a: m.faq_a9() },
		{ q: m.faq_q10(), a: m.faq_a10() },
		{ q: m.faq_q11(), a: m.faq_a11() },
		{ q: m.faq_q12(), a: m.faq_a12() },
		{ q: m.faq_q13(), a: m.faq_a13() }
	]);

	const faqSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: faq.map((item) => ({
				'@type': 'Question',
				name: item.q,
				acceptedAnswer: { '@type': 'Answer', text: item.a }
			}))
		})
	);

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));
</script>

<svelte:head>
	<title>{m.faq_meta_title()}</title>
	<meta name="description" content={m.faq_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.faq_og_title()} />
	<meta property="og:description" content={m.faq_og_description()} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${faqSchema}</script>`}
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 68ch">
			<span class="eyebrow" use:reveal>{m.faq_eyebrow()}</span>
			<h1 use:reveal={{ delay: 0.05 }}>{m.faq_h1()}</h1>
			<p class="muted faq-intro" use:reveal={{ delay: 0.1 }}>
				{m.faq_intro_pre()}
				<a href="mailto:kontakt@padelindex.de">{m.faq_intro_link()}</a>.
			</p>

			<div class="faq-list">
				{#each faq as item, i (item.q)}
					<details class="faq-item" use:reveal={{ delay: Math.min(i, 6) * 0.03 }}>
						<summary>{item.q}</summary>
						<p>{item.a}</p>
					</details>
				{/each}
			</div>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	h1 {
		margin-top: 18px;
	}
	.faq-intro {
		margin-top: 14px;
		margin-bottom: 40px;
	}
	.faq-intro a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.faq-item {
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		padding: 18px 0;
	}
	.faq-item:last-child {
		border-bottom: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.faq-item summary {
		cursor: pointer;
		font-size: 17px;
		font-weight: 600;
		list-style: none;
	}
	.faq-item summary::-webkit-details-marker {
		display: none;
	}
	.faq-item summary::before {
		content: '+';
		display: inline-block;
		width: 1.2em;
		color: var(--court-deep, #0f6e5c);
		font-weight: 700;
	}
	.faq-item[open] summary::before {
		content: '−';
	}
	.faq-item p {
		margin: 12px 0 0 1.2em;
		font-size: 15px;
		line-height: 1.65;
		color: var(--muted-light);
	}
</style>
