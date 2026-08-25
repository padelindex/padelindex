<script lang="ts">
	// Saison-Assistent, Schritt 3+4: automatischer Box-Vorschlag nach
	// Rating. Reine Anzeige — die eigentliche Drag & Drop-Korrektur
	// passiert NACH "Boxen erstellen" auf der normalen Boxen-Seite, die
	// dieses Werkzeug schon mitbringt.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state(false);
</script>

<svelte:head>
	<title>Einteilung — {data.season.name} | {data.league.name}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Einteilung — {data.season.name}</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Schritt 3 von 4: Vorschlag für Zyklus 1, nach Rating sortiert — Box 1 die stärksten Spieler.
				Nach dem Erstellen kannst du die Aufstellung auf der Boxen-Seite per Drag &amp; Drop
				korrigieren, bevor du die Saison veröffentlichst.
			</p>

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}

			{#if data.participantCount < data.boxSize}
				<p class="warn" role="alert">
					Nur {data.participantCount} aktive Teilnehmer — mindestens {data.boxSize} nötig. Geh zurück
					zum Teilnehmer-Schritt und aktiviere mehr Spieler.
				</p>
			{:else}
				<div class="boxes" use:reveal>
					{#each data.groups as box (box.ladderPosition)}
						<article class="box">
							<h3>Box {box.ladderPosition}</h3>
							<ul>
								{#each box.members as m (m.playerId)}
									<li>
										<span class="seat num">{m.seat}</span>
										<span class="pname">{m.name}</span>
										{#if m.role === 'substitute'}<span class="sub">Ersatz</span>{/if}
									</li>
								{/each}
							</ul>
						</article>
					{/each}
				</div>

				<form
					method="POST"
					use:enhance={() => {
						busy = true;
						return async ({ update }) => {
							await update();
							busy = false;
						};
					}}
					style="margin-top: 24px"
				>
					<button class="btn btn-primary" type="submit" disabled={busy}>
						{busy ? 'Wird angelegt …' : `${data.groups.length} Boxen erstellen →`}
					</button>
				</form>
			{/if}

			<p class="back">
				<a href="/liga/{data.league.slug}/verwaltung/saisons/{data.season.id}/teilnehmer">
					← Zurück zu den Teilnehmern
				</a>
			</p>
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
	.boxes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}
	.box {
		padding: 16px;
		border: 1px solid var(--line-light);
		border-radius: 14px;
		background: var(--chalk-2);
	}
	.box h3 {
		font-size: 15px;
		margin-bottom: 10px;
	}
	.box ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.box li {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13.5px;
	}
	.seat {
		width: 1.4em;
		color: var(--muted-light);
	}
	.pname {
		flex: 1;
	}
	.sub {
		padding: 1px 6px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.07);
		font-size: 10px;
		color: var(--muted-light);
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
