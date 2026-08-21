<script lang="ts">
	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state(false);
	// svelte-ignore state_referenced_locally -- nur der Startwert des
	// Formularfelds, danach frei durch die Auswahl überschreibbar.
	let seasonChoice = $state<string>(data.suggestedSeasonId ?? '__new__');
</script>

<svelte:head>
	<title>Neuer Zyklus — {data.league.name} | PadelIndex</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 60ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Neuen Zyklus anlegen</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Ein Zyklus ist leer, bis du Boxen anlegst — Ergebnisse und Auf-/Abstieg beziehen sich immer
				auf genau einen Zyklus.
			</p>

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
					<label class="field-label" for="seasonChoice">Saison</label>
					<select id="seasonChoice" bind:value={seasonChoice}>
						{#each data.seasons as s (s.id)}
							<option value={s.id}>{s.name}</option>
						{/each}
						<option value="__new__">Neue Saison…</option>
					</select>
					<input
						type="hidden"
						name="seasonId"
						value={seasonChoice === '__new__' ? '' : seasonChoice}
					/>

					{#if seasonChoice === '__new__'}
						<label class="field-label" for="newSeasonName">Name der neuen Saison</label>
						<input
							id="newSeasonName"
							name="newSeasonName"
							placeholder="z. B. VI. (2025/26)"
							required
						/>
					{:else}
						<input type="hidden" name="newSeasonName" value="" />
					{/if}

					<label class="field-label" for="ordinal">Zyklusnummer</label>
					<input
						id="ordinal"
						name="ordinal"
						type="number"
						min="1"
						value={data.suggestedOrdinal}
						required
					/>

					<label class="field-label" for="name">Bezeichnung (optional)</label>
					<input id="name" name="name" placeholder="z. B. Zyklus 6" maxlength="80" />

					<div class="dates">
						<div>
							<label class="field-label" for="startDate">Start</label>
							<input id="startDate" name="startDate" type="date" required />
						</div>
						<div>
							<label class="field-label" for="endDate">Ende</label>
							<input id="endDate" name="endDate" type="date" required />
						</div>
					</div>

					<button class="btn btn-primary" type="submit" style="margin-top: 20px">
						{busy ? 'Wird angelegt …' : 'Zyklus anlegen'}
					</button>
				</fieldset>
			</form>

			<p class="back">
				<a href="/liga/{data.league.slug}/verwaltung/zyklen">← Zurück zur Zyklenliste</a>
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
		margin-bottom: 28px;
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
	input,
	select {
		padding: 10px 12px;
		border: 1px solid var(--line-light);
		border-radius: 10px;
		font-size: 14px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
	}
	.dates {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
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
