<script lang="ts">
	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { mainNav } from '$lib/landing/nav';
	import { ogLocaleFor } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
</script>

<svelte:head>
	<title>{m.ueber_meta_title()}</title>
	<meta name="description" content={m.ueber_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.ueber_og_title()} />
	<meta property="og:description" content={m.ueber_og_description()} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec" id="top" style="background:var(--night-2)">
		<div class="wrap legal-wide">
			<span class="eyebrow" use:reveal>{m.ueber_eyebrow()}</span>
			<h1 use:reveal={{ delay: 0.05 }}>{m.ueber_h1()}</h1>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				{m.ueber_intro_p1()}
			</p>
			<p class="muted" use:reveal={{ delay: 0.14 }}>
				{m.ueber_intro_p2()}
			</p>
		</div>
	</section>

	<section class="sec sec-light">
		<div class="wrap legal-wide">
			<h2 use:reveal>{m.ueber_praxis_h2()}</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }}>
				{m.ueber_praxis_p1()}
			</p>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				{m.ueber_praxis_p2()}
			</p>
			<p class="muted" use:reveal={{ delay: 0.15 }}>
				{m.ueber_praxis_p3()}
			</p>
		</div>
	</section>

	<section class="sec">
		<div class="wrap legal-wide">
			<h2 use:reveal>{m.ueber_anspruch_h2()}</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }}>
				{m.ueber_anspruch_p1()}
			</p>
			<p class="claim-line" use:reveal={{ delay: 0.08 }}>
				{m.ueber_claim_line1()}
			</p>
			<ul class="values" use:reveal={{ delay: 0.12 }}>
				<li>
					<b>{m.ueber_value_nachvollziehbarkeit_b()}</b> — {m.ueber_value_nachvollziehbarkeit_t()}
				</li>
				<li><b>{m.ueber_value_bestaetigung_b()}</b> — {m.ueber_value_bestaetigung_t()}</li>
				<li><b>{m.ueber_value_transparenz_b()}</b> — {m.ueber_value_transparenz_t()}</li>
				<li><b>{m.ueber_value_community_b()}</b> — {m.ueber_value_community_t()}</li>
				<li><b>{m.ueber_value_wachstum_b()}</b> — {m.ueber_value_wachstum_t()}</li>
			</ul>
		</div>
	</section>

	<section class="sec sec-light">
		<div class="wrap legal-wide">
			<h2 use:reveal>{m.ueber_gemeinsam_h2()}</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }}>
				{m.ueber_gemeinsam_p1()}
			</p>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				{m.ueber_gemeinsam_p2()}
			</p>
			<p class="muted" use:reveal={{ delay: 0.14 }}>
				{m.ueber_gemeinsam_p3_pre()}
				<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>.
			</p>
			<p class="claim-line" use:reveal={{ delay: 0.18 }}>
				{m.ueber_claim_line2()}
			</p>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.legal-wide {
		max-width: 68ch;
	}
	.legal-wide h1 {
		margin-top: 18px;
	}
	.legal-wide h2 {
		font-size: clamp(26px, 3.4vw, 38px);
		margin-bottom: 18px;
	}
	.legal-wide .muted {
		margin-top: 14px;
		font-size: 15px;
		line-height: 1.65;
	}
	.legal-wide .muted:first-of-type {
		margin-top: 0;
	}
	.claim-line {
		margin-top: 22px;
		font-family: var(--mono);
		font-size: 13px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--court-deep, #0f6e5c);
	}
	.sec:not(.sec-light) .claim-line {
		color: var(--court);
	}
	.values {
		margin: 22px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 15px;
		color: var(--muted-light);
	}
	.sec:not(.sec-light) .values {
		color: var(--muted-dark);
	}
	.values b {
		color: var(--ink);
	}
	.sec:not(.sec-light) .values b {
		color: var(--chalk);
	}
</style>
