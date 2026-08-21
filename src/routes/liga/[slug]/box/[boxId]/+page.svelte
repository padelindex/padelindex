<script lang="ts">
	// Ergebniseingabe für die eigene Box. Die Paarung je Runde steht fest
	// (Rotation) und wird deshalb angezeigt statt zur Auswahl gestellt —
	// der Server nimmt sie ohnehin aus der Rotation, nicht aus dem Formular.

	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state(false);
	let openRound = $state<string | null>(null);

	function nameOf(seat: number): string {
		return data.box.lineup.find((p) => p.seat === seat)?.name ?? '—';
	}

	const boxTitle = $derived(
		data.box.label ?? m.liga_box_label_fallback({ n: data.box.ladderPosition })
	);
</script>

<svelte:head>
	<title>{m.ligabox_title({ boxTitle, leagueName: data.league.name })}</title>
	<meta name="robots" content="noindex, follow" />
	<HreflangLinks path={page.url.pathname} />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 68ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>{boxTitle}</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				{m.ligabox_intro()}
			</p>

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}
			{#if form?.success}
				<p class="ok" role="status">
					{m.ligabox_saved()}
				</p>
			{/if}

			<ol class="rounds" use:reveal>
				{#each data.box.rounds as round (round.id)}
					{@const done = round.matchId !== null}
					<li class="round" class:done>
						<div class="round-head">
							<span class="rnum num">{m.ligabox_round_number({ n: round.roundNumber })}</span>
							{#if done && round.confirmed}
								<span class="pill">{m.ligabox_confirmed_pill()}</span>
							{:else if done}
								<span class="pill pill-open">{m.ligabox_waiting_pill()}</span>
							{/if}
						</div>

						<p class="pairing">
							<strong>{nameOf(round.team1[0])} / {nameOf(round.team1[1])}</strong>
							<em>{m.ligabox_vs()}</em>
							<strong>{nameOf(round.team2[0])} / {nameOf(round.team2[1])}</strong>
						</p>

						{#if done}
							<p class="result num">
								{round.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join('  ')}
							</p>
						{:else if openRound === round.id}
							<form
								method="POST"
								action="?/report"
								use:enhance={() => {
									busy = true;
									return async ({ update }) => {
										await update();
										busy = false;
										openRound = null;
									};
								}}
							>
								<input type="hidden" name="boxMatchId" value={round.id} />
								<fieldset disabled={busy}>
									<legend class="sr-only">{m.ligabox_sets_legend({ n: round.roundNumber })}</legend>
									{#each [1, 2, 3] as n (n)}
										<div class="setrow">
											<span class="setlabel">{m.ligabox_set_label({ n })}</span>
											<label class="sr-only" for="s{round.id}-{n}-a">
												{m.ligabox_set_sr_label({
													n,
													team1: nameOf(round.team1[0]),
													team2: nameOf(round.team1[1])
												})}
											</label>
											<input
												id="s{round.id}-{n}-a"
												name="set{n}team1"
												type="number"
												min="0"
												max="99"
												inputmode="numeric"
												placeholder="–"
											/>
											<span aria-hidden="true">:</span>
											<label class="sr-only" for="s{round.id}-{n}-b">
												{m.ligabox_set_sr_label({
													n,
													team1: nameOf(round.team2[0]),
													team2: nameOf(round.team2[1])
												})}
											</label>
											<input
												id="s{round.id}-{n}-b"
												name="set{n}team2"
												type="number"
												min="0"
												max="99"
												inputmode="numeric"
												placeholder="–"
											/>
										</div>
									{/each}
									<div class="actions">
										<button class="btn btn-primary" type="submit">
											{busy ? m.ligabox_saving() : m.ligabox_save_result()}
										</button>
										<button
											class="btn btn-ghost-light"
											type="button"
											onclick={() => (openRound = null)}
										>
											{m.ligabox_cancel()}
										</button>
									</div>
								</fieldset>
							</form>
						{:else}
							<button
								class="btn btn-ghost-light"
								type="button"
								onclick={() => (openRound = round.id)}
							>
								{m.ligabox_enter_result()}
							</button>
						{/if}
					</li>
				{/each}
			</ol>

			<p class="back">
				<a href={localizeHref(`/liga/${data.league.slug}`)}>{m.liga_back_link()}</a>
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
	}
	.warn,
	.ok {
		margin-top: 20px;
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

	.rounds {
		list-style: none;
		margin: 32px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.round {
		padding: 18px;
		border: 1px solid var(--line-light);
		border-radius: 14px;
		background: var(--chalk-2);
	}
	.round.done {
		background: transparent;
	}
	.round-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
	}
	.rnum {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.pill {
		padding: 2px 9px;
		border-radius: 100px;
		font-family: var(--mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(22, 163, 148, 0.16);
		color: var(--court-deep, #0f6e5c);
	}
	.pill-open {
		background: rgba(233, 178, 60, 0.22);
		color: #7a5300;
	}
	.pairing {
		font-size: 15px;
		margin-bottom: 12px;
	}
	.pairing em {
		font-style: normal;
		color: var(--muted-light);
		margin: 0 6px;
	}
	.result {
		font-size: 18px;
		letter-spacing: 0.04em;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}
	.setrow {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.setlabel {
		width: 5em;
		font-size: 13px;
		color: var(--muted-light);
	}
	.setrow input {
		width: 4em;
		padding: 8px;
		border: 1px solid var(--line-light);
		border-radius: 8px;
		font-family: var(--mono);
		text-align: center;
		background: #fff;
		color: var(--ink);
	}
	.actions {
		display: flex;
		gap: 10px;
		margin-top: 14px;
		flex-wrap: wrap;
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
