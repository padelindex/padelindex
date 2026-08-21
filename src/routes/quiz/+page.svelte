<script lang="ts">
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import DifficultyCard from '$lib/components/quiz/DifficultyCard.svelte';
	import { MAIN_NAV } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import { QUIZ_DIFFICULTIES, questionsFor } from '$lib/quiz-data';

	const breadcrumbSchema = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' },
			{ '@type': 'ListItem', position: 2, name: 'Quiz', item: 'https://padelindex.de/quiz' }
		]
	});
</script>

<svelte:head>
	<title>Padel Quiz: Teste dein Wissen zu Regeln, Technik und Taktik — PadelIndex</title>
	<meta
		name="description"
		content="Teste dein Padel-Wissen im interaktiven Quiz mit drei Schwierigkeitsgraden: Anfänger, Fortgeschritten und Experte."
	/>
	<link rel="canonical" href="https://padelindex.de/quiz" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/quiz" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="Padel Quiz: Teste dein Wissen zu Regeln, Technik und Taktik" />
	<meta
		property="og:description"
		content="Drei Schwierigkeitsgrade, je zehn Fragen: Teste dein Padel-Wissen und finde heraus, wo du noch dazulernen kannst."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${breadcrumbSchema}</script>`}
</svelte:head>

<LandingNav links={MAIN_NAV} />

<main>
	<section class="sec sec-light">
		<div class="wrap">
			<div class="hero">
				<span class="eyebrow">PadelIndex Quiz</span>
				<h1>Teste dein Padel-Wissen</h1>
				<p class="sub">
					Drei Schwierigkeitsgrade, je zehn Fragen mit Erklärung. Finde heraus, wie sicher du dich
					mit Regeln, Technik und Taktik fühlst — und wo sich ein Blick in den Ratgeber lohnt.
				</p>
			</div>

			<div class="grid">
				{#each QUIZ_DIFFICULTIES as difficulty (difficulty.slug)}
					<DifficultyCard {difficulty} questionCount={questionsFor(difficulty.slug).length} />
				{/each}
			</div>

			<p class="footnote">
				Lieber erst die Grundlagen auffrischen? Schau in den <a href="/ratgeber">Ratgeber</a>, oder
				finde mit dem
				<a href="/level-schaetzen">PadelIndex-Level-Test</a> heraus, wo du spielerisch stehst.
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
