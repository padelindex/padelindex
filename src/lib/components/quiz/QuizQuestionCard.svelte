<script lang="ts">
	import type { QuizOptionId, QuizQuestion } from '$lib/quiz';
	import { m } from '$lib/paraglide/messages.js';

	let {
		question,
		difficultyLabel,
		accentColor,
		selectedOptionId,
		isLast,
		onSelect,
		onNext
	}: {
		question: QuizQuestion;
		difficultyLabel: string;
		accentColor: string;
		selectedOptionId: QuizOptionId | null;
		isLast: boolean;
		onSelect: (id: QuizOptionId) => void;
		onNext: () => void;
	} = $props();

	const answered = $derived(selectedOptionId !== null);

	function stateFor(optionId: QuizOptionId): 'neutral' | 'correct' | 'incorrect' {
		if (!answered) return 'neutral';
		if (optionId === question.correctOptionId) return 'correct';
		if (optionId === selectedOptionId) return 'incorrect';
		return 'neutral';
	}
</script>

<div class="question-card">
	<span class="badge" style="--accent: {accentColor}">{difficultyLabel}</span>
	<h2>{question.question}</h2>

	<div class="options" role="group" aria-label={m.quiz_options_aria()}>
		{#each question.options as option (option.id)}
			{@const state = stateFor(option.id)}
			<button
				type="button"
				class="option option-{state}"
				disabled={answered}
				aria-pressed={selectedOptionId === option.id}
				onclick={() => onSelect(option.id)}
			>
				<span class="option-id">{option.id}</span>
				<span>{option.text}</span>
			</button>
		{/each}
	</div>

	{#if answered}
		<div class="explanation" role="status">
			<p class="explanation-label">
				{selectedOptionId === question.correctOptionId
					? m.quiz_feedback_correct()
					: m.quiz_feedback_incorrect()}
			</p>
			<p>{question.explanation}</p>
		</div>
		<button class="btn btn-primary next-btn" type="button" onclick={onNext}>
			{isLast ? m.quiz_show_result() : m.quiz_next()}
		</button>
	{/if}
</div>

<style>
	.question-card {
		padding: 28px;
		border-radius: 22px;
		border: 1px solid var(--line-light);
		background: #fff;
	}

	.badge {
		display: inline-block;
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 5px 12px;
		border-radius: 100px;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		margin-bottom: 14px;
	}

	h2 {
		font-size: 20px;
		line-height: 1.35;
		margin: 0 0 22px;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		text-align: left;
		padding: 14px 16px;
		border-radius: 14px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2, #f7f9f5);
		font-family: var(--body);
		font-size: 14.5px;
		color: var(--ink);
		cursor: pointer;
	}

	.option:hover:not(:disabled) {
		border-color: var(--court-deep);
	}

	.option:focus-visible {
		outline: 2px solid var(--court-deep);
		outline-offset: 2px;
	}

	.option:disabled {
		cursor: default;
	}

	.option-id {
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 100px;
		background: #fff;
		border: 1px solid var(--line-light);
		font-family: var(--mono);
		font-size: 12px;
	}

	.option-correct {
		border-color: #0f6e5c;
		background: rgba(15, 110, 92, 0.1);
	}

	.option-correct .option-id {
		background: #0f6e5c;
		border-color: #0f6e5c;
		color: #fff;
	}

	.option-incorrect {
		border-color: #a3341f;
		background: rgba(163, 52, 31, 0.08);
	}

	.option-incorrect .option-id {
		background: #a3341f;
		border-color: #a3341f;
		color: #fff;
	}

	.explanation {
		margin-top: 20px;
		padding: 16px 18px;
		border-radius: 14px;
		background: var(--chalk-2, #f7f9f5);
	}

	.explanation-label {
		margin: 0 0 6px;
		font-family: var(--display);
		font-weight: 600;
		font-size: 14px;
	}

	.explanation p:last-child {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--muted-light);
	}

	.next-btn {
		margin-top: 20px;
		width: 100%;
	}
</style>
