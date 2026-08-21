<script lang="ts">
	import type { QuizDifficulty } from '$lib/quiz';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	let { difficulty, questionCount }: { difficulty: QuizDifficulty; questionCount: number } =
		$props();
</script>

<a
	class="diff-card"
	href={localizeHref(`/quiz/${difficulty.slug}`)}
	style="--accent: {difficulty.color}"
>
	<span class="label">{difficulty.label}</span>
	<p class="desc">{difficulty.description}</p>
	<span class="count">{m.quiz_question_count({ count: questionCount })}</span>
</a>

<style>
	.diff-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 26px 24px;
		border-radius: 20px;
		border: 1px solid var(--line-light);
		border-top: 4px solid var(--accent);
		background: #fff;
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.diff-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 14px 30px rgba(11, 30, 38, 0.1);
	}

	.diff-card:focus-visible {
		outline: 2px solid var(--court-deep);
		outline-offset: 2px;
	}

	.label {
		font-family: var(--display);
		font-weight: 600;
		font-size: 20px;
		color: var(--accent);
	}

	.desc {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--muted-light);
		flex-grow: 1;
	}

	.count {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
</style>
