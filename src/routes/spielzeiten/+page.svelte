<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		AVAILABILITY_MATCH_TYPES,
		AVAILABILITY_MATCH_TYPE_LABELS,
		DESIRED_LEVELS,
		DESIRED_LEVEL_LABELS,
		PREFERRED_FORMATS,
		PREFERRED_FORMAT_LABELS,
		WEEKDAY_LABELS
	} from '$lib/availability';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let creating = $state(false);
	let editingId = $state<string | null>(null);
	let busyId = $state<string | null>(null);

	const today = new Date().toISOString().slice(0, 10);

	function describe(a: PageData['availabilities'][number]) {
		const when = a.isRecurring
			? `Jeden ${WEEKDAY_LABELS[a.weekday ?? 0]}`
			: new Date(`${a.specificDate}T12:00:00Z`).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				});
		return `${when}, ${a.startTime}–${a.endTime}`;
	}
</script>

<svelte:head>
	<title>Meine Spielzeiten — PadelIndex</title>
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
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head">
			<span class="eyebrow">Matchmaking</span>
			<h2>Meine Spielzeiten</h2>
			<p class="muted">
				Wann kannst du spielen? Andere sehen deine Zeiten nie direkt — sie fließen nur in
				Matchvorschläge ein, und erst mit einer angenommenen Anfrage wisst ihr voneinander.
			</p>
		</div>

		<div class="action-row">
			<a class="btn btn-primary" href="/spieler-finden">Spieler finden</a>
			<a class="btn btn-ghost-light" href="/anfragen">Anfragen</a>
			<a class="btn btn-ghost-light" href="/challenges">Challenges</a>
		</div>

		{#if form?.error}
			<p class="err" role="alert">{form.error}</p>
		{/if}

		<div class="card">
			<div class="card-head">
				<h3 class="card-title" style="margin: 0">Neue Spielzeit</h3>
				<button class="btn btn-ghost-light" type="button" onclick={() => (creating = !creating)}>
					{creating ? 'Abbrechen' : '+ Hinzufügen'}
				</button>
			</div>

			{#if creating}
				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						busyId = 'new';
						return async ({ update }) => {
							await update();
							busyId = null;
							creating = false;
						};
					}}
				>
					{@render slotFields(null)}
					<button class="btn btn-primary" type="submit" disabled={busyId === 'new'}>
						{busyId === 'new' ? 'Wird gespeichert…' : 'Spielzeit anlegen'}
					</button>
				</form>
			{/if}
		</div>

		<div class="card">
			<h3 class="card-title">Meine Zeiten ({data.availabilities.length})</h3>

			{#if data.availabilities.length === 0}
				<p class="muted empty">
					Noch keine Spielzeiten hinterlegt. Lege eine an — ohne Zeiten kann das Matchmaking dir
					niemanden vorschlagen.
				</p>
			{:else}
				<ul class="slots">
					{#each data.availabilities as a (a.id)}
						<li class="slot" class:paused={a.status === 'paused'}>
							{#if editingId === a.id}
								<form
									method="POST"
									action="?/update"
									class="edit-form"
									use:enhance={() => {
										busyId = a.id;
										return async ({ update }) => {
											await update();
											busyId = null;
											editingId = null;
										};
									}}
								>
									<input type="hidden" name="availabilityId" value={a.id} />
									{@render slotFields(a)}
									<div class="edit-actions">
										<button class="btn btn-primary" type="submit" disabled={busyId === a.id}>
											{busyId === a.id ? 'Wird gespeichert…' : 'Speichern'}
										</button>
										<button class="btn btn-ghost-light" type="button" onclick={() => (editingId = null)}>
											Abbrechen
										</button>
									</div>
								</form>
							{:else}
								<div class="slot-main">
									<span class="slot-when">
										{describe(a)}
										{#if a.status === 'paused'}<span class="tag">pausiert</span>{/if}
									</span>
									<span class="slot-meta">
										{AVAILABILITY_MATCH_TYPE_LABELS[a.matchType]} ·
										{PREFERRED_FORMAT_LABELS[a.preferredFormat]} ·
										Niveau: {DESIRED_LEVEL_LABELS[a.desiredLevel]}
										{#if a.clubName}· {a.clubName}{/if}
									</span>
								</div>
								<div class="slot-actions">
									<button class="btn btn-ghost-light" type="button" onclick={() => (editingId = a.id)}>
										Bearbeiten
									</button>
									<form
										method="POST"
										action="?/toggle"
										use:enhance={() => {
											busyId = a.id;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="availabilityId" value={a.id} />
										<input type="hidden" name="status" value={a.status === 'active' ? 'paused' : 'active'} />
										<button class="btn btn-ghost-light" type="submit" disabled={busyId === a.id}>
											{a.status === 'active' ? 'Pausieren' : 'Aktivieren'}
										</button>
									</form>
									<form
										method="POST"
										action="?/remove"
										use:enhance={() => {
											busyId = a.id;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="availabilityId" value={a.id} />
										<button class="btn btn-ghost-light danger" type="submit" disabled={busyId === a.id}>
											Löschen
										</button>
									</form>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</section>

{#snippet slotFields(a: PageData['availabilities'][number] | null)}
	<label class="check">
		<input type="checkbox" name="isRecurring" value="true" checked={a?.isRecurring ?? true} />
		Wöchentlich wiederkehrend
	</label>

	<label for="weekday-{a?.id ?? 'new'}">Wochentag</label>
	<select id="weekday-{a?.id ?? 'new'}" name="weekday" value={String(a?.weekday ?? 0)}>
		{#each WEEKDAY_LABELS as label, i (label)}
			<option value={String(i)}>{label}</option>
		{/each}
	</select>

	<label for="date-{a?.id ?? 'new'}">Oder festes Datum (nur ohne „wöchentlich")</label>
	<input
		id="date-{a?.id ?? 'new'}"
		type="date"
		name="specificDate"
		min={today}
		value={a?.specificDate ?? ''}
	/>

	<div class="pair">
		<div>
			<label for="start-{a?.id ?? 'new'}">Von</label>
			<input id="start-{a?.id ?? 'new'}" type="time" name="startTime" value={a?.startTime ?? '18:00'} required />
		</div>
		<div>
			<label for="end-{a?.id ?? 'new'}">Bis</label>
			<input id="end-{a?.id ?? 'new'}" type="time" name="endTime" value={a?.endTime ?? '20:00'} required />
		</div>
	</div>

	{#if data.club}
		<label class="check">
			<input type="checkbox" name="clubId" value={data.club.id} checked={a ? a.clubId !== null : true} />
			Bei {data.club.name}
		</label>
	{/if}

	<label for="distance-{a?.id ?? 'new'}">Maximale Entfernung (km)</label>
	<input
		id="distance-{a?.id ?? 'new'}"
		type="number"
		name="maxDistanceKm"
		min="0"
		max="500"
		step="1"
		value={a?.maxDistanceKm ?? 25}
	/>

	<label for="type-{a?.id ?? 'new'}">Matchtyp</label>
	<select id="type-{a?.id ?? 'new'}" name="matchType" value={a?.matchType ?? 'friendly'}>
		{#each AVAILABILITY_MATCH_TYPES as t (t)}
			<option value={t}>{AVAILABILITY_MATCH_TYPE_LABELS[t]}</option>
		{/each}
	</select>

	<label for="format-{a?.id ?? 'new'}">Format</label>
	<select id="format-{a?.id ?? 'new'}" name="preferredFormat" value={a?.preferredFormat ?? 'open'}>
		{#each PREFERRED_FORMATS as f (f)}
			<option value={f}>{PREFERRED_FORMAT_LABELS[f]}</option>
		{/each}
	</select>

	<label for="level-{a?.id ?? 'new'}">Gewünschtes Niveau</label>
	<select id="level-{a?.id ?? 'new'}" name="desiredLevel" value={a?.desiredLevel ?? 'similar'}>
		{#each DESIRED_LEVELS as l (l)}
			<option value={l}>{DESIRED_LEVEL_LABELS[l]}</option>
		{/each}
	</select>
{/snippet}

<style>
	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 24px;
	}

	.card {
		margin-top: 24px;
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.empty {
		font-size: 13px;
		margin: 10px 0 0;
	}

	label {
		display: block;
		font-size: 13px;
		margin: 16px 0 6px;
		color: var(--muted-light);
	}

	label.check {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--ink);
		font-size: 14px;
	}

	label.check input {
		width: auto;
		margin: 0;
	}

	input,
	select {
		width: 100%;
		box-sizing: border-box;
		padding: 11px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	form > button[type='submit'] {
		margin-top: 18px;
	}

	.slots {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
	}

	.slot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		padding: 14px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.slot:first-child {
		border-top: none;
		padding-top: 0;
	}

	.slot.paused {
		opacity: 0.55;
	}

	.slot-main {
		flex: 1;
		min-width: 200px;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.slot-when {
		font-size: 14px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tag {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #8f5a15;
		background: rgba(180, 113, 26, 0.12);
		padding: 2px 7px;
		border-radius: 100px;
	}

	.slot-meta {
		font-size: 12.5px;
		color: var(--muted-light);
	}

	.slot-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.slot-actions button {
		padding: 8px 14px;
		font-size: 13px;
	}

	.slot-actions .danger {
		color: #a3341f;
	}

	.edit-form {
		flex: 1;
		min-width: 100%;
	}

	.edit-actions {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}
</style>
