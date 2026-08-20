<script lang="ts">
	// Warteliste & Austritt mitten im Zyklus. Der "Nächstbeste von der
	// Warteliste" ist als Vorschlag vorausgewählt (älteste Anmeldung zuerst,
	// siehe league-admin.ts listWaitlist), aber änderbar oder ganz
	// weglassbar — kein automatischer Schritt ohne Bestätigung, gleiche
	// Regel wie beim Auf-/Abstieg.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const NAV = [
		{ href: '/#problem', label: 'Warum' },
		{ href: '/rating', label: 'Rating' },
		{ href: '/#tokens', label: 'Tokens' },
		{ href: '/vereine', label: 'Für Vereine' }
	];

	let busy = $state(false);
	let openFor = $state<string | null>(null);

	const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	function fmtDate(iso: string): string {
		return dateFmt.format(new Date(iso));
	}
</script>

<svelte:head>
	<title>Warteliste &amp; Austritt — {data.league.name} | PadelIndex</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={NAV} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Warteliste &amp; Austritt</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Verlässt jemand die Liga mitten im Zyklus, rückt hier der Sitz frei — mit oder ohne
				sofortigen Ersatz von der Warteliste. Bereits gespielte Runden bleiben davon unberührt.
			</p>

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}
			{#if form?.success}
				<p class="ok" role="status">
					{form.replaced ? 'Austritt gespeichert, Ersatz eingesetzt.' : 'Austritt gespeichert, Sitz ist frei.'}
				</p>
			{/if}

			<h2 class="section-title" use:reveal>Warteliste</h2>
			{#if data.waitlist.length === 0}
				<p class="muted">Niemand wartet aktuell.</p>
			{:else}
				<ol class="waitlist" use:reveal>
					{#each data.waitlist as w, i (w.playerId)}
						<li>
							<span class="wpos num">{i + 1}.</span>
							<span class="wname">{w.name}</span>
							<span class="wdate muted num">seit {fmtDate(w.joinedAt)}</span>
						</li>
					{/each}
				</ol>
			{/if}

			<h2 class="section-title" use:reveal>Aktuelle Boxen</h2>
			{#if !data.cycle}
				<p class="muted">Kein laufender Zyklus.</p>
			{:else if data.boxes.length === 0}
				<p class="muted">Noch keine Boxen in diesem Zyklus.</p>
			{:else}
				<div class="boxes" use:reveal>
					{#each data.boxes as box (box.id)}
						<article class="box">
							<h3>{box.label ?? `Box ${box.ladderPosition}`}</h3>
							<ul class="members">
								{#each box.lineup as p (p.playerId)}
									<li>
										<span class="mseat num">{p.seat}</span>
										<span class="mname">
											{p.name}
											{#if p.role === 'substitute'}<span class="tag">Ersatz</span>{/if}
										</span>

										{#if openFor === p.playerId}
											<form
												method="POST"
												action="?/depart"
												class="depart-form"
												use:enhance={() => {
													busy = true;
													return async ({ update }) => {
														await update();
														busy = false;
														openFor = null;
													};
												}}
											>
												<input type="hidden" name="departingPlayerId" value={p.playerId} />
												<label class="sr-only" for="replacement-{p.playerId}">
													Ersatz für {p.name}
												</label>
												<select id="replacement-{p.playerId}" name="replacementPlayerId">
													<option value="">Kein Ersatz — Sitz bleibt frei</option>
													{#each data.waitlist as w (w.playerId)}
														<option value={w.playerId}>{w.name} (seit {fmtDate(w.joinedAt)})</option>
													{/each}
												</select>
												<div class="depart-actions">
													<button class="btn btn-primary" type="submit" disabled={busy}>
														{busy ? 'Wird gespeichert …' : 'Austritt bestätigen'}
													</button>
													<button
														class="btn btn-ghost-light"
														type="button"
														onclick={() => (openFor = null)}
													>
														Abbrechen
													</button>
												</div>
											</form>
										{:else}
											<button
												class="btn btn-ghost-light small"
												type="button"
												onclick={() => (openFor = p.playerId)}
											>
												Austritt
											</button>
										{/if}
									</li>
								{/each}
							</ul>
						</article>
					{/each}
				</div>
			{/if}

			<p class="back">
				<a href="/liga/{data.league.slug}/verwaltung">← Zur Liga-Verwaltung</a>
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
	.section-title {
		margin-top: 40px;
		font-size: clamp(20px, 2.4vw, 26px);
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

	.waitlist {
		list-style: none;
		margin: 16px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.waitlist li {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 10px 14px;
		border: 1px solid var(--line-light);
		border-radius: 10px;
		font-size: 14px;
	}
	.wpos {
		color: var(--muted-light);
		width: 1.6em;
	}
	.wname {
		flex: 1;
	}
	.wdate {
		font-size: 12px;
	}

	.boxes {
		margin-top: 16px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}
	.box {
		padding: 16px;
		border: 1px solid var(--line-light);
		border-radius: 14px;
		background: var(--chalk-2);
	}
	.box h3 {
		font-size: 16px;
		margin-bottom: 10px;
	}
	.members {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.members li {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-size: 14px;
		padding: 6px 0;
		border-top: 1px solid var(--line-light);
	}
	.members li:first-child {
		border-top: none;
	}
	.mseat {
		color: var(--muted-light);
		width: 1.4em;
	}
	.mname {
		flex: 1 1 auto;
		min-width: 0;
	}
	.tag {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 100px;
		font-family: var(--mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(233, 178, 60, 0.22);
		color: #7a5300;
	}
	.small {
		font-size: 12.5px;
		padding: 7px 14px;
	}

	.depart-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 4px;
		padding: 10px;
		border-radius: 10px;
		background: rgba(179, 65, 31, 0.06);
	}
	.depart-form select {
		padding: 8px;
		border: 1px solid var(--line-light);
		border-radius: 8px;
		font-size: 13px;
		background: #fff;
		color: var(--ink);
	}
	.depart-actions {
		display: flex;
		gap: 8px;
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
