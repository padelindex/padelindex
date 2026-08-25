<script lang="ts">
	// Ergebnis-Verwaltung für den Admin: eintragen/korrigieren, Walkover,
	// Abbruch mit Teilsätzen, Zurücksetzen. Ergänzt das Selbst-Melden der
	// Spieler (box/[boxId]) — die dortige Route bleibt unverändert.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state<string | null>(null);
	let openAction = $state<Record<string, 'result' | 'abandoned' | 'walkover' | null>>({});

	function nameOf(box: PageData['boxes'][number], seat: number): string {
		return box.lineup.find((p) => p.seat === seat)?.name ?? '—';
	}

	function toggle(roundId: string, mode: 'result' | 'abandoned' | 'walkover') {
		openAction[roundId] = openAction[roundId] === mode ? null : mode;
	}

	const statusLabel: Record<string, string> = {
		scheduled: 'offen',
		played: 'gespielt',
		abandoned: 'abgebrochen',
		walkover: 'Walkover',
		cancelled: 'storniert'
	};
</script>

<svelte:head>
	<title
		>Ergebnisse — {data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`} | {data.league.name}</title
	>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>
				Ergebnisse — {data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`}
			</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Eintragen, korrigieren, Walkover oder Abbruch werten. Ein Ergebnis lässt sich nur ändern,
				solange es noch nicht ins Rating eingeflossen ist (48h-Frist wie beim Selbst-Melden).
			</p>

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}
			{#if form?.success}
				<p class="ok" role="status">Gespeichert.</p>
			{/if}

			{#if data.boxes.length === 0}
				<p class="muted">Noch keine Boxen in diesem Zyklus.</p>
			{:else}
				<div class="boxes" use:reveal>
					{#each data.boxes as box (box.id)}
						<article class="box">
							<h3>{box.label ?? `Box ${box.ladderPosition}`}</h3>
							<ol class="rounds">
								{#each box.rounds as round (round.id)}
									<li class="round">
										<div class="round-head">
											<span class="rnum num">Runde {round.roundNumber}</span>
											<span
												class="pill"
												class:pill-open={round.status === 'scheduled'}
												class:pill-warn={round.status === 'walkover' ||
													round.status === 'abandoned'}
											>
												{statusLabel[round.status]}
											</span>
										</div>
										<p class="pairing">
											<strong>{nameOf(box, round.team1[0])} / {nameOf(box, round.team1[1])}</strong>
											<em>vs.</em>
											<strong>{nameOf(box, round.team2[0])} / {nameOf(box, round.team2[1])}</strong>
										</p>

										{#if round.status === 'played' || round.status === 'abandoned'}
											<p class="result num">
												{round.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join('  ')}
												{#if round.note}<span class="note">· {round.note}</span>{/if}
											</p>
											{#if round.isReplacement}
												<p class="muted small" style="margin: 2px 0 0">mit Ersatzspieler</p>
											{/if}
											{#if !round.confirmed}
												<p class="muted small" style="margin: 6px 0 0">
													Noch nicht gewertet — Korrektur oder Zurücksetzen möglich.
												</p>
												<div class="actions">
													<button
														class="btn btn-ghost-light small"
														type="button"
														onclick={() =>
															toggle(
																round.id,
																round.status === 'abandoned' ? 'abandoned' : 'result'
															)}
													>
														Korrigieren
													</button>
													<form
														method="POST"
														action="?/reset"
														use:enhance={() => {
															busy = round.id;
															return async ({ update }) => {
																await update();
																busy = null;
															};
														}}
													>
														<input type="hidden" name="boxMatchId" value={round.id} />
														<button
															class="link-btn danger"
															type="submit"
															disabled={busy === round.id}
														>
															zurücksetzen
														</button>
													</form>
												</div>
											{:else}
												<p class="muted small" style="margin: 6px 0 0">
													Gewertet — keine Korrektur mehr möglich.
												</p>
											{/if}
										{:else if round.status === 'walkover'}
											<p class="result">
												Team {round.winnerTeam} gewinnt kampflos
												{#if round.note}<span class="note">· {round.note}</span>{/if}
											</p>
											<form
												method="POST"
												action="?/reset"
												use:enhance={() => {
													busy = round.id;
													return async ({ update }) => {
														await update();
														busy = null;
													};
												}}
											>
												<input type="hidden" name="boxMatchId" value={round.id} />
												<button class="link-btn danger" type="submit" disabled={busy === round.id}>
													zurücksetzen
												</button>
											</form>
										{:else if round.status === 'scheduled'}
											<div class="actions">
												<button
													class="btn btn-ghost-light small"
													type="button"
													onclick={() => toggle(round.id, 'result')}
												>
													Ergebnis eintragen
												</button>
												<button
													class="btn btn-ghost-light small"
													type="button"
													onclick={() => toggle(round.id, 'walkover')}
												>
													Walkover
												</button>
												<button
													class="btn btn-ghost-light small"
													type="button"
													onclick={() => toggle(round.id, 'abandoned')}
												>
													Abbruch
												</button>
											</div>
										{:else}
											<p class="muted small">storniert</p>
										{/if}

										{#if openAction[round.id] === 'result' || openAction[round.id] === 'abandoned'}
											{@const isAbandoned = openAction[round.id] === 'abandoned'}
											<form
												method="POST"
												action="?/report"
												class="inline-form"
												use:enhance={() => {
													busy = round.id;
													return async ({ update }) => {
														await update();
														busy = null;
														openAction[round.id] = null;
													};
												}}
											>
												<input type="hidden" name="boxMatchId" value={round.id} />
												<input type="hidden" name="boxId" value={box.id} />
												<input
													type="hidden"
													name="status"
													value={isAbandoned ? 'abandoned' : 'played'}
												/>
												<input type="hidden" name="team1seat1" value={round.team1[0]} />
												<input type="hidden" name="team1seat2" value={round.team1[1]} />
												<input type="hidden" name="team2seat1" value={round.team2[0]} />
												<input type="hidden" name="team2seat2" value={round.team2[1]} />
												<fieldset disabled={busy === round.id}>
													<legend class="sr-only">
														{isAbandoned ? 'Teilsätze bei Abbruch' : 'Sätze'}
													</legend>
													{#each [1, 2, 3] as n (n)}
														<div class="setrow">
															<span class="setlabel">Satz {n}</span>
															<input
																name="set{n}team1"
																type="number"
																min="0"
																max="99"
																inputmode="numeric"
																placeholder="–"
															/>
															<span aria-hidden="true">:</span>
															<input
																name="set{n}team2"
																type="number"
																min="0"
																max="99"
																inputmode="numeric"
																placeholder="–"
															/>
														</div>
													{/each}
													{#if isAbandoned}
														<label class="field-label" for="note-{round.id}">Grund (optional)</label
														>
														<input
															id="note-{round.id}"
															name="note"
															maxlength="160"
															placeholder="z. B. Verletzung im 2. Satz"
														/>
													{/if}
													<div class="actions" style="margin-top: 10px">
														<button class="btn btn-primary" type="submit">
															{busy === round.id ? 'Wird gespeichert …' : 'Speichern'}
														</button>
														<button
															class="btn btn-ghost-light"
															type="button"
															onclick={() => (openAction[round.id] = null)}
														>
															Abbrechen
														</button>
													</div>
												</fieldset>
											</form>
										{:else if openAction[round.id] === 'walkover'}
											<form
												method="POST"
												action="?/walkover"
												class="inline-form"
												use:enhance={() => {
													busy = round.id;
													return async ({ update }) => {
														await update();
														busy = null;
														openAction[round.id] = null;
													};
												}}
											>
												<input type="hidden" name="boxMatchId" value={round.id} />
												<fieldset disabled={busy === round.id}>
													<label class="field-label" for="winner-{round.id}">Siegendes Team</label>
													<select id="winner-{round.id}" name="winnerTeam" required>
														<option value="1">
															{nameOf(box, round.team1[0])} / {nameOf(box, round.team1[1])}
														</option>
														<option value="2">
															{nameOf(box, round.team2[0])} / {nameOf(box, round.team2[1])}
														</option>
													</select>
													<label class="field-label" for="wo-note-{round.id}"
														>Grund (optional)</label
													>
													<input
														id="wo-note-{round.id}"
														name="note"
														maxlength="160"
														placeholder="z. B. Team nicht angetreten"
													/>
													<div class="actions" style="margin-top: 10px">
														<button class="btn btn-primary" type="submit">
															{busy === round.id ? 'Wird gespeichert …' : 'Als Walkover werten'}
														</button>
														<button
															class="btn btn-ghost-light"
															type="button"
															onclick={() => (openAction[round.id] = null)}
														>
															Abbrechen
														</button>
													</div>
												</fieldset>
											</form>
										{/if}
									</li>
								{/each}
							</ol>
						</article>
					{/each}
				</div>
			{/if}

			<p class="back">
				<a href="/liga/{data.league.slug}/verwaltung/zyklen/{data.cycle.id}"
					>← Zurück zu den Boxen</a
				>
			</p>
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
	.intro {
		margin-top: 14px;
		margin-bottom: 28px;
	}
	.warn,
	.ok {
		margin-bottom: 20px;
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

	.boxes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 18px;
	}
	.box {
		padding: 18px;
		border: 1px solid var(--line-light);
		border-radius: 16px;
		background: var(--chalk-2);
	}
	.box h3 {
		font-size: 17px;
		margin-bottom: 12px;
	}

	.rounds {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.round {
		padding: 12px;
		border-radius: 12px;
		background: #fff;
		border: 1px solid var(--line-light);
	}
	.round-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}
	.rnum {
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted-light);
	}
	.pill {
		padding: 2px 9px;
		border-radius: 100px;
		font-family: var(--mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(0, 0, 0, 0.07);
		color: var(--muted-light);
	}
	.pill-open {
		background: rgba(233, 178, 60, 0.22);
		color: #7a5300;
	}
	.pill-warn {
		background: rgba(179, 65, 31, 0.12);
		color: #8f3419;
	}
	.pairing {
		font-size: 14px;
		margin-bottom: 6px;
	}
	.pairing em {
		font-style: normal;
		color: var(--muted-light);
		margin: 0 6px;
	}
	.result {
		font-size: 15px;
		margin-bottom: 4px;
	}
	.note {
		color: var(--muted-light);
		font-size: 12.5px;
	}
	.small {
		font-size: 12.5px;
	}

	.actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 6px;
	}
	.btn.small {
		padding: 7px 12px;
		font-size: 13px;
	}
	.link-btn {
		background: none;
		border: none;
		padding: 0;
		font-size: 12px;
		color: var(--muted-light);
		text-decoration: underline;
		cursor: pointer;
	}
	.link-btn.danger {
		color: #8f3419;
	}

	.inline-form {
		margin-top: 10px;
		padding: 10px;
		border-radius: 10px;
		background: var(--chalk-2);
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}
	.field-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		margin: 8px 0 5px;
	}
	.inline-form input,
	.inline-form select {
		width: 100%;
		padding: 8px 10px;
		border: 1px solid var(--line-light);
		border-radius: 8px;
		font-size: 13px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
		box-sizing: border-box;
	}
	.setrow {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}
	.setlabel {
		width: 4.5em;
		font-size: 12.5px;
		color: var(--muted-light);
	}
	.setrow input {
		width: 4em;
		text-align: center;
		font-family: var(--mono);
	}

	.back {
		margin-top: 32px;
		font-size: 14px;
	}
	.back a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
</style>
