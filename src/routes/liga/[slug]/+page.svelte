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

	import { page } from '$app/state';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import SignupForm from '$lib/components/landing/SignupForm.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import type { PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ogLocaleFor } from '$lib/i18n/hreflang';
	import { dateLocaleFor } from '$lib/i18n/date';

	let { data }: { data: PageData } = $props();

	function nameOf(box: PageData['ladder'][number], seat: number): string {
		return box.lineup.find((p) => p.seat === seat)?.name ?? '—';
	}

	function setsLabel(round: PageData['ladder'][number]['rounds'][number]): string {
		if (round.sets.length === 0) return '—';
		return round.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ');
	}

	function boxLabel(box: PageData['ladder'][number]): string {
		return box.label ?? m.liga_box_label_fallback({ n: box.ladderPosition });
	}

	const canonical = $derived(`https://padelindex.de${page.url.pathname}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));

	const dateFmt = $derived(
		new Intl.DateTimeFormat(dateLocaleFor(getLocale()), {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	);
	function fmtDate(iso: string | null): string {
		return iso ? dateFmt.format(new Date(iso)) : '';
	}
</script>

<svelte:head>
	<title>{m.liga_title({ name: data.league.name })}</title>
	<meta name="description" content={m.liga_meta_description({ name: data.league.name })} />
	<link rel="canonical" href={canonical} />
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.liga_og_title({ name: data.league.name })} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>{m.liga_eyebrow()}</span>
				<h1 use:reveal={{ delay: 0.05 }}>{data.league.name}</h1>
				{#if data.cycle}
					<p class="muted" use:reveal={{ delay: 0.1 }}>
						{data.cycle.name ?? m.liga_cycle_ordinal({ ordinal: data.cycle.ordinal })} · {fmtDate(
							data.cycle.startDate
						)}
						{m.liga_date_range_to()}
						{fmtDate(data.cycle.endDate)}
						{#if data.cycle.status === 'running'}<span class="pill">{m.liga_cycle_running()}</span
							>{:else}<span class="pill pill-done">{m.liga_cycle_done()}</span>{/if}
					</p>
				{/if}
				<p class="muted note" use:reveal={{ delay: 0.14 }}>
					{m.liga_note_pre()}
					<strong>{m.liga_note_not()}</strong>
					{m.liga_note_mid()}
					<a href={localizeHref('/rating')}>{m.liga_note_link_label()}</a>{m.liga_note_post()}
				</p>
			</div>

			{#if !data.cycle}
				<p class="empty" use:reveal>{m.liga_no_cycle()}</p>
			{:else if data.ladder.length === 0}
				<p class="empty" use:reveal>{m.liga_no_boxes()}</p>
			{:else}
				<div class="boxes">
					{#each data.ladder as box (box.id)}
						<article class="box" class:mine={box.id === data.myBoxId} use:reveal>
							<header>
								<h2>{boxLabel(box)}</h2>
								<div class="box-meta">
									{#if box.scheduledAt}<span class="num">{fmtDate(box.scheduledAt)}</span>{/if}
									{#if box.court}<span>{box.court}</span>{/if}
									{#if !box.complete}<span class="pill pill-open">{m.liga_box_open_pill()}</span
										>{/if}
								</div>
							</header>

							<table class="standings">
								<caption class="sr-only">{m.liga_table_caption({ box: boxLabel(box) })}</caption>
								<thead>
									<tr>
										<th scope="col" class="c-rank">#</th>
										<th scope="col">{m.liga_th_player()}</th>
										<th scope="col" class="c-num">{m.liga_th_points()}</th>
										<th scope="col" class="c-num">{m.liga_th_sets()}</th>
										<th scope="col" class="c-num">{m.liga_th_games()}</th>
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
													<a href={localizeHref(`/p/${player.handle}`)}>{player.name}</a>
												{:else}
													{player?.name ?? '—'}
												{/if}
												{#if player?.role === 'substitute'}<span
														class="sub"
														title={m.liga_substitute_title()}>{m.liga_substitute_short()}</span
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
								<summary
									>{m.liga_rounds_summary({
										done: box.rounds.filter((r) => r.matchId).length,
										total: box.rounds.length
									})}</summary
								>
								<ul>
									{#each box.rounds as round (round.id)}
										<li>
											<span class="rnum num">{m.liga_round_short({ n: round.roundNumber })}</span>
											<span class="pairing">
												{nameOf(box, round.team1[0])} / {nameOf(box, round.team1[1])}
												<em>{m.liga_pairing_vs()}</em>
												{nameOf(box, round.team2[0])} / {nameOf(box, round.team2[1])}
											</span>
											<span class="score num">{setsLabel(round)}</span>
											{#if round.matchId && !round.confirmed}
												<span class="pill pill-open" title={m.liga_round_open_title()}
													>{m.liga_box_open_pill()}</span
												>
											{/if}
										</li>
									{/each}
								</ul>
							</details>

							{#if box.id === data.myBoxId}
								<a
									class="btn btn-primary report"
									href={localizeHref(`/liga/${data.league.slug}/box/${box.id}`)}
								>
									{m.liga_report_result()}
								</a>
							{/if}
						</article>
					{/each}
				</div>
			{/if}

			<section class="joinbox" use:reveal>
				{#if data.viewerLoggedIn}
					<h2>{m.liga_join_heading_loggedin()}</h2>
					<p class="muted">
						{m.liga_join_loggedin_pre()}
						<a href="/konto#liga">{m.liga_join_loggedin_link()}</a>{m.liga_join_loggedin_post()}
					</p>
				{:else}
					<h2>{m.liga_join_heading_anon()}</h2>
					<p class="muted">
						{m.liga_join_text_anon({
							clubName: data.league.clubName ?? m.liga_join_fallback_club()
						})}
					</p>
					<SignupForm defaultClub={data.league.clubName ?? ''} />
				{/if}
			</section>
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

	.joinbox {
		margin-top: 48px;
		padding: 28px;
		border-radius: 16px;
		background: rgba(22, 163, 148, 0.06);
		border: 1px solid var(--line-light);
		max-width: 64ch;
	}
	.joinbox h2 {
		font-size: 22px;
	}
	.joinbox .muted {
		margin-top: 8px;
		font-size: 14px;
	}
	.joinbox a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	/* .signup ist global für den dunklen Hero-Kontext gestylt (heller Text
	   auf fast-transparentem Feld) — hier auf hellem Kartenhintergrund
	   sonst unlesbar. Eigene, helle Variante statt den globalen Regeln zu
	   vertrauen. */
	.joinbox :global(.signup) {
		margin-top: 18px;
		justify-content: flex-start;
	}
	.joinbox :global(.signup input) {
		background: #fff;
		border-color: var(--line-light);
		color: var(--ink);
	}
	.joinbox :global(.signup input::placeholder) {
		color: var(--muted-light);
	}
	.joinbox :global(.signup-hint) {
		color: var(--muted-light);
	}
</style>
