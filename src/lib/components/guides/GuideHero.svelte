<script lang="ts">
	let {
		eyebrow,
		headline,
		subheadline,
		primaryHref,
		primaryLabel,
		secondaryHref,
		secondaryLabel
	}: {
		eyebrow: string;
		headline: string;
		subheadline: string;
		primaryHref: string;
		primaryLabel: string;
		secondaryHref: string;
		secondaryLabel: string;
	} = $props();
</script>

<header class="guide-hero">
	<span class="eyebrow">{eyebrow}</span>
	<h1>{headline}</h1>
	<p class="sub">{subheadline}</p>
	<div class="cta-row">
		<a class="btn btn-primary" href={primaryHref}>{primaryLabel}</a>
		<a class="btn btn-ghost-light" href={secondaryHref}>{secondaryLabel}</a>
	</div>
</header>

<style>
	.guide-hero {
		max-width: 760px;
		margin: 0 auto 48px;
		text-align: center;
	}

	h1 {
		margin: 10px 0 16px;
		font-size: clamp(30px, 4.2vw, 46px);
	}

	.sub {
		margin: 0 auto 28px;
		max-width: 560px;
		font-size: 16px;
		line-height: 1.6;
		color: var(--muted-light);
	}

	.cta-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
	}
</style>
