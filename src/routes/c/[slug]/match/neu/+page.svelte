<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let partnerId = $state('');
	let opponent1Id = $state('');
	let opponent2Id = $state('');
	let setCount = $state(2);
	let busy = $state(false);

	const today = new Date().toISOString().slice(0, 10);

	const otherOptions = (excludeIds: string[]) =>
		data.roster.filter((p) => p.id !== data.me && !excludeIds.includes(p.id));
</script>

<svelte:head>
	<title>Match melden — {data.club.name} — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		<a class="btn btn-ghost" href="/konto">Mein Konto</a>
	</div>
</nav>

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
				<input id="playedAt" type="date" name="playedAt" value={today} max={today} required />

				<label for="partnerId">Dein Partner</label>
				<select id="partnerId" name="partnerId" bind:value={partnerId} required>
					<option value="" disabled selected>Auswählen…</option>
					{#each otherOptions([opponent1Id, opponent2Id]) as p (p.id)}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>

				<div class="pair">
					<div>
						<label for="opponent1Id">Gegner 1</label>
						<select id="opponent1Id" name="opponent1Id" bind:value={opponent1Id} required>
							<option value="" disabled selected>Auswählen…</option>
							{#each otherOptions([partnerId, opponent2Id]) as p (p.id)}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="opponent2Id">Gegner 2</label>
						<select id="opponent2Id" name="opponent2Id" bind:value={opponent2Id} required>
							<option value="" disabled selected>Auswählen…</option>
							{#each otherOptions([partnerId, opponent1Id]) as p (p.id)}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
				</div>

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

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}
</style>
