<script lang="ts">
	let { current, total }: { current: number; total: number } = $props();
	const percent = $derived(total > 0 ? Math.round((current / total) * 100) : 0);
</script>

<div
	class="progress"
	role="progressbar"
	aria-valuenow={current}
	aria-valuemin={0}
	aria-valuemax={total}
	aria-label="Frage {current} von {total}"
>
	<div class="track">
		<div class="fill" style="width: {percent}%"></div>
	</div>
	<span class="label">Frage {current} / {total}</span>
</div>

<style>
	.progress {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 24px;
	}

	.track {
		flex-grow: 1;
		height: 8px;
		border-radius: 100px;
		background: var(--line-light);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--court-deep);
		border-radius: 100px;
		transition: width 0.25s ease;
	}

	.label {
		flex-shrink: 0;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--muted-light);
		white-space: nowrap;
	}
</style>
