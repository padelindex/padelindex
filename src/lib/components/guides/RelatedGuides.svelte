<script lang="ts">
	import type { GuideArticle } from '$lib/guides';
	import GuideCard from './GuideCard.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { guides, heading }: { guides: GuideArticle[]; heading?: string } = $props();
	const resolvedHeading = $derived(heading ?? m.related_guides_heading());
</script>

{#if guides.length > 0}
	<section class="related" aria-labelledby="related-heading">
		<h2 id="related-heading">{resolvedHeading}</h2>
		<div class="grid">
			{#each guides as guide (guide.slug)}
				<GuideCard {guide} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.related {
		margin-top: 48px;
	}

	h2 {
		font-size: 20px;
		margin: 0 0 18px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 16px;
	}
</style>
