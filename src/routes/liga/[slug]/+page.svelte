<script lang="ts">
	// ============================================================
	// PadelIndex — /liga/[slug]
	// ============================================================
	// Die Liga-Rangliste ist ein eigenes Produkt neben dem allgemeinen
	// Index-Rating und wird bewusst nicht mit ihm vermischt: hier stehen
	// Matchpunkte, Sätze und Spiele einer Box, nicht das Level 0-7.
	// Der Hinweis unten sagt das auch den Besuchern.
	//
	// Box-Tabellen werden NIE untereinander verglichen — deshalb bekommt
	// jede Box ihre eigene, in sich geschlossene Tabelle statt einer
	// durchgehenden Rangliste über alle Boxen.

	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const NAV = [
		{ href: '/#problem', label: 'Warum' },
		{ href: '/rating', label: 'Rating' },
		{ href: '/#tokens', label: 'Tokens' },
		{ href: '/vereine', label: 'Für Vereine' }
	];

	function nameOf(box: PageData['ladder'][number], seat: number): string {
		return box.lineup.find((p) => p.seat === seat)?.name ?? '—';
	}

	function setsLabel(round: PageData['ladder'][number]['rounds'][number]): string {
		if (round.sets.length === 0) return '—';
		return round.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ');
	}

	const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	function fmtDate(iso: string | null): string {
		return iso ? dateFmt.format(new Date(iso)) : '';
	}
</script>

