<script lang="ts">
	import type { LeaderboardResponse } from '$lib/leaderboard';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { dateLocaleFor } from '$lib/i18n/date';

	let {
		board,
		unavailable = false,
		compact = false
	}: {
		board: LeaderboardResponse | null;
		unavailable?: boolean;
		compact?: boolean;
	} = $props();

	const RING = 2 * Math.PI * 9;

	function dash(confidence: number) {
		const c = Math.max(0, Math.min(1, confidence));
		return `${(RING * c).toFixed(2)} ${RING.toFixed(2)}`;
	}

	function updatedLabel(iso: string | null) {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString(dateLocaleFor(getLocale()), {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

{#if unavailable}
	<div class="lb">
		<div class="lb-head"><span class="n">{m.cl_ranking()}</span></div>
		<p class="empty">
			{m.cl_unavailable()}
		</p>
	</div>
{:else if !board}
	<div class="lb">
		<div class="lb-head"><span class="n">{m.cl_ranking()}</span></div>
		<p class="empty">{m.cl_not_found()}</p>
	</div>
{:else if board.players.length === 0}
	<div class="lb">
		<div class="lb-head">
			<span class="n">{board.club.name}</span>
			<span class="e">{m.cs_level_ranking()}</span>
		</div>
		<p class="empty">
			{m.cl_empty()}
		</p>
	</div>
{:else}
	<div class="lb" class:compact>
		<div class="lb-head">
			<span class="n">{board.club.name}</span>
			<span class="e">{m.cs_level_ranking()}</span>
		</div>
		<ol>
			{#each board.players as p (p.handle)}
				<!-- Profil-Link nur außerhalb des eingebetteten Widgets (compact) —
				     Drittseiten sollen ihr Widget nicht ungefragt zu einer
				     Navigation nach padelindex.de machen. -->
				<li>
					<svelte:element
						this={compact ? 'span' : 'a'}
						class="row"
						href={compact ? undefined : localizeHref(`/p/${p.handle}`)}
					>
						<span class="r">{p.rank}</span>
						<span>
							<span class="nm">{p.name}</span>
							{#if !p.claimed}
								<span class="uc" title={m.cl_unclaimed_title()}>{m.cl_unclaimed_badge()}</span>
							{/if}
							<span class="mt" class:prov={p.provisional}>
								{p.provisional
									? `${m.lab_provisional()} · ${m.cs_matches_count({ count: p.matches })}`
									: m.cs_matches_count({ count: p.matches })}
							</span>
						</span>
						<span class="sc">
							<svg class="mini" viewBox="0 0 22 22" aria-hidden="true">
								<circle class="t" cx="11" cy="11" r="9"></circle>
								<circle class="f" cx="11" cy="11" r="9" stroke-dasharray={dash(p.confidence)}
								></circle>
							</svg>
							<span
								class="v"
								title={m.cl_confidence_title({ percent: Math.round(p.confidence * 100) })}
							>
								{p.rating.toFixed(2)}
								<span class="sr-only"
									>{m.cl_confidence_sr({ percent: Math.round(p.confidence * 100) })}</span
								>
							</span>
						</span>
					</svelte:element>
				</li>
			{/each}
		</ol>
		<div class="lb-foot">
			{#if board.dataOrigin === 'league_import'}
				<span class="src" title={m.cl_league_import_title()}>
					{m.cl_league_import_label()}
				</span>
			{:else}
				<span
					>{board.updated_at
						? m.cl_updated_label({ date: updatedLabel(board.updated_at) })
						: ''}</span
				>
			{/if}
			<span>PadelIndex</span>
		</div>
	</div>
{/if}

<style>
	.empty {
		margin: 0;
		padding: 22px 16px;
		font-size: 14px;
		color: var(--muted-light);
	}

	/* Importiertes Profil, das noch niemand übernommen hat. */
	.uc {
		margin-left: 7px;
		padding: 1px 6px;
		border-radius: 100px;
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted-light);
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		vertical-align: 1px;
	}
</style>
