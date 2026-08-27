<script lang="ts">
	import { enhance } from '$app/forms';
	import { AVAILABILITY_MATCH_TYPE_LABELS } from '$lib/availability';
	import { PLAY_REQUEST_STATUS_LABELS } from '$lib/challenge-rules';
	import MatchChat from '$lib/components/chat/MatchChat.svelte';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tab = $state<'incoming' | 'outgoing'>('incoming');
	let busyId = $state<string | null>(null);
	let openChatId = $state<string | null>(null);

	const list = $derived(tab === 'incoming' ? data.incoming : data.outgoing);
	const unreadThreadIds = $derived(new Set(data.unreadThreadIds));

	function formatDate(iso: string) {
		return new Date(`${iso}T12:00:00Z`).toLocaleDateString('de-DE', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function toggleChat(requestId: string) {
		openChatId = openChatId === requestId ? null : requestId;
	}
</script>

<svelte:head>
	<title>Anfragen — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav>
	<a class="btn btn-ghost" href="/konto">Mein Konto</a>
</MinimalNav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head">
			<span class="eyebrow">Matchmaking</span>
			<h2>Spielanfragen</h2>
		</div>

		<div class="action-row">
			<a class="btn btn-ghost-light" href="/spieler-finden">Spieler finden</a>
			<a class="btn btn-ghost-light" href="/spielzeiten">Meine Spielzeiten</a>
			<a class="btn btn-ghost-light" href="/challenges">Challenges</a>
		</div>

		{#if form?.error}
			<p class="err" role="alert">{form.error}</p>
		{/if}

		<div class="tabs" role="tablist">
			<button
				role="tab"
				aria-selected={tab === 'incoming'}
				class:on={tab === 'incoming'}
				onclick={() => (tab = 'incoming')}
			>
				Empfangen ({data.incoming.length})
			</button>
			<button
				role="tab"
				aria-selected={tab === 'outgoing'}
				class:on={tab === 'outgoing'}
				onclick={() => (tab = 'outgoing')}
			>
				Gesendet ({data.outgoing.length})
			</button>
		</div>

		{#if list.length === 0}
			<div class="card">
				<p class="muted" style="font-size: 14px; margin: 0">
					{#if tab === 'incoming'}
						Noch keine Anfragen erhalten. Sobald dich jemand anfragt, erscheint sie hier — und du
						bekommst eine E-Mail.
					{:else}
						Noch keine Anfragen gesendet.
						<a href="/spieler-finden">Passende Spieler finden</a>.
					{/if}
				</p>
			</div>
		{:else}
			<ul class="requests">
				{#each list as r (r.id)}
					<li class="card request" class:closed={r.status !== 'pending'}>
						<div class="r-head">
							<div>
								<a class="r-name" href="/p/{r.counterpartHandle}">{r.counterpartName}</a>
								<span class="r-when">
									{formatDate(r.proposedDate)} · {r.proposedStart}–{r.proposedEnd}
								</span>
							</div>
							<span class="status" data-status={r.status}
								>{PLAY_REQUEST_STATUS_LABELS[r.status]}</span
							>
						</div>

						<p class="r-meta">
							{AVAILABILITY_MATCH_TYPE_LABELS[r.matchType]}
							{#if r.clubName}· {r.clubName}{/if}
							{#if r.locationText}· {r.locationText}{/if}
						</p>

						{#if r.message}
							<p class="r-message">„{r.message}"</p>
						{/if}

						{#if r.status === 'pending'}
							<div class="r-actions">
								{#if r.direction === 'incoming'}
									<form
										method="POST"
										action="?/accept"
										use:enhance={() => {
											busyId = r.id;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="requestId" value={r.id} />
										<button class="btn btn-primary" type="submit" disabled={busyId === r.id}>
											{busyId === r.id ? '…' : 'Annehmen'}
										</button>
									</form>
									<form
										method="POST"
										action="?/decline"
										use:enhance={() => {
											busyId = r.id;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="requestId" value={r.id} />
										<button class="btn btn-ghost-light" type="submit" disabled={busyId === r.id}>
											Ablehnen
										</button>
									</form>
								{:else}
									<form
										method="POST"
										action="?/cancel"
										use:enhance={() => {
											busyId = r.id;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="requestId" value={r.id} />
										<button class="btn btn-ghost-light" type="submit" disabled={busyId === r.id}>
											Zurückziehen
										</button>
									</form>
								{/if}
							</div>
						{:else if r.status === 'accepted'}
							<p class="hint">
								Viel Spaß! Tragt das Ergebnis danach wie gewohnt über „Match melden" ein.
							</p>
						{/if}

						<div class="chat-toggle-row">
							<button
								type="button"
								class="btn btn-ghost-light chat-toggle"
								onclick={() => toggleChat(r.id)}
							>
								{openChatId === r.id ? m.chat_toggle_close() : m.chat_toggle_open()}
								{#if unreadThreadIds.has(r.id) && openChatId !== r.id}
									<span class="unread-dot" role="img" aria-label={m.chat_unread_dot_label()}></span>
								{/if}
							</button>
						</div>

						{#if openChatId === r.id}
							<div class="chat-panel">
								<MatchChat
									matchId={r.id}
									contextType="play_request"
									myPlayerId={data.myPlayerId}
									contextLabel={m.chat_label_play_request({ date: formatDate(r.proposedDate) })}
								/>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
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

	.tabs {
		display: flex;
		gap: 8px;
		margin-top: 24px;
	}

	.tabs button {
		flex: 1;
		padding: 10px 14px;
		font-size: 13.5px;
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

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.requests {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.request.closed {
		opacity: 0.62;
	}

	.r-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.r-name {
		display: block;
		font-size: 15.5px;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
	}

	.r-name:hover {
		text-decoration: underline;
	}

	.r-when {
		display: block;
		font-size: 13px;
		color: var(--muted-light);
		margin-top: 2px;
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

	.r-meta {
		margin: 10px 0 0;
		font-size: 12.5px;
		color: var(--muted-light);
	}

	.r-message {
		margin: 10px 0 0;
		font-size: 13.5px;
		font-style: italic;
	}

	.r-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}

	.r-actions button {
		padding: 9px 18px;
		font-size: 13.5px;
	}

	.hint {
		margin: 14px 0 0;
		font-size: 12.5px;
		color: var(--court-deep, #0f6e5c);
	}

	.chat-toggle-row {
		margin-top: 14px;
	}

	.chat-toggle {
		padding: 7px 14px;
		font-size: 12.5px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #d64545;
		display: inline-block;
	}

	.chat-panel {
		margin-top: 12px;
	}
</style>
