<script lang="ts">
	// Sichtbare Breadcrumb-Navigation. Das zugehörige BreadcrumbList-JSON-LD
	// bauen die Seiten selbst inline (gleiches Muster wie /c/[slug] und
	// /p/[handle]) — hier geht es nur um die sichtbare Spur.
	import { m } from '$lib/paraglide/messages.js';

	type Crumb = { label: string; href?: string };
	let { items }: { items: Crumb[] } = $props();
</script>

<nav aria-label={m.breadcrumb_nav_aria()} class="crumbs">
	<ol>
		{#each items as item, i (item.label)}
			<li>
				{#if item.href && i < items.length - 1}
					<a href={item.href}>{item.label}</a>
				{:else}
					<span aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.crumbs {
		margin: 0 0 18px;
	}

	ol {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		list-style: none;
		margin: 0;
		padding: 0;
		font-family: var(--mono);
		font-size: 11.5px;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	li:not(:last-child)::after {
		content: '/';
		margin-left: 6px;
		color: var(--line-light);
	}

	a {
		color: var(--muted-light);
		text-decoration: none;
	}

	a:hover {
		color: var(--court-deep);
		text-decoration: underline;
	}

	[aria-current='page'] {
		color: var(--ink);
	}
</style>
