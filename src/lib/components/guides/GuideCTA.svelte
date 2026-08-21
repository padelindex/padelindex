<script lang="ts">
	let {
		heading,
		text,
		primaryHref,
		primaryLabel,
		secondaryHref,
		secondaryLabel
	}: {
		heading: string;
		text: string;
		primaryHref: string;
		primaryLabel: string;
		secondaryHref?: string;
		secondaryLabel?: string;
	} = $props();
</script>

<div class="guide-cta">
	<div>
		<p class="heading">{heading}</p>
		<p class="text">{text}</p>
	</div>
	<div class="actions">
		<a class="btn btn-primary" href={primaryHref}>{primaryLabel}</a>
		{#if secondaryHref && secondaryLabel}
			<a class="btn btn-ghost-light" href={secondaryHref}>{secondaryLabel}</a>
		{/if}
	</div>
</div>

<style>
	.guide-cta {
		margin: 32px 0;
		padding: 24px 26px;
		border-radius: 18px;
		background: var(--ink);
		color: var(--chalk);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
	}

	.heading {
		margin: 0 0 4px;
		font-family: var(--display);
		font-weight: 600;
		font-size: 17px;
	}

	.text {
		margin: 0;
		font-size: 13.5px;
		color: rgba(239, 242, 237, 0.7);
		max-width: 480px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.guide-cta :global(.btn-ghost-light) {
		border-color: rgba(239, 242, 237, 0.35);
		color: var(--chalk);
	}

	.guide-cta :global(.btn-ghost-light:hover) {
		border-color: var(--chalk);
	}
</style>
