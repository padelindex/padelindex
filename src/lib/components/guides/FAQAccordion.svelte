<script lang="ts">
	// <details>/<summary> statt eigenem Klick-Handling: nativ per Tastatur
	// bedienbar, für Screenreader korrekt angesagt, funktioniert ohne
	// JavaScript. Kein Grund, das selbst nachzubauen.
	import type { FAQItem } from '$lib/guides';

	let { items }: { items: FAQItem[] } = $props();
</script>

<div class="faq">
	{#each items as item (item.question)}
		<details>
			<summary>{item.question}</summary>
			<p>{item.answer}</p>
		</details>
	{/each}
</div>

<style>
	.faq {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	details {
		border: 1px solid var(--line-light);
		border-radius: 14px;
		padding: 4px 18px;
		background: #fff;
	}

	summary {
		cursor: pointer;
		padding: 14px 0;
		font-family: var(--display);
		font-weight: 600;
		font-size: 15px;
		color: var(--ink);
		list-style: none;
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::after {
		content: '+';
		flex-shrink: 0;
		font-family: var(--mono);
		color: var(--court-deep);
	}

	details[open] summary::after {
		content: '–';
	}

	summary:focus-visible {
		outline: 2px solid var(--court-deep);
		outline-offset: 2px;
		border-radius: 6px;
	}

	p {
		margin: 0 0 16px;
		font-size: 14.5px;
		line-height: 1.6;
		color: var(--muted-light);
	}
</style>
