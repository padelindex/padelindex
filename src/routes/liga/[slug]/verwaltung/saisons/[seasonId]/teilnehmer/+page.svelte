<script lang="ts">
	// Saison-Assistent, Schritt 2: Teilnehmer-Pool. Toggle je Zeile ist ein
	// eigenständiger Formular-POST (kein Sammel-Submit) — robuster bei
	// vielen Zeilen und konsistent mit den übrigen Verwaltungsseiten.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state<string | null>(null);
	let candidateFilter = $state('');

	const participating = $derived(
		data.participants.filter((p) => p.status === 'active' || p.status === 'substitute')
	);
	const paused = $derived(
		data.participants.filter((p) => p.status !== 'active' && p.status !== 'substitute')
	);

	const filteredCandidates = $derived(
		candidateFilter.trim().length < 2
			? []
			: data.candidates.filter((c) =>
					c.name.toLowerCase().includes(candidateFilter.trim().toLowerCase())
				)
	);

	const statusLabel: Record<string, string> = {
		active: 'nimmt teil',
		substitute: 'Ersatz',
		waitlist: 'Warteliste',
		paused: 'pausiert',
		left: 'ausgetreten'
	};
</script>

<svelte:head>
	<title>Teilnehmer — {data.season.name} | {data.league.name}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 68ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Teilnehmer — {data.season.name}</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Schritt 2 von 4: Wer spielt in dieser Saison mit? Pausierte Spieler bleiben angemeldet,
				zählen aber nicht für die Einteilung.
			</p>

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}

			<h2 class="section-title" use:reveal>Nimmt teil ({participating.length})</h2>
			{#if participating.length === 0}
				<p class="muted">Noch niemand aktiv.</p>
			{:else}
				<ul class="plist" use:reveal>
					{#each participating as p (p.playerId)}
						<li>
							<span class="pname">{p.name}</span>
							<span class="prating num">{p.rating.toFixed(2)}</span>
							<span class="ptag">{statusLabel[p.status]}</span>
							<form
								method="POST"
								action="?/toggle"
								use:enhance={() => {
									busy = p.playerId;
									return async ({ update }) => {
										await update();
										busy = null;
									};
								}}
							>
								<input type="hidden" name="playerId" value={p.playerId} />
								<input type="hidden" name="participating" value="false" />
								<button
									class="btn btn-ghost-light small"
									type="submit"
									disabled={busy === p.playerId}
								>
									Pausieren
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<h2 class="section-title" use:reveal>Pausiert / nicht dabei ({paused.length})</h2>
			{#if paused.length === 0}
				<p class="muted">Niemand pausiert.</p>
			{:else}
				<ul class="plist" use:reveal>
					{#each paused as p (p.playerId)}
						<li>
							<span class="pname">{p.name}</span>
							<span class="prating num">{p.rating.toFixed(2)}</span>
							<span class="ptag ptag-muted">{statusLabel[p.status]}</span>
							<form
								method="POST"
								action="?/toggle"
								use:enhance={() => {
									busy = p.playerId;
									return async ({ update }) => {
										await update();
										busy = null;
									};
								}}
							>
								<input type="hidden" name="playerId" value={p.playerId} />
								<input type="hidden" name="participating" value="true" />
								<button
									class="btn btn-ghost-light small"
									type="submit"
									disabled={busy === p.playerId}
								>
									Nimmt teil
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<h2 class="section-title" use:reveal>Neuen Spieler hinzufügen</h2>
			<input
				class="search"
				type="search"
				placeholder="Name suchen … (mind. 2 Zeichen)"
				bind:value={candidateFilter}
				use:reveal
			/>
			{#if filteredCandidates.length > 0}
				<ul class="plist" use:reveal>
					{#each filteredCandidates as c (c.playerId)}
						<li>
							<span class="pname">{c.name}</span>
							<span class="prating num">{c.rating.toFixed(2)}</span>
							<form
								method="POST"
								action="?/add"
								use:enhance={() => {
									busy = c.playerId;
									return async ({ update }) => {
										await update();
										busy = null;
										candidateFilter = '';
									};
								}}
							>
								<input type="hidden" name="playerId" value={c.playerId} />
								<button class="btn btn-primary small" type="submit" disabled={busy === c.playerId}>
									Hinzufügen
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{:else if candidateFilter.trim().length >= 2}
				<p class="muted small" style="margin-top: 10px">
					Keine Treffer unter den Vereinsmitgliedern.
				</p>
			{/if}

			<div class="nav-row" use:reveal>
				<a class="back-link" href="/liga/{data.league.slug}/verwaltung">← Zurück zur Verwaltung</a>
				{#if data.canProceedToSeeding}
					<a
						class="btn btn-primary"
						href="/liga/{data.league.slug}/verwaltung/saisons/{data.season.id}/seeding"
					>
						Weiter zur Einteilung ({participating.length} Spieler) →
					</a>
				{/if}
			</div>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	h1 {
		margin-top: 18px;
	}
	.intro {
		margin-top: 14px;
		margin-bottom: 24px;
	}
	.warn {
		margin-bottom: 20px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 14px;
		background: rgba(179, 65, 31, 0.1);
		color: #8f3419;
	}
	.section-title {
		margin-top: 32px;
		font-size: clamp(18px, 2.2vw, 22px);
	}
	.plist {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.plist li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border: 1px solid var(--line-light);
		border-radius: 10px;
		font-size: 14px;
	}
	.pname {
		flex: 1;
		min-width: 0;
	}
	.prating {
		font-weight: 600;
		color: var(--court-deep, #0f6e5c);
	}
	.ptag {
		font-family: var(--mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 2px 8px;
		border-radius: 100px;
		background: rgba(22, 163, 148, 0.16);
		color: var(--court-deep, #0f6e5c);
	}
	.ptag-muted {
		background: rgba(0, 0, 0, 0.06);
		color: var(--muted-light);
	}
	.small {
		font-size: 12.5px;
	}
	.btn.small {
		padding: 7px 12px;
		font-size: 13px;
	}
	.search {
		margin-top: 14px;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--line-light);
		border-radius: 10px;
		font-size: 14px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
		box-sizing: border-box;
	}
	.nav-row {
		margin-top: 36px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}
	.back-link {
		font-size: 14px;
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
</style>
