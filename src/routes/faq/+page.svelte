<script lang="ts">
	// ============================================================
	// PadelIndex — /faq
	// ============================================================
	// Kategorisierte FAQ statt einer einzelnen langen Liste (Website-Audit:
	// FAQ-Überarbeitung). Fragen/Antworten kommen aus Paraglide-Messages
	// (faq_<kategorie>_q{n}/a{n}), Antworten dürfen eine schmale
	// Markdown-Linksyntax [Text](/pfad) enthalten — parseFaqAnswer()
	// macht daraus echte <a>-Links für die Anzeige und reinen Text fürs
	// FAQPage-JSON-LD (Schema.org erwartet dort Klartext ohne Markup).
	//
	// Die Suche filtert client-seitig über Frage + Klartext-Antwort,
	// Umlaut-tolerant über dieselbe normalizeForSearch() wie /karte.
	// Das JSON-LD bildet immer ALLE Fragen ab, unabhängig vom aktuellen
	// Suchfilter — die Suche ist eine reine Anzeigehilfe.

	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import { jsonLd } from '$lib/jsonld';
	import { mainNav } from '$lib/landing/nav';
	import { normalizeForSearch } from '$lib/venues';
	import { parseFaqAnswer } from '$lib/faq';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	type FaqItem = { id: string; q: string; html: string; plain: string };
	type FaqCategory = { id: string; title: string; items: FaqItem[] };

	function cat(id: string, title: string, entries: [() => string, () => string][]): FaqCategory {
		return {
			id,
			title,
			items: entries.map(([qFn, aFn], i) => {
				const { html, plain } = parseFaqAnswer(aFn(), localizeHref);
				return { id: `${id}-${i + 1}`, q: qFn(), html, plain };
			})
		};
	}

	const categories = $derived([
		cat('ue', m.faq_cat_ueber(), [
			[m.faq_ue_q1, m.faq_ue_a1],
			[m.faq_ue_q2, m.faq_ue_a2],
			[m.faq_ue_q3, m.faq_ue_a3],
			[m.faq_ue_q4, m.faq_ue_a4],
			[m.faq_ue_q5, m.faq_ue_a5],
			[m.faq_ue_q6, m.faq_ue_a6]
		]),
		cat('pr', m.faq_cat_profil(), [
			[m.faq_pr_q1, m.faq_pr_a1],
			[m.faq_pr_q2, m.faq_pr_a2],
			[m.faq_pr_q3, m.faq_pr_a3],
			[m.faq_pr_q4, m.faq_pr_a4],
			[m.faq_pr_q5, m.faq_pr_a5],
			[m.faq_pr_q6, m.faq_pr_a6],
			[m.faq_pr_q7, m.faq_pr_a7]
		]),
		cat('ra', m.faq_cat_rating(), [
			[m.faq_ra_q1, m.faq_ra_a1],
			[m.faq_ra_q2, m.faq_ra_a2],
			[m.faq_ra_q3, m.faq_ra_a3],
			[m.faq_ra_q4, m.faq_ra_a4],
			[m.faq_ra_q5, m.faq_ra_a5],
			[m.faq_ra_q6, m.faq_ra_a6]
		]),
		cat('ma', m.faq_cat_matches(), [
			[m.faq_ma_q1, m.faq_ma_a1],
			[m.faq_ma_q2, m.faq_ma_a2],
			[m.faq_ma_q3, m.faq_ma_a3],
			[m.faq_ma_q4, m.faq_ma_a4],
			[m.faq_ma_q5, m.faq_ma_a5]
		]),
		cat('mi', m.faq_cat_mitspieler(), [
			[m.faq_mi_q1, m.faq_mi_a1],
			[m.faq_mi_q2, m.faq_mi_a2],
			[m.faq_mi_q3, m.faq_mi_a3],
			[m.faq_mi_q4, m.faq_mi_a4]
		]),
		cat('ve', m.faq_cat_vereine(), [
			[m.faq_ve_q1, m.faq_ve_a1],
			[m.faq_ve_q2, m.faq_ve_a2],
			[m.faq_ve_q3, m.faq_ve_a3],
			[m.faq_ve_q4, m.faq_ve_a4],
			[m.faq_ve_q5, m.faq_ve_a5]
		]),
		cat('rl', m.faq_cat_rangliste(), [
			[m.faq_rl_q1, m.faq_rl_a1],
			[m.faq_rl_q2, m.faq_rl_a2],
			[m.faq_rl_q3, m.faq_rl_a3],
			[m.faq_rl_q4, m.faq_rl_a4],
			[m.faq_rl_q5, m.faq_rl_a5]
		]),
		cat('ka', m.faq_cat_karte(), [
			[m.faq_ka_q1, m.faq_ka_a1],
			[m.faq_ka_q2, m.faq_ka_a2],
			[m.faq_ka_q3, m.faq_ka_a3]
		]),
		cat('to', m.faq_cat_tokens(), [
			[m.faq_to_q1, m.faq_to_a1],
			[m.faq_to_q2, m.faq_to_a2],
			[m.faq_to_q3, m.faq_to_a3]
		]),
		cat('pi', m.faq_cat_pilot(), [
			[m.faq_pi_q1, m.faq_pi_a1],
			[m.faq_pi_q2, m.faq_pi_a2],
			[m.faq_pi_q3, m.faq_pi_a3],
			[m.faq_pi_q4, m.faq_pi_a4]
		]),
		cat('da', m.faq_cat_datenschutz(), [
			[m.faq_da_q1, m.faq_da_a1],
			[m.faq_da_q2, m.faq_da_a2],
			[m.faq_da_q3, m.faq_da_a3],
			[m.faq_da_q4, m.faq_da_a4]
		]),
		cat('ko', m.faq_cat_kosten(), [
			[m.faq_ko_q1, m.faq_ko_a1],
			[m.faq_ko_q2, m.faq_ko_a2],
			[m.faq_ko_q3, m.faq_ko_a3],
			[m.faq_ko_q4, m.faq_ko_a4]
		]),
		cat('hi', m.faq_cat_hilfe(), [
			[m.faq_hi_q1, m.faq_hi_a1],
			[m.faq_hi_q2, m.faq_hi_a2],
			[m.faq_hi_q3, m.faq_hi_a3]
		])
	]);

	// Handverlesene Einstiegsfragen für die "Häufig gefragt"-Zeile — feste
	// IDs statt hartcodierter Kopien, damit sie mit den Kategorien oben in
	// derselben Quelle bleiben.
	const POPULAR_IDS = ['ue-1', 'ra-1', 'pr-1', 've-1', 'ko-1', 'da-3'];
	const popularItems = $derived.by(() => {
		const flat = categories.flatMap((c) => c.items);
		return POPULAR_IDS.map((id) => flat.find((i) => i.id === id)).filter(
			(i): i is FaqItem => i !== undefined
		);
	});

	let query = $state('');
	const normalizedQuery = $derived(normalizeForSearch(query));
	const isSearching = $derived(normalizedQuery !== '');

	const filteredCategories = $derived.by(() => {
		if (!isSearching) return categories;
		return categories
			.map((c) => ({
				...c,
				items: c.items.filter((item) =>
					normalizeForSearch(`${item.q} ${item.plain}`).includes(normalizedQuery)
				)
			}))
			.filter((c) => c.items.length > 0);
	});
	const totalResults = $derived(filteredCategories.reduce((sum, c) => sum + c.items.length, 0));

	const faqSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: categories
				.flatMap((c) => c.items)
				.map((item) => ({
					'@type': 'Question',
					name: item.q,
					acceptedAnswer: { '@type': 'Answer', text: item.plain }
				}))
		})
	);

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));

	// Direktlink auf eine einzelne Antwort (#pr-3): öffnet das passende
	// <details> und scrollt hin. Rein imperativ statt über eine
	// Svelte-Bindung auf `open` — sonst konkurriert das mit dem nativen
	// Auf-/Zuklappen per Klick, das dieselbe Property setzt.
	function openFromHash(hash: string) {
		const id = hash.replace('#', '');
		if (!id) return;
		const el = document.getElementById(id);
		if (!(el instanceof HTMLDetailsElement)) return;
		el.open = true;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	onMount(() => {
		if (window.location.hash) openFromHash(window.location.hash);
		const handler = () => openFromHash(window.location.hash);
		window.addEventListener('hashchange', handler);
		return () => window.removeEventListener('hashchange', handler);
	});
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
		<div class="wrap" style="max-width: 74ch">
			<span class="eyebrow" use:reveal>{m.faq_eyebrow()}</span>
			<h1 use:reveal={{ delay: 0.05 }}>{m.faq_h1()}</h1>
			<p class="muted faq-intro" use:reveal={{ delay: 0.1 }}>
				{m.faq_intro_pre()}
				<a href="mailto:kontakt@padelindex.de">{m.faq_intro_link()}</a>.
			</p>

			<div class="faq-search" use:reveal={{ delay: 0.12 }}>
				<label class="sr-only" for="faq-search-input">{m.faq_search_label()}</label>
				<input
					id="faq-search-input"
					type="search"
					placeholder={m.faq_search_placeholder()}
					bind:value={query}
					autocomplete="off"
				/>
			</div>

			{#if isSearching}
				<p class="faq-result-count" role="status" aria-live="polite">
					{totalResults}
					{totalResults === 1 ? m.faq_result_singular() : m.faq_result_plural()}
				</p>
			{/if}

			{#if !isSearching}
				<div class="faq-popular" use:reveal={{ delay: 0.14 }}>
					<span class="faq-popular-label">{m.faq_popular_label()}</span>
					<div class="faq-chip-row">
						{#each popularItems as item (item.id)}
							<a class="faq-chip" href="#{item.id}">{item.q}</a>
						{/each}
					</div>
				</div>

				<nav class="faq-catnav" use:reveal={{ delay: 0.16 }} aria-label={m.faq_categories_aria()}>
					<span class="faq-popular-label">{m.faq_jump_label()}</span>
					<div class="faq-chip-row">
						{#each categories as c (c.id)}
							<a class="faq-chip faq-chip-cat" href="#cat-{c.id}">{c.title}</a>
						{/each}
					</div>
				</nav>
			{/if}

			{#if isSearching && filteredCategories.length === 0}
				<p class="faq-empty">{m.faq_search_empty()}</p>
			{/if}

			<div class="faq-categories">
				{#each filteredCategories as category, ci (category.id)}
					<section class="faq-category" use:reveal={{ delay: Math.min(ci, 4) * 0.03 }}>
						<h2 id="cat-{category.id}">{category.title}</h2>
						<div class="faq-list">
							{#each category.items as item (item.id)}
								<details class="faq-item" id={item.id}>
									<summary><h3>{item.q}</h3></summary>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									<p>{@html item.html}</p>
								</details>
							{/each}
						</div>
					</section>
				{/each}
			</div>

			{#if filteredCategories.length > 0}
				<p class="faq-back-top"><a href="#top">{m.faq_back_to_top()}</a></p>
			{/if}
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
		font-size: 15px;
	}
	.faq-intro a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}

	.faq-search {
		margin-top: 32px;
		max-width: 420px;
	}
	.faq-search input {
		width: 100%;
		box-sizing: border-box;
		padding: 12px 18px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		color: var(--ink);
		font-family: var(--body);
		font-size: 14.5px;
	}
	.faq-search input::placeholder {
		color: var(--muted-light);
	}
	.faq-search input:focus-visible {
		outline: 2px solid var(--court-deep, #0f6e5c);
		outline-offset: 2px;
	}

	.faq-result-count {
		margin-top: 14px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.05em;
		color: var(--muted-light);
	}

	.faq-empty {
		margin-top: 28px;
		color: var(--muted-light);
	}

	.faq-popular,
	.faq-catnav {
		margin-top: 28px;
	}
	.faq-catnav {
		padding-top: 22px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.faq-popular-label {
		display: block;
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted-light);
		margin-bottom: 10px;
	}
	.faq-chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.faq-chip {
		display: inline-block;
		padding: 8px 15px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		font-size: 13px;
		font-weight: 600;
		color: var(--muted-light);
		text-decoration: none;
		transition:
			border-color 0.15s,
			color 0.15s;
	}
	.faq-chip:hover,
	.faq-chip:focus-visible {
		border-color: var(--court-deep, #0f6e5c);
		color: var(--court-deep, #0f6e5c);
	}
	.faq-chip-cat {
		font-weight: 500;
	}

	.faq-categories {
		margin-top: 48px;
		display: flex;
		flex-direction: column;
		gap: 44px;
	}
	.faq-category h2 {
		font-size: clamp(20px, 2.4vw, 26px);
		scroll-margin-top: 110px;
	}

	.faq-list {
		margin-top: 18px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.faq-item {
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		padding: 18px 0;
		scroll-margin-top: 110px;
	}
	.faq-item:last-child {
		border-bottom: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.faq-item summary {
		cursor: pointer;
		list-style: none;
		display: flex;
		align-items: baseline;
		gap: 10px;
	}
	.faq-item summary::-webkit-details-marker {
		display: none;
	}
	.faq-item summary::before {
		content: '+';
		display: inline-block;
		width: 1.2em;
		flex-shrink: 0;
		color: var(--court-deep, #0f6e5c);
		font-weight: 700;
	}
	.faq-item[open] summary::before {
		content: '−';
	}
	.faq-item summary h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		line-height: 1.4;
	}
	.faq-item p {
		margin: 12px 0 0 1.7em;
		font-size: 15px;
		line-height: 1.65;
		color: var(--muted-light);
	}
	.faq-item p :global(a) {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.faq-back-top {
		margin-top: 32px;
		text-align: center;
		font-size: 13px;
	}
	.faq-back-top a {
		color: var(--muted-light);
		text-decoration: underline;
	}
</style>
