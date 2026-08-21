<script lang="ts">
	import type { QuizDifficulty, QuizResultTier } from '$lib/quiz';
	import type { GuideArticle } from '$lib/guides';
	import GuideCard from '../guides/GuideCard.svelte';

	let {
		difficulty,
		correctCount,
		total,
		percentage,
		tier,
		recommendedGuides,
		shareTextValue,
		onRestart,
		onChangeDifficulty
	}: {
		difficulty: QuizDifficulty;
		correctCount: number;
		total: number;
		percentage: number;
		tier: QuizResultTier;
		recommendedGuides: GuideArticle[];
		shareTextValue: string;
		onRestart: () => void;
		onChangeDifficulty: () => void;
	} = $props();

	let copied = $state(false);

	async function copyShareText() {
		try {
			await navigator.clipboard.writeText(shareTextValue);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch {
			// Clipboard-API kann in seltenen Browserkonfigurationen fehlen —
			// dann bleibt der Text einfach sichtbar zum manuellen Kopieren.
		}
	}

	const RADIUS = 54;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const dashOffset = $derived(CIRCUMFERENCE * (1 - percentage / 100));
</script>

<div class="result">
	<div class="score-ring">
		<svg viewBox="0 0 120 120" role="img" aria-label="{percentage} Prozent richtig beantwortet">
			<circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--line-light)" stroke-width="10" />
			<circle
				cx="60"
				cy="60"
				r={RADIUS}
				fill="none"
				stroke={difficulty.color}
				stroke-width="10"
				stroke-linecap="round"
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={dashOffset}
				transform="rotate(-90 60 60)"
			/>
		</svg>
		<div class="score-center">
			<span class="score-percent">{percentage}%</span>
			<span class="score-fraction">{correctCount} / {total}</span>
		</div>
	</div>

	<h2>{tier.title}</h2>
	<p class="tier-text">{tier.text}</p>

	<div class="actions">
		<a class="btn btn-primary" href="/level-schaetzen">Zum PadelIndex-Level-Test</a>
		<button class="btn btn-ghost-light" type="button" onclick={onRestart}
			>Quiz erneut starten</button
		>
		<button class="btn btn-ghost-light" type="button" onclick={onChangeDifficulty}>
			Anderen Schwierigkeitsgrad wählen
		</button>
	</div>

	<div class="share">
		<p>{shareTextValue}</p>
		<button class="btn btn-ghost-light" type="button" onclick={copyShareText}>
			{copied ? 'Kopiert!' : 'Ergebnis-Text kopieren'}
		</button>
	</div>

	{#if recommendedGuides.length > 0}
		<div class="recommendations">
			<h3>Passende Ratgeber für dich</h3>
			<div class="grid">
				{#each recommendedGuides as guide (guide.slug)}
					<GuideCard {guide} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.result {
		text-align: center;
		max-width: 640px;
		margin: 0 auto;
	}

	.score-ring {
		position: relative;
		width: 160px;
		height: 160px;
		margin: 0 auto 24px;
	}

	.score-ring svg {
		width: 100%;
		height: 100%;
	}

	.score-ring circle {
		transition: stroke-dashoffset 0.6s ease;
	}

	.score-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.score-percent {
		font-family: var(--display);
		font-weight: 600;
		font-size: 30px;
	}

	.score-fraction {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--muted-light);
	}

	h2 {
		font-size: 24px;
		margin: 0 0 10px;
	}

	.tier-text {
		margin: 0 auto 26px;
		max-width: 460px;
		font-size: 15px;
		line-height: 1.6;
		color: var(--muted-light);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-bottom: 30px;
	}

	.share {
		padding: 18px 20px;
		border-radius: 16px;
		background: var(--chalk-2, #f7f9f5);
		border: 1px solid var(--line-light);
		margin-bottom: 40px;
	}

	.share p {
		margin: 0 0 12px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--muted-light);
	}

	.recommendations {
		text-align: left;
	}

	.recommendations h3 {
		font-size: 18px;
		margin: 0 0 16px;
		text-align: center;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px;
	}
</style>
