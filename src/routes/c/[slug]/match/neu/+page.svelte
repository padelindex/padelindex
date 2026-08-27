<script lang="ts">
	import { enhance } from '$app/forms';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import { MATCH_TYPES, matchTypeLabels } from '$lib/match-report';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let partnerName = $state('');
	let opponent1Name = $state('');
	let opponent2Name = $state('');
	let partnerEmail = $state('');
	let opponent1Email = $state('');
	let opponent2Email = $state('');
	let setCount = $state(2);
	let busy = $state(false);
	let challengeId = $state('');
	let matchType = $state<(typeof MATCH_TYPES)[number]>('freizeit');

	// Eine gemeldete Challenge IST ein Challenge-Match — den Typ deshalb
	// automatisch mitziehen, statt sich darauf zu verlassen, dass beides
	// von Hand zusammenpasst.
	$effect(() => {
		if (challengeId) matchType = 'padelindex_challenge';
	});

	const today = new Date().toISOString().slice(0, 10);
	const norm = (s: string) => s.trim().toLowerCase();

	// Kader-Optionen für ein Feld: die anderen beiden Positionen werden über
	// ihren aktuell eingetippten TEXT ausgeschlossen, nicht über eine
	// aufgelöste ID — sonst hinge jedes der drei Felder zirkulär von den
	// beiden anderen ab (partnerId bräuchte opponent1Id/opponent2Id für den
	// Ausschluss, die wiederum partnerId brauchen). Namensdopplungen im
	// Kader (z. B. zwei unbeanspruchte Profile, beide aus Datenschutzgründen
	// als "Max K." angezeigt) werden mit dem Handle disambiguiert.
	function optionsFor(excludeNames: string[]) {
		const excluded = excludeNames.map(norm).filter(Boolean);
		const available = data.roster.filter(
			(p) => p.id !== data.me && !excluded.includes(norm(p.name))
		);
		const nameCounts = new Map<string, number>();
		for (const p of available) nameCounts.set(p.name, (nameCounts.get(p.name) ?? 0) + 1);
		return available.map((p) => ({
			id: p.id,
			label: (nameCounts.get(p.name) ?? 0) > 1 ? `${p.name} (@${p.handle})` : p.name
		}));
	}

	// Exakter (case-insensitive) Treffer gegen die Optionen dieses Felds ->
	// vorhandene Spieler-ID. Kein Treffer heißt: neuer Shadow-Profil-Spieler
	// (die eigentliche, tippfehlertolerante Deduplizierung läuft serverseitig
	// in resolveMatchPlayerSlots, siehe matches.ts).
	function resolveId(text: string, options: { id: string; label: string }[]) {
		return options.find((o) => norm(o.label) === norm(text))?.id ?? '';
	}

	let partnerOptions = $derived(optionsFor([opponent1Name, opponent2Name]));
	let opponent1Options = $derived(optionsFor([partnerName, opponent2Name]));
	let opponent2Options = $derived(optionsFor([partnerName, opponent1Name]));

	let partnerId = $derived(resolveId(partnerName, partnerOptions));
	let opponent1Id = $derived(resolveId(opponent1Name, opponent1Options));
	let opponent2Id = $derived(resolveId(opponent2Name, opponent2Options));

	let partnerIsNew = $derived(partnerName.trim().length > 0 && !partnerId);
	let opponent1IsNew = $derived(opponent1Name.trim().length > 0 && !opponent1Id);
	let opponent2IsNew = $derived(opponent2Name.trim().length > 0 && !opponent2Id);
</script>

<svelte:head>
	<title>Match melden — {data.club.name} — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav>
	<a class="btn btn-ghost" href="/konto">Mein Konto</a>
