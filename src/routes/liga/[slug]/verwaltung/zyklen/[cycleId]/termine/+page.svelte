<script lang="ts">
	// Termin- & Platzverwaltung nach der 6-Wochen-Regel: Woche 1-N zeigt
	// nur den Status (eigenständig vereinbart oder noch offen) plus eine
	// Erinnerungsfunktion, Woche N+1 an übernimmt die Admin-Vergabe. Ein
	// von einem Spieler nachgereichter Termin, der einen Admin-Slot
	// verdrängt, taucht als "wird frei" auf.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state<string | null>(null);
	let assignOpenFor = $state<string | null>(null);

	const dateTimeFmt = new Intl.DateTimeFormat('de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
	function fmt(iso: string): string {
		return dateTimeFmt.format(new Date(iso));
	}

	function nameOf(box: PageData['boxes'][number], seat: number): string {
		return box.lineup.find((p) => p.seat === seat)?.name ?? '—';
	}

	function openRoundsCount(box: PageData['boxes'][number]): number {
		return box.rounds.filter((r) => r.status === 'scheduled' && !r.scheduledAt).length;
	}
</script>

<svelte:head>
	<title>Termine — {data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`} | {data.league.name}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>
				Termine &amp; Plätze — {data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`}
			</h1>

			<div class="phase" use:reveal={{ delay: 0.08 }}>
				{#if data.phase === 'self_service'}
					<strong>Eigenverantwortliche Terminfindung.</strong> Spieler vereinbaren ihre Termine
					selbst über ihre Box-Seite. Ab Woche {data.league.config.selfServiceWeeks + 1} vergibt der Admin
					die restlichen offenen Runden.
				{:else}
					<strong>Admin-Terminvergabe.</strong> Vergib Platz &amp; Zeit für die verbliebenen offenen Runden
					— Spieler können weiterhin selbst einen Termin nachreichen.
				{/if}
			</div>

			{#if data.phase === 'self_service' && data.boxes.some((b) => openRoundsCount(b) > 0)}
				<form
					method="POST"
					action="?/remindAll"
					use:enhance={() => {
						busy = 'remindAll';
						return async ({ update }) => {
							await update();
							busy = null;
						};
					}}
					style="margin-top: 14px"
				>
					<button class="btn btn-ghost-light" type="submit" disabled={busy === 'remindAll'}>
						{busy === 'remindAll' ? 'Wird gesendet …' : 'Alle offenen Boxen erinnern'}
					</button>
				</form>
			{/if}

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}
			{#if form?.success && (form.action === 'remind' || form.action === 'remindAll')}
				<p class="ok" role="status">Erinnerung an {form.count} Spieler gesendet.</p>
			{:else if form?.success}
				<p class="ok" role="status">Gespeichert.</p>
			{/if}

			{#if data.boxes.length === 0}
				<p class="muted">Noch keine Boxen in diesem Zyklus.</p>
			{:else}
				<div class="boxes" use:reveal>
					{#each data.boxes as box (box.id)}
						<article class="box">
							<header>
								<h3>{box.label ?? `Box ${box.ladderPosition}`}</h3>
								{#if data.phase === 'self_service' && openRoundsCount(box) > 0}
									<form
										method="POST"
										action="?/remind"
										use:enhance={() => {
											busy = `remind-${box.id}`;
											return async ({ update }) => {
												await update();
												busy = null;
											};
										}}
									>
										<input type="hidden" name="boxId" value={box.id} />
										<button
											class="btn btn-ghost-light small"
											type="submit"
											disabled={busy === `remind-${box.id}`}
										>
											Erinnerung senden ({openRoundsCount(box)})
										</button>
									</form>
								{/if}
							</header>

							<ul class="rounds">
								{#each box.rounds as round (round.id)}
									<li class="round">
										<div class="round-line">
											<span class="rnum num">R{round.roundNumber}</span>
											<span class="pairing">
												{nameOf(box, round.team1[0])}/{nameOf(box, round.team1[1])} vs.
												{nameOf(box, round.team2[0])}/{nameOf(box, round.team2[1])}
											</span>
										</div>

										{#if round.status !== 'scheduled'}
											<p class="muted small">
												bereits {round.status === 'played' ? 'gespielt' : round.status}
											</p>
										{:else if round.scheduledAt}
											<p class="slot">
												{fmt(round.scheduledAt)}{#if round.court}· {round.court}{/if}
												<span class="tag" class:tag-admin={round.assignedByAdmin}>
													{round.assignedByAdmin
														? 'vom Admin'
														: `von ${round.scheduledByName ?? 'Spieler'}`}
												</span>
											</p>

											{#if round.previousScheduledAt}
												<div class="freed">
													<p>
														Ursprünglicher Slot wird frei: <strong
															>{fmt(round.previousScheduledAt)}</strong
														>
														{#if round.previousCourt}· {round.previousCourt}{/if}
													</p>
													<div class="actions">
														<form
															method="POST"
															action="?/resolveFreed"
															use:enhance={() => {
																busy = `freed-${round.id}`;
																return async ({ update }) => {
																	await update();
																	busy = null;
																};
															}}
														>
															<input type="hidden" name="boxMatchId" value={round.id} />
															<input type="hidden" name="decision" value="confirm" />
															<button
																class="btn btn-ghost-light small"
																type="submit"
																disabled={busy === `freed-${round.id}`}
															>
																Freigabe bestätigen
															</button>
														</form>
														<form
															method="POST"
															action="?/resolveFreed"
															use:enhance={() => {
																busy = `freed-${round.id}`;
																return async ({ update }) => {
																	await update();
																	busy = null;
																};
															}}
														>
															<input type="hidden" name="boxMatchId" value={round.id} />
															<input type="hidden" name="decision" value="reject" />
															<button
																class="btn btn-ghost-light small"
																type="submit"
																disabled={busy === `freed-${round.id}`}
															>
																alten Termin behalten
															</button>
														</form>
													</div>
												</div>
											{/if}
										{:else}
											<p class="muted small">noch offen</p>
										{/if}

										{#if round.status === 'scheduled' && data.phase === 'admin_assignment'}
											{#if assignOpenFor === round.id}
												<form
													method="POST"
													action="?/assign"
													class="inline-form"
													use:enhance={() => {
														busy = round.id;
														return async ({ update }) => {
															await update();
															busy = null;
															assignOpenFor = null;
														};
													}}
												>
													<input type="hidden" name="boxMatchId" value={round.id} />
													<input type="hidden" name="boxId" value={box.id} />
													<fieldset disabled={busy === round.id}>
														<div class="row">
															<input type="date" name="scheduledDate" required />
															<input type="time" name="scheduledTime" value="18:00" />
															<input
																type="text"
																name="court"
																placeholder="Platz (optional)"
																maxlength="40"
															/>
														</div>
														<div class="actions" style="margin-top: 8px">
															<button class="btn btn-primary small" type="submit">
																{busy === round.id ? 'Wird gespeichert …' : 'Vergeben'}
															</button>
															<button
																class="btn btn-ghost-light small"
																type="button"
																onclick={() => (assignOpenFor = null)}
															>
																Abbrechen
															</button>
														</div>
													</fieldset>
												</form>
											{:else}
												<button
													class="btn btn-ghost-light small"
													type="button"
													onclick={() => (assignOpenFor = round.id)}
												>
													Termin vergeben
												</button>
											{/if}
										{/if}
									</li>
								{/each}
							</ul>
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
	h1 {
		margin-top: 18px;
	}
	.phase {
		margin-top: 16px;
		padding: 12px 16px;
		border-radius: 12px;
		background: rgba(22, 163, 148, 0.1);
		font-size: 14px;
		line-height: 1.5;
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

	.boxes {
		margin-top: 20px;
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
	.box header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
	}
	.box h3 {
		font-size: 17px;
		margin: 0;
	}

	.rounds {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.round {
		padding: 10px;
		border-radius: 10px;
		background: #fff;
		border: 1px solid var(--line-light);
	}
	.round-line {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 4px;
	}
	.rnum {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--muted-light);
	}
	.pairing {
		font-size: 13px;
	}
	.slot {
		font-size: 13.5px;
		margin: 4px 0;
	}
	.small {
		font-size: 12.5px;
	}
	.tag {
		margin-left: 6px;
		padding: 1px 7px;
		border-radius: 100px;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: rgba(0, 0, 0, 0.07);
		color: var(--muted-light);
	}
	.tag-admin {
		background: rgba(56, 84, 176, 0.12);
		color: #3854b0;
	}

	.freed {
		margin-top: 8px;
		padding: 10px;
		border-radius: 10px;
		background: rgba(233, 178, 60, 0.14);
		font-size: 13px;
	}
	.freed p {
		margin: 0 0 8px;
	}

	.actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.btn.small {
		padding: 7px 12px;
		font-size: 13px;
	}

	.inline-form {
		margin-top: 8px;
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.row input {
		flex: 1 1 8em;
		padding: 7px 9px;
		border: 1px solid var(--line-light);
		border-radius: 8px;
		font-size: 13px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
		box-sizing: border-box;
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
