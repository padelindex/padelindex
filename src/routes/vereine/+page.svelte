<script lang="ts">
	// ============================================================
	// PadelIndex — /vereine
	// ============================================================
	// Bis Block 4 des Website-Audits war das der #vereine-Anker auf der
	// Startseite. Inhalt hierher VERSCHOBEN, nicht kopiert — auf "/"
	// steht dafür nur ein kurzer Teaser mit Link hierher.

	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import ClubShowcase from '$lib/components/landing/ClubShowcase.svelte';
	import ClubDemoForm from '$lib/components/landing/ClubDemoForm.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import type { PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	let { data }: { data: PageData } = $props();

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));
</script>

<svelte:head>
	<title>{m.vereine_meta_title()}</title>
	<meta name="description" content={m.vereine_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.vereine_og_title()} />
	<meta property="og:description" content={m.vereine_og_description()} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<!-- ============================ VEREINE ============================ -->
	<section class="sec sec-light" id="top">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_vereine_eyebrow()}</span>
				<h1 use:reveal={{ delay: 0.05 }}>{m.home_vereine_h2()}</h1>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.vereine_intro_p()}
				</p>
			</div>

			<div use:reveal>
				<ClubShowcase board={data.board} />
			</div>

			{#if data.trialOfferEnabled}
				<p class="trial-banner" use:reveal>
					{m.vereine_trial_banner()}
				</p>
			{/if}

			<div class="tiers">
				<div class="tier" use:reveal>
					<span class="lvl">{m.vereine_tier_free_badge()}</span>
					<h2>{m.vereine_tier_free_h2()}</h2>
					<ul>
						<li>{m.vereine_tier_free_li1()}</li>
						<li>{m.vereine_tier_free_li2()}</li>
						<li>{m.vereine_tier_free_li3()}</li>
					</ul>
				</div>
				<div class="tier hl" use:reveal={{ delay: 0.06 }}>
					<span class="lvl">{m.vereine_tier_basic_badge()}</span>
					<h2>{m.vereine_tier_basic_h2()}</h2>
					<ul>
						<li>{m.vereine_tier_basic_li1()}</li>
						<li>{m.vereine_tier_basic_li2()}</li>
						<li>{m.vereine_tier_basic_li3()}</li>
						<li>{m.vereine_tier_basic_li4()}</li>
					</ul>
				</div>
				<div class="tier" use:reveal={{ delay: 0.12 }}>
					<span class="lvl">{m.vereine_tier_pro_badge()}</span>
					<h2>{m.vereine_tier_pro_h2()}</h2>
					<ul>
						<li>{m.vereine_tier_pro_li1()}</li>
						<li>{m.vereine_tier_pro_li2()}</li>
						<li>{m.vereine_tier_pro_li3()}</li>
						<li>{m.vereine_tier_pro_li4()}</li>
					</ul>
				</div>
			</div>

			<!-- id="demo": Sprungziel für "Interesse anmelden" von /karte. -->
			<div class="demo-block" id="demo" use:reveal>
				<h2>{m.vereine_demo_h2()}</h2>
				<p class="muted">{m.vereine_demo_p()}</p>
				<ClubDemoForm />
			</div>

			<p class="claim-cta">
				{m.vereine_claim_cta_pre()}
				<a href={localizeHref('/#anmelden')}>{m.vereine_claim_cta_link()}</a>
			</p>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.claim-cta {
		margin-top: 32px;
		text-align: center;
		font-size: 13px;
		color: var(--muted-light);
	}
	.claim-cta a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
	}
	.claim-cta a:hover {
		text-decoration: underline;
	}
</style>
