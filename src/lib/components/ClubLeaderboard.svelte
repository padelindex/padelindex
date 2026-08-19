<script lang="ts">
	import type { LeaderboardResponse } from '$lib/leaderboard';

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
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

{#if unavailable}
	<div class="lb">
		<div class="lb-head"><span class="n">Ranking</span></div>
		<p class="empty">
			Supabase ist noch nicht verbunden. Ranking erscheint, sobald die Datenbank hängt.
		</p>
	</div>
{:else if !board}
	<div class="lb">
		<div class="lb-head"><span class="n">Ranking</span></div>
		<p class="empty">Verein nicht gefunden.</p>
	</div>
{:else if board.players.length === 0}
	<div class="lb">
		<div class="lb-head">
			<span class="n">{board.club.name}</span>
			<span class="e">Level-Ranking</span>
		</div>
		<p class="empty">
			Noch keine bestätigten Matches. Das Ranking startet mit dem ersten Ergebnis.
		</p>
	</div>
{:else}
	<div class="lb" class:compact>
		<div class="lb-head">
			<span class="n">{board.club.name}</span>
			<span class="e">Level-Ranking</span>
		</div>
		<ol>
			{#each board.players as p (p.handle)}
				<!-- Profil-Link nur außerhalb des eingebetteten Widgets (compact) —
				     Drittseiten sollen ihr Widget nicht ungefragt zu einer
				     Navigation nach padelindex.de machen. -->
				<li>
					<svelte:element this={compact ? 'span' : 'a'} class="row" href={compact ? undefined : `/p/${p.handle}`}>
						<span class="r">{p.rank}</span>
						<span>
							<span class="nm">{p.name}</span>
							{#if !p.claimed}
								<span class="uc" title="Profil noch nicht beansprucht">frei</span>
							{/if}
							<span class="mt" class:prov={p.provisional}>
								{p.provisional ? `provisorisch · ${p.matches} Matches` : `${p.matches} Matches`}
							</span>
						</span>
						<span class="sc">
							<svg class="mini" viewBox="0 0 22 22" aria-hidden="true">
								<circle class="t" cx="11" cy="11" r="9"></circle>
								<circle class="f" cx="11" cy="11" r="9" stroke-dasharray={dash(p.confidence)}
								></circle>
							</svg>
							<span class="v" title="Sicherheit {Math.round(p.confidence * 100)} %">
								{p.rating.toFixed(2)}
								<span class="sr-only">, Sicherheit {Math.round(p.confidence * 100)} %</span>
							</span>
						</span>
					</svelte:element>
				</li>
			{/each}
		</ol>
		<div class="lb-foot">
			{#if board.dataOrigin === 'league_import'}
				<span class="src" title="Noch keine über PadelIndex gemeldeten Matches — die Werte stammen aus importierten Liga-Ergebnissen.">
					Aus Ligaergebnissen importiert
				</span>
			{:else}
				<span>{board.updated_at ? `Stand ${updatedLabel(board.updated_at)}` : ''}</span>
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
