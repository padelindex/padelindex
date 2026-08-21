<script lang="ts">
	// Liga-Verwaltung. Der Auf-/Abstieg ist hier ausdrücklich ein
	// VORSCHLAG: die Seite zeigt ihn an, ein Admin bestätigt ihn, und erst
	// dann wird er als Beschluss festgeschrieben. Nichts passiert
	// automatisch — genau so war die Anforderung.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { MAIN_NAV } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state(false);

	const warnings = $derived(data.proposal.filter((p) => p.warning));
	const moves = $derived(data.proposal.filter((p) => p.direction !== 'stay'));
	const incompleteBoxes = $derived(data.ladder.filter((b) => !b.complete));
	const alreadyApplied = $derived(data.proposal.some((p) => p.saved === 'applied'));

	const arrow: Record<string, string> = { up: '▲', down: '▼', stay: '–' };
	const label: Record<string, string> = { up: 'Aufstieg', down: 'Abstieg', stay: 'bleibt' };
</script>

<svelte:head>
	<title>Verwaltung — {data.league.name} | PadelIndex</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={MAIN_NAV} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>Verwaltung</span>
			<h1 use:reveal={{ delay: 0.05 }}>{data.league.name}</h1>

			<p class="cycles-link" use:reveal={{ delay: 0.08 }}>
				<a href="/liga/{data.league.slug}/verwaltung/zyklen">Zyklen und Boxen verwalten →</a>
				· <a href="/liga/{data.league.slug}/verwaltung/spieler">Warteliste &amp; Austritt →</a>
			</p>

			{#if !data.cycle}
				<p class="muted intro" use:reveal={{ delay: 0.1 }}>
					Für diese Liga läuft gerade kein Zyklus. Leg unter „Zyklen und Boxen verwalten" einen an.
				</p>
			{:else}
				<p class="muted intro" use:reveal={{ delay: 0.1 }}>
					{data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`} · {data.ladder.length} Boxen. Der Auf-/Abstieg
					unten ist ein Vorschlag aus den Tabellen — er wird erst festgeschrieben, wenn du ihn bestätigst.
				</p>

				{#if form?.message}
					<p class="warn" role="alert">{form.message}</p>
				{/if}
				{#if form?.success}
					<p class="ok" role="status">
						{form.count} Auf-/Abstiege festgeschrieben.
					</p>
				{/if}

				{#if incompleteBoxes.length > 0}
					<div class="callout" use:reveal>
						<h2>{incompleteBoxes.length} Boxen haben nicht alle Runden gespielt</h2>
						<p>
							Für sie wird kein Auf-/Abstieg vorgeschlagen — die Spieler bleiben, wo sie sind.
							Betroffen:
							{incompleteBoxes.map((b) => b.label ?? `Box ${b.ladderPosition}`).join(', ')}.
						</p>
					</div>
				{/if}

				<h2 class="section-title" use:reveal>Auf- und Abstieg</h2>

				{#if data.proposal.length === 0}
					<p class="muted">Noch keine Tabellen, aus denen sich etwas ableiten ließe.</p>
				{:else}
					<div class="tablewrap" use:reveal>
						<table>
							<thead>
								<tr>
									<th scope="col">Spieler</th>
									<th scope="col" class="c-num">Box</th>
									<th scope="col" class="c-num">Platz</th>
									<th scope="col">Bewegung</th>
									<th scope="col" class="c-num">Ziel</th>
									<th scope="col">Hinweis</th>
								</tr>
							</thead>
							<tbody>
								{#each data.proposal as row (row.playerId)}
									<tr class:muted-row={row.direction === 'stay'}>
										<td>{row.playerName}</td>
										<td class="c-num num">{row.fromLadderPosition}</td>
										<td class="c-num num">{row.fromRank}</td>
										<td class="dir dir-{row.direction}">
											<span aria-hidden="true">{arrow[row.direction]}</span>
											{label[row.direction]}
										</td>
										<td class="c-num num">
											{row.direction === 'stay' ? '–' : row.toLadderPosition}
										</td>
										<td class="hint">{row.warning ?? ''}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="apply" use:reveal>
						{#if alreadyApplied}
							<p class="ok">Für diesen Zyklus ist der Auf-/Abstieg bereits festgeschrieben.</p>
						{:else if warnings.length > 0}
							<p class="warn">
								{warnings.length} Einträge brauchen erst eine Entscheidung (unvollständige Box oder Punktgleichheit
								an der Grenze). Solange sie offen sind, lässt sich nichts festschreiben.
							</p>
						{:else}
							<form
								method="POST"
								action="?/applyPromotions"
								use:enhance={() => {
									busy = true;
									return async ({ update }) => {
										await update();
										busy = false;
									};
								}}
							>
								<button class="btn btn-primary" type="submit" disabled={busy}>
									{busy ? 'Wird festgeschrieben …' : `${moves.length} Auf-/Abstiege festschreiben`}
								</button>
							</form>
							<p class="muted small">
								Schreibt den Beschluss fest. Die Boxen des nächsten Zyklus legst du danach selbst an
								— das passiert bewusst nicht automatisch.
							</p>
						{/if}
					</div>
				{/if}
			{/if}

			<p class="back">
				<a href="/liga/{data.league.slug}">← Zur öffentlichen Ligaseite</a>
			</p>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	h1 {
		margin-top: 18px;
	}
	.cycles-link {
		margin-top: 14px;
		font-size: 14px;
	}
	.cycles-link a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	.intro {
		margin-top: 14px;
	}
	.section-title {
		margin-top: 40px;
		font-size: clamp(22px, 2.6vw, 28px);
	}
	.warn,
	.ok {
		margin-top: 18px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 14px;
	}
	.warn {
		background: rgba(179, 65, 31, 0.1);
		color: #8f3419;
	}
	.ok {
		background: rgba(22, 163, 148, 0.12);
		color: var(--court-deep, #0f6e5c);
	}
	.callout {
		margin-top: 22px;
		padding: 16px 18px;
		border-radius: 14px;
		border: 1px solid rgba(233, 178, 60, 0.5);
		background: rgba(233, 178, 60, 0.1);
	}
	.callout h2 {
		font-size: 16px;
		margin-bottom: 6px;
	}
	.callout p {
		font-size: 14px;
		color: var(--muted-light);
	}

	.tablewrap {
		margin-top: 18px;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		min-width: 34rem;
	}
	th {
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
	td {
		padding: 9px 10px 9px 0;
		border-bottom: 1px solid var(--line-light);
	}
	.c-num {
		text-align: right;
		width: 4em;
	}
	.muted-row td {
		color: var(--muted-light);
	}
	.dir-up {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	.dir-down {
		color: #8f3419;
		font-weight: 600;
	}
	.hint {
		font-size: 12px;
		color: #7a5300;
	}

	.apply {
		margin-top: 26px;
	}
	.small {
		margin-top: 10px;
		font-size: 13px;
	}
	.back {
		margin-top: 36px;
		font-size: 14px;
	}
	.back a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
</style>
