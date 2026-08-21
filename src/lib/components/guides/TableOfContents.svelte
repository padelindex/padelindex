<script lang="ts">
	type Entry = { id: string; heading: string };
	let { entries }: { entries: Entry[] } = $props();
</script>

<nav class="toc" aria-label="Inhaltsverzeichnis">
	<p class="toc-title">Inhalt</p>
	<ol>
		{#each entries as entry (entry.id)}
			<li><a href="#{entry.id}">{entry.heading}</a></li>
		{/each}
	</ol>
</nav>

<style>
	.toc {
		border: 1px solid var(--line-light);
		border-radius: 16px;
		padding: 18px 20px;
		background: var(--chalk-2, #f7f9f5);
	}

	.toc-title {
		margin: 0 0 10px;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-light);
	}

	ol {
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: toc;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	li {
		counter-increment: toc;
	}

	a {
		display: flex;
		gap: 8px;
		font-size: 13.5px;
		line-height: 1.4;
		color: var(--ink);
		text-decoration: none;
	}

	a::before {
		content: counter(toc) '.';
		flex-shrink: 0;
		font-family: var(--mono);
		color: var(--court-deep);
	}

	a:hover {
		color: var(--court-deep);
		text-decoration: underline;
	}

	@media (min-width: 960px) {
		.toc {
			position: sticky;
			top: 24px;
		}
	}
</style>
