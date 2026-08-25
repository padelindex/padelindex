<script lang="ts">
	// Saison-Assistent, Schritt 1: Name + geplante Zyklenzahl. Eine
	// bestehende aktive Saison wird beim Absenden automatisch archiviert
	// — das Formular macht das vorher transparent, statt es zu verstecken.

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
	<title>Neue Saison — {data.league.name} | PadelIndex</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 60ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Neue Saison starten</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Schritt 1 von 4: Name der Saison und geplante Zyklenzahl. Im nächsten Schritt legst du fest,
				wer teilnimmt.
			</p>

			{#if data.currentSeason}
				<div class="callout" use:reveal>
					<h2>„{data.currentSeason.name}" wird archiviert</h2>
					<p>
						Die aktuell aktive Saison wird beim Anlegen der neuen automatisch archiviert — ihre
						Daten bleiben für die Historie erhalten, verschwinden aber aus dem aktiven Dashboard.
					</p>
				</div>
			{/if}

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update();
						busy = false;
					};
				}}
			>
				<fieldset disabled={busy}>
					<label class="field-label" for="name">Name der neuen Saison</label>
					<input
						id="name"
						name="name"
						placeholder="z. B. Sommer-Saison 2026"
						required
						maxlength="120"
					/>

					<label class="field-label" for="plannedCycles">Geplante Anzahl Zyklen (optional)</label>
					<input
						id="plannedCycles"
						name="plannedCycles"
						type="number"
						min="1"
						placeholder="z. B. 6"
					/>

					<button class="btn btn-primary" type="submit" style="margin-top: 20px">
						{busy ? 'Wird angelegt …' : 'Weiter zu den Teilnehmern →'}
					</button>
				</fieldset>
			</form>

			<p class="back">
				<a href="/liga/{data.league.slug}/verwaltung">← Zurück zur Verwaltung</a>
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
	.callout {
		margin-bottom: 24px;
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
	.warn {
		margin-bottom: 20px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 14px;
		background: rgba(179, 65, 31, 0.1);
		color: #8f3419;
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}
	.field-label {
		font-size: 13px;
		font-weight: 600;
		margin: 16px 0 6px;
	}
	.field-label:first-of-type {
		margin-top: 0;
	}
	input {
		padding: 10px 12px;
		border: 1px solid var(--line-light);
		border-radius: 10px;
		font-size: 14px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
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