</MinimalNav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 560px">
		<div class="sec-head">
			<span class="eyebrow">{data.club.name}</span>
			<h2>Match melden</h2>
			<p class="muted">
				Du + Partner gegen zwei Gegner. Dein Ergebnis gilt als bestätigt, sobald einer der beiden
				Gegner zustimmt — oder automatisch nach 48 Stunden.
			</p>
		</div>

		<div class="card">
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
				<label for="playedAt">Datum</label>
				<input
					id="playedAt"
					type="date"
					name="playedAt"
					value={data.prefillDate}
					max={today}
					required
				/>

				<label for="matchType">Match-Typ</label>
				<select id="matchType" name="matchType" required bind:value={matchType}>
					{#each MATCH_TYPES as t (t)}
						<option value={t}>{matchTypeLabels()[t]}</option>
					{/each}
				</select>

				{#if data.openChallenges.length > 0}
					<label for="challengeId">Ergebnis einer Challenge?</label>
					<select id="challengeId" name="challengeId" bind:value={challengeId}>
						<option value="">Nein, normales Match</option>
						{#each data.openChallenges as c (c.id)}
							<option value={c.id}>Challenge gegen {c.counterpartName}</option>
						{/each}
					</select>
					{#if challengeId}
						<p class="note">
							Die Challenge wird abgeschlossen, sobald ein Gegner das Ergebnis bestätigt — erst dann
							wird ihr Challenge-Platz wieder frei.
						</p>
					{/if}
				{/if}

				<label for="partnerNameInput">
					Dein Partner
					{#if partnerIsNew}<span class="badge-new">Neuer Spieler</span>{/if}
				</label>
				<input
					id="partnerNameInput"
					name="partnerName"
					list="partner-options"
					bind:value={partnerName}
					placeholder="Name eingeben oder auswählen…"
					autocomplete="off"
					required
				/>
				<datalist id="partner-options">
					{#each partnerOptions as p (p.id)}
						<option value={p.label}></option>
					{/each}
				</datalist>
				<input type="hidden" name="partnerId" value={partnerId} />
				{#if partnerIsNew}
					<input
						class="email-field"
						name="partnerEmail"
						type="email"
						bind:value={partnerEmail}
						placeholder="E-Mail (optional) — für die Einladung"
					/>
					<p class="note">
						Legt ein neues, unbeanspruchtes Profil ("Schatten-Profil") an — es zählt für die
						Rangliste, sobald das Match bestätigt ist.
						{#if partnerEmail}Wir schicken direkt eine Einladung per E-Mail.{/if}
					</p>
				{/if}

				<div class="pair">
					<div>
						<label for="opponent1NameInput">
							Gegner 1
							{#if opponent1IsNew}<span class="badge-new">Neuer Spieler</span>{/if}
						</label>
						<input
							id="opponent1NameInput"
							name="opponent1Name"
							list="opponent1-options"
							bind:value={opponent1Name}
							placeholder="Name eingeben oder auswählen…"
							autocomplete="off"
							required
						/>
						<datalist id="opponent1-options">
							{#each opponent1Options as p (p.id)}
								<option value={p.label}></option>
							{/each}
						</datalist>
						<input type="hidden" name="opponent1Id" value={opponent1Id} />
						{#if opponent1IsNew}
							<input
								class="email-field"
								name="opponent1Email"
								type="email"
								bind:value={opponent1Email}
								placeholder="E-Mail (optional)"
							/>
						{/if}
					</div>
					<div>
						<label for="opponent2NameInput">
							Gegner 2
							{#if opponent2IsNew}<span class="badge-new">Neuer Spieler</span>{/if}
						</label>
						<input
							id="opponent2NameInput"
							name="opponent2Name"
							list="opponent2-options"
							bind:value={opponent2Name}
							placeholder="Name eingeben oder auswählen…"
							autocomplete="off"
							required
						/>
						<datalist id="opponent2-options">
							{#each opponent2Options as p (p.id)}
								<option value={p.label}></option>
							{/each}
						</datalist>
						<input type="hidden" name="opponent2Id" value={opponent2Id} />
						{#if opponent2IsNew}
							<input
								class="email-field"
								name="opponent2Email"
								type="email"
								bind:value={opponent2Email}
								placeholder="E-Mail (optional)"
							/>
						{/if}
					</div>
				</div>
				{#if opponent1IsNew || opponent2IsNew}
					<p class="note">
						Legt neue, unbeanspruchte Profile ("Schatten-Profile") an — sie zählen für die
						Rangliste, sobald das Match bestätigt ist.
						{#if opponent1Email || opponent2Email}Wir schicken direkt eine Einladung per E-Mail.{/if}
					</p>
				{/if}

				<label class="sets-label" for="set1team1">Sätze (eure Spiele : Gegner-Spiele)</label>
				{#each Array(setCount) as _, i (i)}
					<div class="set-row">
						<span class="set-n">Satz {i + 1}</span>
						<input
							id={i === 0 ? 'set1team1' : undefined}
							type="number"
							name="set{i + 1}team1"
							min="0"
							max="99"
							required={i === 0}
							placeholder="6"
						/>
						<span>:</span>
						<input
							type="number"
							name="set{i + 1}team2"
							min="0"
							max="99"
							required={i === 0}
							placeholder="3"
						/>
					</div>
				{/each}
				{#if setCount < 3}
					<button
						class="link"
						type="button"
						onclick={() => {
							setCount += 1;
						}}
					>
						+ weiteren Satz
					</button>
				{/if}

				<button class="btn btn-primary" type="submit" disabled={busy} style="margin-top: 22px">
					{busy ? 'Wird gemeldet…' : 'Ergebnis melden'}
				</button>
			</form>

			{#if form?.message}
				<p class="err" role="status">{form.message}</p>
			{/if}
		</div>
	</div>
</section>

<style>
	.card {
		margin-top: 32px;
		padding: 26px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	label {
		display: block;
		font-size: 13px;
		margin: 18px 0 8px;
		color: var(--muted-light);
	}

	label:first-of-type {
		margin-top: 0;
	}

	input,
	select {
		width: 100%;
		box-sizing: border-box;
		padding: 12px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}

	.badge-new {
		display: inline-block;
		margin-left: 8px;
		padding: 2px 9px;
		border-radius: 100px;
		background: rgba(15, 110, 92, 0.12);
		color: var(--court-deep, #0f6e5c);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.01em;
		text-transform: none;
	}

	.email-field {
		margin-top: 8px;
	}

	.pair label {
		margin: 18px 0 8px;
	}

	.sets-label {
		margin-top: 22px;
	}

	.set-row {
		display: grid;
		grid-template-columns: 60px 1fr 14px 1fr;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.set-row input {
		border-radius: 12px;
		text-align: center;
		padding: 10px 6px;
	}

	.set-n {
		font-size: 12px;
		color: var(--muted-light);
	}

	.link {
		background: none;
		border: 0;
		padding: 0;
		font-size: 13px;
		color: var(--muted-light);
		text-decoration: underline;
		cursor: pointer;
	}

	.note {
		margin: 8px 0 0;
		font-size: 12.5px;
		color: var(--court-deep, #0f6e5c);
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}
</style>
