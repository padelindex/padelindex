<script lang="ts">
	import { enhance } from '$app/forms';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import { CHALLENGE_STATUS_LABELS } from '$lib/challenge-rules';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tab = $state<'targets' | 'incoming' | 'outgoing'>('targets');
	let challengingId = $state<string | null>(null);
	let busyId = $state<string | null>(null);
	let selectedSlot = $state<Record<string, number>>({});

	const today = new Date().toISOString().slice(0, 10);
	const inSevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

	function formatDate(iso: string) {
		return new Date(`${iso}T12:00:00Z`).toLocaleDateString('de-DE', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit'
		});
	}

	function daysLeft(expiresAt: string) {
		const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
		return days > 0 ? days : 0;
	}
</script>

<svelte:head>
	<title>Challenges — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav>
	<a class="btn btn-ghost" href="/konto">Mein Konto</a>
</MinimalNav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head">
			<span class="eyebrow">Rangliste</span>
			<h2>Challenges</h2>
			<p class="muted">
				Fordere höher platzierte Spieler deines Vereins heraus. Ein Sieg tauscht keine Plätze — er
				wirkt wie jedes andere Match über dein Rating.
			</p>
		</div>

		<div class="action-row">
			<a class="btn btn-ghost-light" href="/spieler-finden">Spieler finden</a>
			<a class="btn btn-ghost-light" href="/anfragen">Anfragen</a>
			<a class="btn btn-ghost-light" href="/spielzeiten">Meine Spielzeiten</a>
		</div>

		{#if form?.error}
			<p class="err" role="alert">{form.error}</p>
		{/if}
		{#if form?.challengeSent}
			<p class="ok" role="status">Challenge gesendet.</p>
		{/if}

		{#if !data.club}
			<div class="card">
				<h3 class="card-title">Kein Verein</h3>
				<p class="muted" style="font-size: 14px; margin: 0">
					Challenges laufen über die Vereinsrangliste. Sobald du Mitglied eines Vereins bist,
					kannst du hier höher platzierte Spieler herausfordern.
				</p>
			</div>
		{:else}
			{#if data.challengeable}
				<div class="rank-bar">
					<div>
						<span class="rank-label">Dein Platz</span>
						<span class="rank-value num">{data.challengeable.myRank ?? '–'}</span>
						<span class="rank-total">von {data.challengeable.totalPlayers}</span>
					</div>
					<div>
						<span class="rank-label">Herausforderbar</span>
						<span class="rank-value num">
							{#if data.challengeable.rangeStart}
								{data.challengeable.rangeStart}–{data.challengeable.rangeEnd}
							{:else}
								–
							{/if}
						</span>
					</div>
					<div>
						<span class="rank-label">Offene Challenges</span>
						<span class="rank-value num">
							{data.challengeable.activeOutgoing}/{data.challengeable.maxOutgoing}
						</span>
					</div>
				</div>
			{/if}

			<div class="tabs" role="tablist">
				<button role="tab" aria-selected={tab === 'targets'} class:on={tab === 'targets'} onclick={() => (tab = 'targets')}>
					Gegner ({data.challengeable?.targets.length ?? 0})
				</button>
				<button role="tab" aria-selected={tab === 'incoming'} class:on={tab === 'incoming'} onclick={() => (tab = 'incoming')}>
					Erhalten ({data.incoming.length})
				</button>
				<button role="tab" aria-selected={tab === 'outgoing'} class:on={tab === 'outgoing'} onclick={() => (tab = 'outgoing')}>
					Gesendet ({data.outgoing.length})
				</button>
			</div>

			{#if tab === 'targets'}
				{#if !data.challengeable || data.challengeable.targets.length === 0}
					<div class="card">
						<p class="muted" style="font-size: 14px; margin: 0">
							{#if data.challengeable?.myRank === 1}
								Du führst die Rangliste an — von hier aus gibt es niemanden mehr herauszufordern.
							{:else if (data.challengeable?.activeOutgoing ?? 0) >= (data.challengeable?.maxOutgoing ?? 3)}
								Du hast bereits {data.challengeable?.maxOutgoing} offene Challenges. Warte, bis eine
								davon beantwortet ist.
							{:else}
								Aktuell ist niemand in deiner Challenge-Reichweite verfügbar. Inaktive und noch nicht
								übernommene Profile werden dabei übersprungen.
							{/if}
						</p>
					</div>
				{:else}
					<ul class="list">
						{#each data.challengeable.targets as t (t.playerId)}
							<li class="card">
								<div class="row-head">
									<div>
										<span class="rank-chip num">#{t.rank}</span>
										<a class="name" href="/p/{t.handle}">{t.name}</a>
										<span class="meta">
											Rating {t.rating.toFixed(2)} · {t.placesAbove}
											{t.placesAbove === 1 ? 'Platz' : 'Plätze'} über dir
										</span>
									</div>
								</div>

								{#if challengingId === t.playerId}
									<form
										method="POST"
										action="?/challenge"
										class="challenge-form"
										use:enhance={() => {
											busyId = t.playerId;
											return async ({ update }) => {
												await update();
												busyId = null;
												challengingId = null;
											};
										}}
									>
										<input type="hidden" name="targetId" value={t.playerId} />
										<p class="form-hint">Schlage bis zu drei Termine vor:</p>

										{#each [1, 2, 3] as n (n)}
											<div class="slot-row">
												<input type="date" name="slot{n}Date" min={today} max={inSevenDays}
													value={n === 1 ? inSevenDays : ''} required={n === 1} />
												<input type="time" name="slot{n}Start" value={n === 1 ? '18:00' : ''} required={n === 1} />
												<input type="time" name="slot{n}End" value={n === 1 ? '20:00' : ''} required={n === 1} />
											</div>
										{/each}

										<textarea name="message" rows="2" maxlength="500" placeholder="Nachricht (optional)"></textarea>

										<div class="actions">
											<button class="btn btn-primary" type="submit" disabled={busyId === t.playerId}>
												{busyId === t.playerId ? 'Wird gesendet…' : 'Challenge senden'}
											</button>
											<button class="btn btn-ghost-light" type="button" onclick={() => (challengingId = null)}>
												Abbrechen
											</button>
										</div>
									</form>
								{:else}
									<div class="actions">
										<button class="btn btn-primary" type="button" onclick={() => (challengingId = t.playerId)}>
											Herausfordern
										</button>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				{@const list = tab === 'incoming' ? data.incoming : data.outgoing}
				{#if list.length === 0}
					<div class="card">
						<p class="muted" style="font-size: 14px; margin: 0">
							{tab === 'incoming' ? 'Noch keine Challenges erhalten.' : 'Noch keine Challenges gesendet.'}
						</p>
					</div>
				{:else}
					<ul class="list">
						{#each list as c (c.id)}
							<li class="card" class:closed={c.status !== 'pending' && c.status !== 'accepted'}>
								<div class="row-head">
									<div>
										<a class="name" href="/p/{c.counterpartHandle}">{c.counterpartName}</a>
										<span class="meta">
											Platz {c.challengedRank} · herausgefordert von Platz {c.challengerRank}
										</span>
									</div>
									<span class="status" data-status={c.status}>{CHALLENGE_STATUS_LABELS[c.status]}</span>
								</div>

								{#if c.message}
									<p class="message">„{c.message}"</p>
								{/if}

								{#if c.status === 'accepted' && c.selectedTimeSlot}
									<p class="hint">
										Termin: {formatDate(c.selectedTimeSlot.date)},
										{c.selectedTimeSlot.startTime}–{c.selectedTimeSlot.endTime}. Meldet das Ergebnis
										danach als „PadelIndex Challenge".
									</p>
								{:else if c.status === 'pending'}
									<p class="expiry">Läuft in {daysLeft(c.expiresAt)} Tag(en) ab</p>

									{#if c.direction === 'incoming'}
										<form
											method="POST"
											action="?/accept"
											use:enhance={() => {
												busyId = c.id;
												return async ({ update }) => {
													await update();
													busyId = null;
												};
											}}
										>
											<input type="hidden" name="challengeId" value={c.id} />
											<fieldset class="slots">
												<legend>Termin wählen</legend>
												{#each c.proposedTimeSlots as slot, i (i)}
													<label class="slot-option">
														<input
															type="radio"
															name="slotIndex"
															value={i}
															checked={(selectedSlot[c.id] ?? 0) === i}
															onchange={() => (selectedSlot[c.id] = i)}
														/>
														{formatDate(slot.date)}, {slot.startTime}–{slot.endTime}
													</label>
												{/each}
											</fieldset>
											<div class="actions">
												<button class="btn btn-primary" type="submit" disabled={busyId === c.id}>
													{busyId === c.id ? '…' : 'Annehmen'}
												</button>
											</div>
										</form>
										<form
											method="POST"
											action="?/decline"
											use:enhance={() => {
												busyId = c.id;
												return async ({ update }) => {
													await update();
													busyId = null;
												};
											}}
										>
											<input type="hidden" name="challengeId" value={c.id} />
											<button class="btn btn-ghost-light decline" type="submit" disabled={busyId === c.id}>
												Ablehnen
											</button>
										</form>
									{:else}
										<div class="actions">
											<form
												method="POST"
												action="?/cancel"
												use:enhance={() => {
													busyId = c.id;
													return async ({ update }) => {
														await update();
														busyId = null;
													};
												}}
											>
												<input type="hidden" name="challengeId" value={c.id} />
												<button class="btn btn-ghost-light" type="submit" disabled={busyId === c.id}>
													Zurückziehen
												</button>
											</form>
										</div>
									{/if}
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
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

	.rank-bar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-top: 24px;
		padding: 16px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
		text-align: center;
	}

	.rank-label {
		display: block;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	.rank-value {
		display: block;
		font-size: 20px;
		font-weight: 600;
		margin-top: 3px;
		color: var(--court-deep, #0f6e5c);
	}

	.rank-total {
		display: block;
		font-size: 11px;
		color: var(--muted-light);
	}

	.tabs {
		display: flex;
		gap: 8px;
		margin-top: 20px;
	}

	.tabs button {
		flex: 1;
		padding: 10px 8px;
		font-size: 13px;
		font-family: var(--body);
		font-weight: 600;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		color: var(--muted-light);
		cursor: pointer;
	}

	.tabs button.on {
		background: var(--court-deep, #0f6e5c);
		border-color: var(--court-deep, #0f6e5c);
		color: #fff;
	}

	.card {
		margin-top: 16px;
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
		margin: 0 0 10px;
	}

	.card.closed {
		opacity: 0.6;
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

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.rank-chip {
		display: inline-block;
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 100px;
		background: rgba(15, 110, 92, 0.1);
		color: var(--court-deep, #0f6e5c);
		margin-right: 8px;
	}

	.name {
		font-size: 15.5px;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
	}

	.name:hover {
		text-decoration: underline;
	}

	.meta {
		display: block;
		font-size: 12.5px;
		color: var(--muted-light);
		margin-top: 3px;
	}

	.status {
		flex-shrink: 0;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 4px 10px;
		border-radius: 100px;
		background: rgba(0, 0, 0, 0.06);
		color: var(--muted-light);
	}

	.status[data-status='pending'] {
		background: rgba(233, 178, 60, 0.18);
		color: #8a6414;
	}

	.status[data-status='accepted'] {
		background: rgba(15, 110, 92, 0.14);
		color: var(--court-deep, #0f6e5c);
	}

	.message {
		margin: 10px 0 0;
		font-size: 13.5px;
		font-style: italic;
	}

	.hint {
		margin: 12px 0 0;
		font-size: 12.5px;
		color: var(--court-deep, #0f6e5c);
	}

	.expiry {
		margin: 10px 0 0;
		font-size: 12px;
		color: #8a6414;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}

	.actions button {
		padding: 9px 18px;
		font-size: 13.5px;
	}

	.decline {
		margin-top: 8px;
		padding: 9px 18px;
		font-size: 13.5px;
	}

	.challenge-form {
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.form-hint {
		margin: 0 0 10px;
		font-size: 12.5px;
		color: var(--muted-light);
	}

	.slot-row {
		display: grid;
		grid-template-columns: 1.4fr 1fr 1fr;
		gap: 8px;
		margin-bottom: 8px;
	}

	input,
	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 13.5px;
	}

	textarea {
		margin-top: 8px;
		resize: vertical;
	}

	.slots {
		border: 0;
		padding: 0;
		margin: 12px 0 0;
	}

	.slots legend {
		font-size: 12px;
		color: var(--muted-light);
		padding: 0;
		margin-bottom: 6px;
	}

	.slot-option {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13.5px;
		padding: 6px 0;
	}

	.slot-option input {
		width: auto;
	}
</style>
