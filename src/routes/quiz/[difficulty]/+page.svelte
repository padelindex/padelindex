<script lang="ts">
	import { goto } from '$app/navigation';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import QuizProgressBar from '$lib/components/quiz/QuizProgressBar.svelte';
	import QuizQuestionCard from '$lib/components/quiz/QuizQuestionCard.svelte';
	import QuizResultScreen from '$lib/components/quiz/QuizResultScreen.svelte';
	import { mainNav } from '$lib/landing/nav';
	import { jsonLd } from '$lib/jsonld';
	import { percentageFor, resultTierFor, shareText, type QuizOptionId } from '$lib/quiz';
	import { QUIZ_RESULT_TIERS } from '$lib/quiz-data';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Quiz-Engine-State — bewusst hier auf Seitenebene statt in einer
	// Komponente: nur diese Route braucht ihn, die Unterkomponenten sind
	// reine Darstellung (Props rein, Callback raus).
	let currentIndex = $state(0);
	let selectedOptionId = $state<QuizOptionId | null>(null);
	let correctCount = $state(0);
	let finished = $state(false);

	const total = $derived(data.questions.length);
	const currentQuestion = $derived(data.questions[currentIndex]);
	const isLast = $derived(currentIndex === total - 1);

	function selectOption(optionId: QuizOptionId) {
		if (selectedOptionId !== null) return; // schon beantwortet, keine Änderung mehr
		selectedOptionId = optionId;
		if (optionId === currentQuestion.correctOptionId) {
			correctCount += 1;
		}
	}

	function next() {
		if (isLast) {
			finished = true;
			return;
		}
		currentIndex += 1;
		selectedOptionId = null;
	}

	function restart() {
		currentIndex = 0;
		selectedOptionId = null;
		correctCount = 0;
		finished = false;
	}

	function changeDifficulty() {
		goto('/quiz');
	}

	const percentage = $derived(percentageFor(correctCount, total));
	const tier = $derived(resultTierFor(QUIZ_RESULT_TIERS, percentage));
	const shareTextValue = $derived(shareText(data.difficulty, correctCount, total, percentage));

	const canonical = $derived(`https://padelindex.de/quiz/${data.difficulty.slug}`);

	const breadcrumbSchema = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' },
				{ '@type': 'ListItem', position: 2, name: 'Quiz', item: 'https://padelindex.de/quiz' },
				{ '@type': 'ListItem', position: 3, name: data.difficulty.label, item: canonical }
			]
		})
	);
</script>

<svelte:head>
	<title>{data.difficulty.metaTitle} — PadelIndex</title>
	<meta name="description" content={data.difficulty.metaDescription} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content={data.difficulty.metaTitle} />
	<meta property="og:description" content={data.difficulty.metaDescription} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${breadcrumbSchema}</script>`}
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light">
		<div class="wrap narrow">
			{#if !finished}
				<h1 class="sr-only">Padel Quiz — {data.difficulty.label}</h1>
				<QuizProgressBar current={currentIndex + 1} {total} />
				<QuizQuestionCard
					question={currentQuestion}
					difficultyLabel={data.difficulty.label}
					accentColor={data.difficulty.color}
					{selectedOptionId}
					{isLast}
					onSelect={selectOption}
					onNext={next}
				/>
			{:else}
				<h1 class="sr-only">Dein Quiz-Ergebnis — {data.difficulty.label}</h1>
				<QuizResultScreen
					difficulty={data.difficulty}
					{correctCount}
					{total}
					{percentage}
					{tier}
					recommendedGuides={data.recommendedGuides}
					{shareTextValue}
					onRestart={restart}
					onChangeDifficulty={changeDifficulty}
				/>
			{/if}
		</div>
	</section>
</main>

<LandingFooter />

<style>
	main {
		background: var(--chalk);
		min-height: 60vh;
	}

	.narrow {
		max-width: 640px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
