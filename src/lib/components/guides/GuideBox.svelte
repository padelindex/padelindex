<script lang="ts">
	import type { GuideBox } from '$lib/guides';

	let { box }: { box: GuideBox } = $props();

	const ICON: Record<GuideBox['kind'], string> = {
		info: 'ℹ️',
		checklist: '✅',
		tips: '💡',
		mistakes: '⚠️'
	};
</script>

<div class="box box-{box.kind}">
	<p class="box-title">
		<span aria-hidden="true">{ICON[box.kind]}</span>
		{box.title}
	</p>
	<ul>
		{#each box.items as item (item)}
			<li>{item}</li>
		{/each}
	</ul>
</div>

<style>
	.box {
		margin: 18px 0;
		padding: 18px 20px;
		border-radius: 16px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2, #f7f9f5);
	}

	.box-mistakes {
		background: rgba(163, 52, 31, 0.06);
		border-color: rgba(163, 52, 31, 0.18);
	}

	.box-tips {
		background: rgba(22, 163, 148, 0.07);
		border-color: rgba(22, 163, 148, 0.2);
	}

	.box-title {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 10px;
		font-family: var(--display);
		font-weight: 600;
		font-size: 14.5px;
		color: var(--ink);
	}

	ul {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	li {
		font-size: 14px;
		line-height: 1.55;
		color: var(--ink);
	}
</style>
