<script lang="ts">
	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import HeroSequence from '$lib/components/landing/HeroSequence.svelte';
	import PartnerProblem from '$lib/components/landing/PartnerProblem.svelte';
	import TokenFlow from '$lib/components/landing/TokenFlow.svelte';
	import SignupForm from '$lib/components/landing/SignupForm.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { ogLocaleFor } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const NAV = $derived([
		{ href: '#problem', label: m.nav_warum() },
		{ href: localizeHref('/rating'), label: m.nav_rating() },
		{ href: '#tokens', label: m.nav_tokens() },
		{ href: localizeHref('/vereine'), label: m.nav_fuer_vereine() }
	]);

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
</script>

<svelte:head>
	<title>{m.home_meta_title()}</title>
	<meta name="description" content={m.home_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.home_meta_title()} />
	<meta property="og:description" content={m.home_og_description()} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<!-- ============================ NAV ============================ -->
<LandingNav links={NAV} brandHref="#top" />

<main>
	<!-- ============================ HERO ============================ -->
	<header class="hero" id="top">
		<div class="mullions" aria-hidden="true">
			<i style="left:12%"></i><i style="left:31%"></i><i style="left:50%"></i>
			<i style="left:69%"></i><i style="left:88%"></i>
		</div>
		<div class="wrap hero-in">
			<div>
				<span class="eyebrow" use:reveal>{m.home_hero_eyebrow()}</span>
				<h1 use:reveal={{ delay: 0.06 }}>
					{m.home_hero_h1_line1()}<br /><em>{m.home_hero_h1_emphasis()}</em><br
					/>{m.home_hero_h1_line2()}
				</h1>
				<p class="hero-sub" use:reveal={{ delay: 0.12 }}>
					{m.home_hero_sub()}
				</p>
				<div class="hero-cta" use:reveal={{ delay: 0.18 }}>
					<a class="btn btn-primary" href="#anmelden">{m.home_hero_cta_primary()}</a>
					<a class="btn btn-ghost" href={localizeHref('/rating')}>{m.home_hero_cta_secondary()}</a>
				</div>
				<p class="hero-note" use:reveal={{ delay: 0.24 }}>{m.home_hero_note()}</p>
			</div>

			<div use:reveal={{ delay: 0.1 }}>
				<HeroSequence />
			</div>
		</div>
	</header>

	<!-- ============================ PROBLEM ============================ -->
	<section class="sec" id="problem" style="background:var(--night-2)">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_problem_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.home_problem_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.home_problem_p()}
				</p>
			</div>

			<div use:reveal>
				<PartnerProblem />
			</div>

			<div class="gripes">
				<article class="gripe" use:reveal>
					<span class="tag">{m.home_gripe1_tag()}</span>
					<p class="q">{m.home_gripe1_q()}</p>
					<p class="a">
						{m.home_gripe1_a()}
					</p>
				</article>
				<article class="gripe" use:reveal={{ delay: 0.07 }}>
					<span class="tag">{m.home_gripe2_tag()}</span>
					<p class="q">{m.home_gripe2_q()}</p>
					<p class="a">
						{m.home_gripe2_a()}
					</p>
				</article>
				<article class="gripe" use:reveal={{ delay: 0.14 }}>
					<span class="tag">{m.home_gripe3_tag()}</span>
					<p class="q">{m.home_gripe3_q()}</p>
					<p class="a">
						{m.home_gripe3_a()}
					</p>
				</article>
			</div>
		</div>
	</section>

	<!-- ============================ RATING TEASER ============================ -->
	<section class="sec sec-light" id="rechnen">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_rating_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.home_rating_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.home_rating_p()}
				</p>
				<a
					class="btn btn-primary"
					href={localizeHref('/rating')}
					use:reveal={{ delay: 0.15 }}
					style="margin-top:28px; display:inline-flex"
				>
					{m.home_rating_cta()}
				</a>
			</div>
		</div>
	</section>

	<!-- ============================ TOKENS ============================ -->
	<section class="sec" id="tokens">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_tokens_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.home_tokens_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.home_tokens_p()}
				</p>
			</div>

			<div use:reveal>
				<TokenFlow />
			</div>
		</div>
	</section>

	<!-- ============================ VEREINE TEASER ============================ -->
	<section class="sec sec-light" id="vereine">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_vereine_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.home_vereine_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.home_vereine_p_pre()}
					<a href="#anmelden">{m.home_vereine_link()}</a>
					{m.home_vereine_p_post()}
				</p>
				<a
					class="btn btn-primary"
					href={localizeHref('/vereine')}
					use:reveal={{ delay: 0.15 }}
					style="margin-top:28px; display:inline-flex"
				>
					{m.home_vereine_cta()}
				</a>
			</div>
		</div>
	</section>

	<!-- ============================ LIGA TEASER ============================ -->
	<!-- Bewusst als konkretes Beispiel, nicht als "PadelIndex bietet jetzt
	     Liga-Hosting als Produkt für jeden Verein" — das Box-Ligen-Format ist
	     technisch generisch gebaut, aber aktuell gibt es genau eine Liga bei
	     einem Verein. Ehrlich als Pilot framen statt Verfügbarkeit zu
	     behaupten, die es noch nicht gibt. -->
	<section class="sec" id="liga">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_liga_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.home_liga_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.home_liga_p()}
				</p>
				<a
					class="btn btn-primary"
					href={localizeHref('/liga/bavaro')}
					use:reveal={{ delay: 0.15 }}
					style="margin-top:28px; display:inline-flex"
				>
					{m.home_liga_cta()}
				</a>
			</div>
		</div>
	</section>

	<!-- ============================ RATGEBER & QUIZ ============================ -->
	<section class="sec sec-light" id="ratgeber">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.home_ratgeber_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>
					{m.home_ratgeber_h2()}
				</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.home_ratgeber_p()}
				</p>
				<div class="hero-cta" use:reveal={{ delay: 0.15 }} style="margin-top:28px">
					<a class="btn btn-primary" href={localizeHref('/ratgeber')}
						>{m.home_ratgeber_cta_primary()}</a
					>
					<a class="btn btn-ghost-light" href={localizeHref('/quiz')}
						>{m.home_ratgeber_cta_secondary()}</a
					>
				</div>
			</div>
		</div>
	</section>

	<!-- ============================ CTA ============================ -->
	<section class="cta" id="anmelden">
		<div class="mullions" aria-hidden="true">
			<i style="left:20%"></i><i style="left:40%"></i><i style="left:60%"></i><i style="left:80%"
			></i>
		</div>
		<div class="wrap cta-in">
			<span class="eyebrow" use:reveal>{m.home_cta_eyebrow()}</span>
			<h2 use:reveal={{ delay: 0.05 }}>
				{m.home_cta_h2_line1()}<br />{m.home_cta_h2_line2()}
			</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }} style="margin-top:22px">
				{m.home_cta_p()}
			</p>

			<div use:reveal={{ delay: 0.15 }}>
				<SignupForm />
			</div>

			{#if data.board}
				<p class="cta-alt" use:reveal={{ delay: 0.2 }}>
					{m.home_cta_alt_question({ clubName: data.board.club.name })}
					<a href="/c/stc-oberland/beanspruchen">{m.home_cta_alt_claim()}</a>
					·
					<a href={localizeHref('/c/stc-oberland')}>{m.home_cta_alt_ranking()}</a>
				</p>
			{/if}
		</div>
	</section>
</main>

<LandingFooter />