<svelte:head>
	<title>{data.league.name} — Tabellen und Ergebnisse | PadelIndex</title>
	<meta
		name="description"
		content="Boxen, Tabellen und Ergebnisse der {data.league.name} auf PadelIndex. Jede Box wird für sich gewertet: Matchpunkte, Sätze, Spiele."
	/>
	<link rel="canonical" href="https://padelindex.de/liga/{data.league.slug}" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/liga/{data.league.slug}" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="{data.league.name} — Tabellen und Ergebnisse" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={NAV} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Liga</span>
				<h1 use:reveal={{ delay: 0.05 }}>{data.league.name}</h1>
				{#if data.cycle}
					<p class="muted" use:reveal={{ delay: 0.1 }}>
						{data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`} · {fmtDate(data.cycle.startDate)} bis
						{fmtDate(data.cycle.endDate)}
						{#if data.cycle.status === 'running'}<span class="pill">läuft</span>{:else}<span
								class="pill pill-done">abgeschlossen</span
							>{/if}
					</p>
				{/if}
				<p class="muted note" use:reveal={{ delay: 0.14 }}>
					Jede Box wird für sich gewertet — Tabellen verschiedener Boxen sind nicht vergleichbar.
					Sortiert nach Matchpunkten, dann Sätzen, dann Spielen. Das ist die Liga-Wertung und
					<strong>nicht</strong> dasselbe wie dein <a href="/rating">PadelIndex-Level</a>; Ergebnisse
					fließen dort zusätzlich ein.
				</p>
			</div>

			{#if !data.cycle}
				<p class="empty" use:reveal>Für diese Liga läuft gerade kein Zyklus.</p>
			{:else if data.ladder.length === 0}
				<p class="empty" use:reveal>In diesem Zyklus sind noch keine Boxen eingeteilt.</p>
			{:else}
				<div class="boxes">
					{#each data.ladder as box (box.id)}
						<article class="box" class:mine={box.id === data.myBoxId} use:reveal>
							<header>
								<h2>{box.label ?? `Box ${box.ladderPosition}`}</h2>
								<div class="box-meta">
									{#if box.scheduledAt}<span class="num">{fmtDate(box.scheduledAt)}</span>{/if}
									{#if box.court}<span>{box.court}</span>{/if}
									{#if !box.complete}<span class="pill pill-open">offen</span>{/if}
								</div>
							</header>

							<table class="standings">
								<caption class="sr-only"
									>Tabelle {box.label ?? `Box ${box.ladderPosition}`}: Platz, Spieler, Matchpunkte,
									Sätze, Spiele</caption
								>
								<thead>
									<tr>
										<th scope="col" class="c-rank">#</th>
										<th scope="col">Spieler</th>
										<th scope="col" class="c-num">Pkt</th>
										<th scope="col" class="c-num">Sätze</th>
										<th scope="col" class="c-num">Spiele</th>
									</tr>
								</thead>
								<tbody>
									{#each box.standings as row (row.seat)}
										{@const player = box.lineup.find((p) => p.seat === row.seat)}
										{@const unplayed = box.standings.every((s) => s.played === 0)}
										<tr>
											<!-- In einer Box ohne jedes Ergebnis sind formal alle
											     punktgleich auf Platz 1. Viermal "1" liest sich aber
											     wie ein Fehler, deshalb hier ein Strich. -->
											<td class="c-rank num">{unplayed ? '–' : row.rank}</td>
											<td>
												{#if player?.handle}
													<a href="/p/{player.handle}">{player.name}</a>
												{:else}
													{player?.name ?? '—'}
												{/if}
												{#if player?.role === 'substitute'}<span class="sub" title="Ersatzspieler"
														>E</span
													>{/if}
											</td>
											<td class="c-num num">{row.matchPoints}</td>
											<td class="c-num num">{row.setsWon}:{row.setsLost}</td>
											<td class="c-num num">{row.gamesWon}:{row.gamesLost}</td>
										</tr>
									{/each}
								</tbody>
							</table>

							<details class="rounds">
								<summary>Runden ({box.rounds.filter((r) => r.matchId).length}/{box.rounds.length})</summary>
								<ul>
									{#each box.rounds as round (round.id)}
										<li>
											<span class="rnum num">R{round.roundNumber}</span>
											<span class="pairing">
												{nameOf(box, round.team1[0])} / {nameOf(box, round.team1[1])}
												<em>vs</em>
												{nameOf(box, round.team2[0])} / {nameOf(box, round.team2[1])}
											</span>
											<span class="score num">{setsLabel(round)}</span>
											{#if round.matchId && !round.confirmed}
												<span class="pill pill-open" title="Wartet auf Bestätigung des Gegnerteams"
													>offen</span
												>
											{/if}
										</li>
									{/each}
								</ul>
							</details>

							{#if box.id === data.myBoxId}
								<a class="btn btn-primary report" href="/liga/{data.league.slug}/box/{box.id}">
									Ergebnis melden
								</a>
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	h1 {
		margin-top: 18px;
	}
	.sec-head .muted {
		margin-top: 14px;
	}
	.note {
		max-width: 64ch;
		font-size: 14px;
	}
	.note a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	.pill {
		display: inline-block;
		margin-left: 8px;
		padding: 2px 9px;
		border-radius: 100px;
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(22, 163, 148, 0.16);
		color: var(--court-deep, #0f6e5c);
	}
	.pill-done {
		background: rgba(0, 0, 0, 0.07);
		color: var(--muted-light);
	}
	.pill-open {
		background: rgba(233, 178, 60, 0.22);
		color: #7a5300;
	}
	.empty {
		margin-top: 32px;
		color: var(--muted-light);
	}

	.boxes {
		margin-top: 40px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 20px;
	}
	.box {
		padding: 20px;
		border: 1px solid var(--line-light);
		border-radius: 16px;
		background: var(--chalk-2);
	}
	.box.mine {
		border-color: var(--court);
	}
	.box header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 14px;
	}
	.box h2 {
		font-size: 20px;
	}
	.box-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		color: var(--muted-light);
	}

	.standings {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}
	.standings th {
		text-align: left;
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted-light);
		font-weight: 500;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--line-light);
	}
	.standings td {
		padding: 9px 0;
		border-bottom: 1px solid var(--line-light);
	}
	.standings tr:last-child td {
		border-bottom: none;
	}
	.c-rank {
		width: 2.2em;
	}
	.c-num {
		text-align: right;
		width: 4.2em;
	}
	.standings a {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}
	.standings a:hover {
		border-bottom-color: var(--court);
	}
	.sub {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 5px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.07);
		font-size: 10px;
		color: var(--muted-light);
	}

	.rounds {
		margin-top: 14px;
		font-size: 13px;
	}
	.rounds summary {
		cursor: pointer;
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		list-style: none;
	}
	.rounds summary::-webkit-details-marker {
		display: none;
	}
	.rounds ul {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.rounds li {
		display: flex;
		align-items: baseline;
		gap: 8px;
		flex-wrap: wrap;
		color: var(--muted-light);
	}
	.rnum {
		flex-shrink: 0;
		font-size: 11px;
	}
	.pairing {
		flex: 1 1 12ch;
		min-width: 0;
	}
	.pairing em {
		font-style: normal;
		opacity: 0.55;
		margin: 0 2px;
	}
	.score {
		flex-shrink: 0;
	}
	.report {
		margin-top: 16px;
	}
</style>
