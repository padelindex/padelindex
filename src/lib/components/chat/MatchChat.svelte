<script lang="ts">
	// Universeller Chat für jedes organisierte Spiel (freies Match, Liga-
	// Box-Runde, Liga-Box-Gruppe, Spielersuche-Anfrage) — siehe
	// supabase/migrations/0023_match_chat.sql. Läuft komplett clientseitig
	// über den cookie-gebundenen Browser-Client (wie AvatarUpload.svelte):
	// sowohl Lesen/Schreiben als auch die Realtime-Subscription hängen an
	// RLS/auth.uid(), ein Server-Roundtrip sichert hier nichts zusätzlich ab.
	//
	// contextType sagt, welche der vier Fremdschlüsselspalten in
	// match_messages gesetzt wird — eine einzelne ID lässt sich nicht ohne
	// Zusatz-Query einem der vier Kontexte zuordnen, und die Einbettungsstelle
	// (Box-Seite, Anfragen-Liste, Konto) kennt ihr eigenes Datenmodell ohnehin.
	// contextLabel kommt ebenfalls vom Aufrufer statt hier neu geladen zu
	// werden: jede Einbettungsstelle formatiert Datum/Court/Gegner für ihre
	// eigene Karte sowieso schon.
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { createBrowserSupabase } from '$lib/supabase-browser';
	import {
		CHAT_CONTEXT_COLUMN,
		CHAT_MESSAGE_COLUMNS,
		cleanChatMessage,
		mapChatMessageRow,
		type ChatContextType,
		type ChatMessage
	} from '$lib/chat';
	import AvatarCircle from '../AvatarCircle.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let {
		matchId,
		contextType,
		myPlayerId,
		contextLabel
	}: {
		matchId: string;
		contextType: ChatContextType;
		myPlayerId: string;
		contextLabel: string;
	} = $props();

	const supabaseConfig = page.data.supabaseConfig as { url: string; anonKey: string } | null;
	const supabase: SupabaseClient | null = supabaseConfig
		? createBrowserSupabase(supabaseConfig.url, supabaseConfig.anonKey)
		: null;

	let messages = $state<ChatMessage[]>([]);
	let loading = $state(true);
	let sending = $state(false);
	let loadError = $state(false);
	let sendError = $state(false);
	let draft = $state('');
	let scrollEl: HTMLDivElement | undefined = $state();

	function scrollToBottom() {
		if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
	}

	async function markRead() {
		if (!supabase) return;
		try {
			await supabase
				.from('match_message_reads')
				.upsert(
					{ player_id: myPlayerId, thread_key: matchId, last_read_at: new Date().toISOString() },
					{ onConflict: 'player_id,thread_key' }
				);
		} catch {
			// best-effort — ein verpasstes Gelesen-Update blockiert den Chat nicht
		}
	}

	function appendIfNew(msg: ChatMessage) {
		if (messages.some((existing) => existing.id === msg.id)) return;
		messages = [...messages, msg];
	}

	// $effect statt onMount/onDestroy: der Rückgabewert läuft garantiert
	// beim Aufräumen (Komponente verschwindet aus dem Drawer/Tab) UND vor
	// jedem erneuten Lauf, falls matchId sich je ändern sollte — das
	// entfernt den Realtime-Channel in beiden Fällen sauber, eine einzelne
	// onDestroy-Hook könnte einen Wechsel mitten im Mount nicht abdecken.
	// cancelled schützt zusätzlich davor, dass eine Antwort auf einen
	// bereits verlassenen Thread noch state setzt.
	$effect(() => {
		if (!supabase) {
			loading = false;
			return;
		}

		let cancelled = false;
		loading = true;
		loadError = false;
		messages = [];

		(async () => {
			// Neueste 500 zuerst laden (sonst zeigt ein Thread mit >500
			// Nachrichten für immer nur die ältesten 500 und nie etwas
			// Neueres), dann für die Anzeige wieder aufsteigend sortieren.
			const { data, error } = await supabase
				.from('match_messages')
				.select(CHAT_MESSAGE_COLUMNS)
				.eq('thread_key', matchId)
				.order('created_at', { ascending: false })
				.limit(500);

			if (cancelled) return;
			if (error) {
				loadError = true;
			} else {
				messages = (data ?? []).map(mapChatMessageRow).reverse();
			}
			loading = false;
			await tick();
			scrollToBottom();
			// Nur bei erfolgreichem Laden als gelesen markieren — sonst
			// verschwindet der Unread-Punkt für Nachrichten, die wegen
			// dieses Fehlers gar nicht angezeigt wurden.
			if (!error) markRead();
		})();

		const channel = supabase
			.channel(`match-chat-${matchId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'match_messages',
					filter: `thread_key=eq.${matchId}`
				},
				(payload) => {
					if (cancelled) return;
					appendIfNew(mapChatMessageRow(payload.new as Parameters<typeof mapChatMessageRow>[0]));
					tick().then(scrollToBottom);
					markRead();
				}
			)
			.subscribe();

		return () => {
			cancelled = true;
			supabase.removeChannel(channel);
		};
	});

	async function send() {
		const content = cleanChatMessage(draft);
		if (!content || !supabase || sending) return;

		sending = true;
		sendError = false;

		const column = CHAT_CONTEXT_COLUMN[contextType];
		const { error } = await supabase.from('match_messages').insert({
			[column]: matchId,
			kind: 'user',
			sender_id: myPlayerId,
			content
		});

		if (error) {
			sendError = true;
		} else {
			draft = '';
		}
		sending = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			send();
		}
	}

	const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
	function formatTime(iso: string): string {
		return timeFmt.format(new Date(iso));
	}
</script>

<div class="match-chat">
	<div class="chat-header">
		<span class="chat-header-label">{contextLabel}</span>
	</div>

	{#if !supabase}
		<p class="chat-hint">{m.chat_unavailable()}</p>
	{:else}
		<div class="chat-scroll" bind:this={scrollEl}>
			{#if loading}
				<p class="chat-hint">{m.chat_loading()}</p>
			{:else if loadError}
				<p class="chat-hint chat-hint-error">{m.chat_load_error()}</p>
			{:else if messages.length === 0}
				<p class="chat-hint">{m.chat_empty()}</p>
			{:else}
				{#each messages as msg (msg.id)}
					{#if msg.kind === 'system'}
						<p class="chat-system">{msg.content}</p>
					{:else}
						<div class="chat-row" class:own={msg.senderId === myPlayerId}>
							<AvatarCircle
								avatarUrl={msg.senderAvatarUrl}
								name={msg.senderName ?? '?'}
								size={28}
							/>
							<div class="chat-bubble-wrap">
								<div class="chat-meta">
									<span class="chat-name">{msg.senderName}</span>
									<span class="chat-time">{formatTime(msg.createdAt)}</span>
								</div>
								<p class="chat-bubble">{msg.content}</p>
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>

		<form
			class="chat-form"
			onsubmit={(e) => {
				e.preventDefault();
				send();
			}}
		>
			{#if sendError}
				<p class="chat-hint chat-hint-error">{m.chat_send_error()}</p>
			{/if}
			<div class="chat-input-row">
				<input
					type="text"
					class="chat-input"
					placeholder={m.chat_input_placeholder()}
					bind:value={draft}
					onkeydown={onKeydown}
					maxlength="2000"
					disabled={sending}
				/>
				<button class="btn btn-primary chat-send" type="submit" disabled={sending || !draft.trim()}>
					{m.chat_send()}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.match-chat {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.12));
		border-radius: 14px;
		background: #fff;
		overflow: hidden;
	}

	.chat-header {
		padding: 10px 14px;
		border-bottom: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		background: var(--chalk-2, #f7f9f5);
	}

	.chat-header-label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink, #0b1e26);
	}

	.chat-scroll {
		flex: 1;
		max-height: 360px;
		min-height: 120px;
		overflow-y: auto;
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.chat-hint {
		margin: auto;
		font-size: 13px;
		color: var(--muted-light, #5f7078);
		text-align: center;
	}

	.chat-hint-error {
		color: #a3341f;
	}

	.chat-system {
		align-self: center;
		margin: 0;
		padding: 4px 12px;
		border-radius: 100px;
		background: rgba(0, 0, 0, 0.05);
		color: var(--muted-light, #5f7078);
		font-size: 11.5px;
		text-align: center;
	}

	.chat-row {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.chat-row.own {
		flex-direction: row-reverse;
	}

	.chat-bubble-wrap {
		display: flex;
		flex-direction: column;
		max-width: 78%;
	}

	.chat-row.own .chat-bubble-wrap {
		align-items: flex-end;
	}

	.chat-meta {
		display: flex;
		gap: 6px;
		align-items: baseline;
		margin-bottom: 3px;
	}

	.chat-name {
		font-size: 11.5px;
		font-weight: 600;
		color: var(--ink, #0b1e26);
	}

	.chat-time {
		font-family: var(--mono);
		font-size: 10px;
		color: var(--muted-light, #5f7078);
	}

	.chat-bubble {
		margin: 0;
		padding: 8px 12px;
		border-radius: 14px;
		background: var(--chalk-2, #f7f9f5);
		font-size: 13.5px;
		line-height: 1.4;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.chat-row.own .chat-bubble {
		background: var(--court-deep, #0c6e64);
		color: #fff;
	}

	.chat-form {
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		padding: 10px 12px;
	}

	.chat-input-row {
		display: flex;
		gap: 8px;
	}

	.chat-input {
		flex: 1;
		padding: 9px 12px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		border-radius: 100px;
		font-size: 13.5px;
		font-family: var(--body);
		background: #fff;
		color: var(--ink, #0b1e26);
	}

	.chat-send {
		padding: 8px 18px;
		font-size: 13px;
		flex-shrink: 0;
	}
</style>
