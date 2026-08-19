<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		AVAILABILITY_MATCH_TYPES,
		AVAILABILITY_MATCH_TYPE_LABELS,
		WEEKDAY_LABELS
	} from '$lib/availability';
	import { MATCH_QUALITY_LABELS } from '$lib/matchmaking';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let requestingId = $state<string | null>(null);
	let busyId = $state<string | null>(null);

	const today = new Date().toISOString().slice(0, 10);

	/** Nächstes Datum, das auf den vorgeschlagenen Wochentag fällt (0 = Montag). */
	function nextDateFor(weekday: number | null, specificDate: string | null): string {
		if (specificDate) return specificDate;
		if (weekday === null) return today;

		const now = new Date();
		const current = (now.getUTCDay() + 6) % 7;
		const delta = (weekday - current + 7) % 7 || 7;
		return new Date(now.getTime() + delta * 86_400_000).toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>Spieler finden — PadelIndex</title>
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
	<div class="wrap" style="max-width: 680px">
		<div class="sec-head">
			<span class="eyebrow">Matchmaking</span>
			<h2>Spieler finden</h2>
			<p class="muted">
				Vorschläge auf Basis eurer gemeinsamen freien Zeiten, Rating, Verein und gewünschtem
				Matchtyp.
			</p>
		</div>

		<div class="action-row">
			<a class="btn btn-ghost-light" href="/spielzeiten">Meine Spielzeiten</a>
			<a class="btn btn-ghost-light" href="/anfragen">Anfragen</a>
			<a class="btn btn-ghost-light" href="/challenges">Challenges</a>
		</div>

		{#if form?.error}
			<p class="err" role="alert">{form.error}</p>
		{/if}
		{#if form?.requestSent}
			<p class="ok" role="status">Anfrage gesendet. Du findest sie unter „Anfragen".</p>
		{/if}

		{#if !data.hasOwnAvailability}
			<div class="card empty-card">
				<h3 class="card-title">Noch keine Spielzeiten</h3>
				<p class="muted" style="font-size: 14px">
					Das Matchmaking braucht deine freien Zeiten, um überhaupt jemanden vorschlagen zu können.
				</p>
				<a class="btn btn-primary" href="/spielzeiten" style="margin-top: 14px">Spielzeiten anlegen</a>
			</div>
		{:else}
			<form method="GET" class="card filters">
				<h3 class="card-title">Filter</h3>
				<div class="filter-grid">
					<div>
						<label for="f-weekday">Wochentag</label>
						<select id="f-weekday" name="weekday">
							<option value="">Alle</option>
							{#each WEEKDAY_LABELS as label, i (label)}
								<option value={String(i)} selected={data.filters.weekday === i}>{label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="f-type">Matchtyp</label>
						<select id="f-type" name="matchType">
							<option value="">Alle</option>
							{#each AVAILABILITY_MATCH_TYPES as t (t)}
								<option value={t} selected={data.filters.matchType === t}>
									{AVAILABILITY_MATCH_TYPE_LABELS[t]}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="f-min">Rating ab</label>
						<input id="f-min" type="number" name="minRating" min="0" max="7" step="0.1" value={data.filters.minRating ?? ''} />
					</div>
					<div>
						<label for="f-max">Rating bis</label>
						<input id="f-max" type="number" name="maxRating" min="0" max="7" step="0.1" value={data.filters.maxRating ?? ''} />
					</div>
				</div>
				{#if data.club}
					<label class="check">
						<input type="checkbox" name="clubId" value={data.club.id} checked={data.filters.clubId === data.club.id} />
						Nur {data.club.name}
					</label>
				{/if}
				<label class="check">
					<input type="checkbox" name="includeWeak" value="true" checked={data.filters.includeWeak} />
					Auch schwächere Übereinstimmungen zeigen
				</label>
				<button class="btn btn-primary" type="submit" style="margin-top: 14px">Filtern</button>
			</form>

			{#if data.suggestions.length === 0}
				<div class="card empty-card">
					<h3 class="card-title">Keine Vorschläge</h3>
					<p class="muted" style="font-size: 14px">
						Aktuell überschneiden sich deine Zeiten mit niemandem. Trage mehr Zeitfenster ein oder
						lockere die Filter.
					</p>
				</div>
			{:else}
				<ul class="suggestions">
					{#each data.suggestions as s (s.playerId)}
						<li class="card suggestion">
							<div class="s-head">
								<div>
									<a class="s-name" href="/p/{s.handle}">{s.name}</a>
									<span class="s-meta">
										Rating {s.rating.toFixed(2)} · {s.matchesPlayed} Matches
										{#if s.clubName}· {s.clubName}{/if}
									</span>
								</div>
								<div class="s-score" data-quality={s.quality}>
									<span class="s-score-value num">{s.score}</span>
									<span class="s-score-label">{MATCH_QUALITY_LABELS[s.quality]}</span>
								</div>
							</div>

							{#if s.reasons.length > 0}
								<ul class="reasons">
									{#each s.reasons as reason (reason)}
										<li>{reason}</li>
									{/each}
								</ul>
							{/if}

							{#if requestingId === s.playerId}
								<form
									method="POST"
									action="?/sendRequest"
									class="request-form"
									use:enhance={() => {
										busyId = s.playerId;
										return async ({ update }) => {
											await update();
											busyId = null;
											requestingId = null;
										};
									}}
								>
									<input type="hidden" name="receiverId" value={s.playerId} />
									<input type="hidden" name="clubId" value={s.suggestedSlot?.clubId ?? ''} />

									<div class="pair">
										<div>
											<label for="date-{s.playerId}">Datum</label>
											<input
												id="date-{s.playerId}"
												type="date"
												name="proposedDate"
												min={today}
												value={nextDateFor(s.suggestedSlot?.weekday ?? null, s.suggestedSlot?.specificDate ?? null)}
												required
											/>
										</div>
										<div>
											<label for="mtype-{s.playerId}">Matchtyp</label>
											<select id="mtype-{s.playerId}" name="matchType">
												{#each AVAILABILITY_MATCH_TYPES as t (t)}
													<option value={t} selected={s.suggestedSlot?.matchType === t}>
														{AVAILABILITY_MATCH_TYPE_LABELS[t]}
													</option>
												{/each}
											</select>
										</div>
									</div>

									<div class="pair">
										<div>
											<label for="start-{s.playerId}">Von</label>
											<input
												id="start-{s.playerId}"
												type="time"
												name="proposedStart"
												value={s.suggestedSlot?.startTime ?? '18:00'}
												required
											/>
										</div>
										<div>
											<label for="end-{s.playerId}">Bis</label>
											<input
												id="end-{s.playerId}"
												type="time"
												name="proposedEnd"
												value={s.suggestedSlot?.endTime ?? '20:00'}
												required
											/>
										</div>
									</div>

									<label for="msg-{s.playerId}">Nachricht (optional)</label>
									<textarea id="msg-{s.playerId}" name="message" rows="2" maxlength="500"
										placeholder="Kurze Nachricht…"></textarea>

									<div class="s-actions">
										<button class="btn btn-primary" type="submit" disabled={busyId === s.playerId}>
											{busyId === s.playerId ? 'Wird gesendet…' : 'Anfrage senden'}
										</button>
										<button class="btn btn-ghost-light" type="button" onclick={() => (requestingId = null)}>
											Abbrechen
										</button>
									</div>
								</form>
							{:else}
								<div class="s-actions">
									<button class="btn btn-primary" type="button" onclick={() => (requestingId = s.playerId)}>
										Spielanfrage senden
									</button>
									<form
										method="POST"
										action="?/dismiss"
										use:enhance={() => {
											busyId = s.playerId;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="playerId" value={s.playerId} />
										<button class="btn btn-ghost-light" type="submit" disabled={busyId === s.playerId}>
											Nicht interessiert
										</button>
									</form>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
</section>

<style>
	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 24px;
	}

	.card {
		margin-top: 20px;
		padding: 20px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
		margin: 0 0 12px;
	}

	.empty-card {
		text-align: left;
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.ok {
		margin: 16px 0 0;
		font-size: 13px;
		color: var(--court-deep, #0f6e5c);
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
	}

	label {
		display: block;
		font-size: 12.5px;
		margin: 0 0 6px;
		color: var(--muted-light);
	}

	label.check {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		color: var(--ink);
		font-size: 13.5px;
	}

	label.check input {
		width: auto;
	}

	input,
	select,
	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 14px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
	}

	textarea {
		border-radius: 14px;
		resize: vertical;
	}

	.suggestions {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.s-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	.s-name {
		display: block;
		font-size: 16px;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
	}

	.s-name:hover {
		text-decoration: underline;
	}

	.s-meta {
		display: block;
		font-size: 12.5px;
		color: var(--muted-light);
		margin-top: 2px;
	}

	.s-score {
		flex-shrink: 0;
		text-align: right;
	}

	.s-score-value {
		display: block;
		font-size: 22px;
		font-weight: 600;
		line-height: 1.1;
		color: var(--muted-light);
	}

	.s-score[data-quality='excellent'] .s-score-value {
		color: var(--court-deep, #0f6e5c);
	}

	.s-score[data-quality='good'] .s-score-value {
		color: #2c8c5f;
	}

	.s-score-label {
		display: block;
		font-size: 11px;
		color: var(--muted-light);
		margin-top: 2px;
	}

	.reasons {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 14px 0 0;
		padding: 0;
	}

	.reasons li {
		font-size: 11.5px;
		padding: 4px 10px;
		border-radius: 100px;
		background: rgba(15, 110, 92, 0.08);
		color: var(--court-deep, #0f6e5c);
	}

	.s-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}

	.s-actions button {
		padding: 9px 16px;
		font-size: 13.5px;
	}

	.request-form {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.request-form label {
		margin-top: 12px;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
</style>
