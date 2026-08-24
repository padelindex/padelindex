<script lang="ts">
	// ============================================================
	// PadelIndex — /rating
	// ============================================================
	// Bis Block 4 des Website-Audits waren Simulator, Sicherheit,
	// Verlauf und Vergleich Anker-Abschnitte auf der Startseite — Google
	// konnte sie nicht getrennt von "PadelIndex — Dein Level" ranken.
	// Der komplette Inhalt ist hierher VERSCHOBEN, nicht kopiert: auf der
	// Startseite steht dafür nur noch ein kurzer Teaser mit Link hierher.

	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import MatchLab from '$lib/components/landing/MatchLab.svelte';
	import ConfidenceCurve from '$lib/components/landing/ConfidenceCurve.svelte';
	import RatingJourney from '$lib/components/landing/RatingJourney.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { mainNav, ctaHref } from '$lib/landing/nav';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));
	const cta = $derived(ctaHref(page.data.loggedIn));
</script>

<svelte:head>
	<title>{m.rating_meta_title()}</title>
	<meta name="description" content={m.rating_meta_description()} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.rating_og_title()} />
	<meta property="og:description" content={m.rating_og_description()} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<!-- ============================ INTRO ============================ -->
	<section class="sec" id="top" style="background:var(--night-2)">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.rating_eyebrow()}</span>
				<h1 use:reveal={{ delay: 0.05 }}>{m.rating_h1()}</h1>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.rating_intro_p()}
				</p>
			</div>

			<div use:reveal>
				<MatchLab />
			</div>

			<div class="factors">
				<article class="factor" use:reveal>
					<span class="k">{m.rating_factor1_k()}</span>
					<h2>{m.rating_factor1_h2()}</h2>
					<p>
						{m.rating_factor1_p()}
					</p>
				</article>
				<article class="factor" use:reveal={{ delay: 0.07 }}>
					<span class="k">{m.rating_factor2_k()}</span>
					<h2>{m.rating_factor2_h2()}</h2>
					<p>
						{m.rating_factor2_p()}
					</p>
				</article>
				<article class="factor" use:reveal={{ delay: 0.14 }}>
					<span class="k">{m.rating_factor3_k()}</span>
					<h2>{m.rating_factor3_h2()}</h2>
					<p>
						{m.rating_factor3_p()}
					</p>
				</article>
			</div>

			<p class="rechnen-cta" use:reveal={{ delay: 0.18 }}>
				{m.rating_cta1_pre()}
				<a href={cta}>{m.rating_cta1_link()}</a>
			</p>
			<p class="rechnen-cta" use:reveal={{ delay: 0.22 }}>
				{m.rating_cta2_pre()}
				<a href={localizeHref('/level-schaetzen')}>{m.rating_cta2_link()}</a>
			</p>
		</div>
	</section>

	<!-- ============================ SICHERHEIT ============================ -->
	<section class="sec sec-light" id="sicherheit">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.rating_sicherheit_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.rating_sicherheit_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.rating_sicherheit_p()}
				</p>
			</div>

			<div use:reveal>
				<ConfidenceCurve />
			</div>
		</div>
	</section>

	<!-- ============================ VERLAUF ============================ -->
	<section class="sec" id="verlauf">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.rating_verlauf_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.rating_verlauf_h2()}</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{m.rating_verlauf_p()}
				</p>
			</div>

			<div use:reveal>
				<RatingJourney />
			</div>
		</div>
	</section>

	<!-- ============================ VERGLEICH ============================ -->
	<section class="sec sec-light-alt" id="vergleich">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.rating_vergleich_eyebrow()}</span>
				<h2 use:reveal={{ delay: 0.05 }}>{m.rating_vergleich_h2()}</h2>
			</div>

			<table class="cmp" use:reveal>
				<thead>
					<tr>
						<th>{m.rating_cmp_th_merkmal()}</th>
						<th>PadelIndex</th>
						<th>{m.rating_cmp_th_other()}</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>{m.rating_cmp_row1_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row1_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row1_no()}</td>
					</tr>
					<tr>
						<th>{m.rating_cmp_row2_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row2_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row2_no()}</td>
					</tr>
					<tr>
						<th>{m.rating_cmp_row3_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row3_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row3_no()}</td>
					</tr>
					<tr>
						<th>{m.rating_cmp_row4_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row4_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row4_no()}</td>
					</tr>
					<tr>
						<th>{m.rating_cmp_row5_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row5_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row5_no()}</td>
					</tr>
					<tr>
						<th>{m.rating_cmp_row6_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row6_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row6_no()}</td>
					</tr>
					<tr>
						<th>{m.rating_cmp_row7_th()}</th>
						<td data-l="PadelIndex" class="yes">{m.rating_cmp_row7_yes()}</td>
						<td data-l={m.rating_cmp_ueblich()} class="no">{m.rating_cmp_row7_no()}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</main>

<LandingFooter />
