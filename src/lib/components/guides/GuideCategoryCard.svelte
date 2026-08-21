<script lang="ts">
	import type { GuideCategory } from '$lib/guides';
	import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '$lib/guides';

	let { category, count }: { category: GuideCategory; count: number } = $props();
</script>

<a class="cat-card" href="#kategorie-{category}">
	<h3>{CATEGORY_LABELS[category]}</h3>
	<p>{CATEGORY_DESCRIPTIONS[category]}</p>
	<span class="count">{count} Artikel</span>
</a>

<style>
	.cat-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 20px 22px;
		border-radius: 18px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2, #f7f9f5);
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.15s ease;
	}

	.cat-card:hover {
		box-shadow: 0 10px 24px rgba(11, 30, 38, 0.06);
	}

	.cat-card:focus-visible {
		outline: 2px solid var(--court-deep);
		outline-offset: 2px;
	}

	h3 {
		font-size: 16px;
		margin: 0;
		color: var(--court-deep);
	}

	p {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--muted-light);
	}

	.count {
		margin-top: 4px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--muted-light);
	}
</style>
