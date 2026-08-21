<script lang="ts">
	import type { GuideArticle } from '$lib/guides';
	import { categoryLabels, difficultyLabels } from '$lib/guides';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	let { guide }: { guide: GuideArticle } = $props();
</script>

<a class="guide-card" href={localizeHref(`/ratgeber/${guide.slug}`)}>
	<div class="badges">
		<span class="badge badge-category">{categoryLabels()[guide.category]}</span>
		<span class="badge badge-difficulty">{difficultyLabels()[guide.difficulty]}</span>
	</div>
	<h3>{guide.title}</h3>
	<p class="excerpt">{guide.excerpt}</p>
	<span class="meta">{m.guide_reading_time({ minutes: guide.readingTime })}</span>
</a>

<style>
	.guide-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 22px;
		border-radius: 18px;
		border: 1px solid var(--line-light);
		background: #fff;
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.guide-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 28px rgba(11, 30, 38, 0.08);
	}

	.guide-card:focus-visible {
		outline: 2px solid var(--court-deep);
		outline-offset: 2px;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.badge {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 4px 10px;
		border-radius: 100px;
	}

	.badge-category {
		background: rgba(12, 110, 100, 0.1);
		color: var(--court-deep);
	}

	.badge-difficulty {
		background: var(--chalk-2, #f7f9f5);
		color: var(--muted-light);
		border: 1px solid var(--line-light);
	}

	h3 {
		font-size: 17px;
		line-height: 1.3;
		margin: 0;
	}

	.excerpt {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--muted-light);
		flex-grow: 1;
	}

	.meta {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--muted-light);
	}
</style>
