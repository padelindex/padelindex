<script lang="ts">
	import type { H2HStats } from '$lib/server/h2h';
	import { m } from '$lib/paraglide/messages.js';

	let { stats, name }: { stats: H2HStats; name: string } = $props();

	const rivalryWinPct = $derived(
		stats.asOpponents > 0 ? Math.round((stats.winsAgainst / stats.asOpponents) * 100) : 0
	);
	const teamWinPct = $derived(
		stats.asTeammates > 0 ? Math.round((stats.teammateWins / stats.asTeammates) * 100) : 0
	);
</script>

<div class="h2h">
	{#if stats.asOpponents > 0}
		<div class="h2h-card">
			<h3 class="h2h-title">{m.h2h_rivalry_title({ name })}</h3>
			<div
				class="bar"
				role="img"
				aria-label="{m.h2h_rivalry_wins_label()} {stats.winsAgainst} : {stats.lossesAgainst} {m.h2h_rivalry_losses_label(
					{ name }
				)}"
			>
				<span class="bar-fill bar-you" style="width: {rivalryWinPct}%"></span>
				<span class="bar-fill bar-them" style="width: {100 - rivalryWinPct}%"></span>
			</div>
			<div class="stats-row">
				<div class="stat">
					<span class="stat-v num you">{stats.winsAgainst}</span>
					<span class="stat-l">{m.h2h_rivalry_wins_label()}</span>
				</div>
				<div class="stat right">
					<span class="stat-v num them">{stats.lossesAgainst}</span>
					<span class="stat-l">{m.h2h_rivalry_losses_label({ name })}</span>
				</div>
			</div>
			<p class="summary">{m.h2h_rivalry_summary({ count: stats.asOpponents })}</p>
		</div>
	{/if}

	{#if stats.asTeammates > 0}
		<div class="h2h-card">
			<h3 class="h2h-title">{m.h2h_team_title({ name })}</h3>
			<div
				class="bar"
				role="img"
				aria-label={m.h2h_team_summary({ percent: teamWinPct, count: stats.asTeammates })}
			>
				<span class="bar-fill bar-you" style="width: {teamWinPct}%"></span>
				<span class="bar-fill bar-track" style="width: {100 - teamWinPct}%"></span>
			</div>
			<div class="stats-row">
				<div class="stat">
					<span class="stat-v num you">{stats.teammateWins}</span>
					<span class="stat-l">{m.h2h_team_wins_label()}</span>
				</div>
				<div class="stat right">
					<span class="stat-v num them">{stats.teammateLosses}</span>
					<span class="stat-l">{m.h2h_team_losses_label()}</span>
				</div>
			</div>
			<p class="summary">{m.h2h_team_summary({ percent: teamWinPct, count: stats.asTeammates })}</p>
		</div>
	{/if}
</div>

<style>
	.h2h {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 28px;
	}

	.h2h-card {
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.h2h-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
		margin: 0;
	}

	.bar {
		display: flex;
		width: 100%;
		height: 10px;
		margin-top: 16px;
		border-radius: 100px;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.06);
	}
	.bar-fill {
		height: 100%;
	}
	.bar-you {
		background: var(--court-deep, #0f6e5c);
	}
	.bar-them {
		background: var(--signal, #e9b23c);
	}
	.bar-track {
		background: transparent;
	}

	.stats-row {
		display: flex;
		justify-content: space-between;
		gap: 14px;
		margin-top: 14px;
	}
	.stat {
		display: flex;
		flex-direction: column;
	}
	.stat.right {
		align-items: flex-end;
		text-align: right;
	}
	.stat-v {
		font-size: 26px;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.stat-v.you {
		color: var(--court-deep, #0f6e5c);
	}
	.stat-v.them {
		color: var(--muted-light);
	}
	.stat-l {
		font-size: 12px;
		color: var(--muted-light);
		margin-top: 3px;
	}

	.summary {
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		font-size: 12.5px;
		color: var(--muted-light);
	}
</style>
