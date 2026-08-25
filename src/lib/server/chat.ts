// ============================================================
// PadelIndex — Match-Chat: Serverseitige Helfer
// ============================================================
// Zwei Aufgaben, beide best-effort (dürfen den aufrufenden Flow nie zum
// Absturz bringen — ein fehlgeschlagenes Unread-Badge oder eine
// verlorene Systemnachricht ist kein Grund, z. B. das Melden eines
// Ergebnisses fehlschlagen zu lassen):
//
//   1. postSystemMessage() — Systemnachrichten ("Termin wurde geändert")
//      laufen über service_role, weil match_messages_insert (0023) nur
//      kind='user' erlaubt; service_role umgeht RLS wie überall sonst in
//      diesem Schema.
//   2. getUnreadThreadKeys() — für die roten Badges in den Übersichten.
//      Läuft über den Session-Client: match_messages_select filtert
//      ohnehin auf das, was die aufrufende Person sehen darf, ein
//      Admin-Client würde hier nur unnötig weite Rechte brauchen.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CHAT_CONTEXT_COLUMN, type ChatContextType } from '$lib/chat';

export async function postSystemMessage(
	admin: SupabaseClient,
	contextType: ChatContextType,
	contextId: string,
	content: string
): Promise<void> {
	try {
		const column = CHAT_CONTEXT_COLUMN[contextType];
		const { error } = await admin.from('match_messages').insert({
			[column]: contextId,
			kind: 'system',
			content
		});
		if (error) console.error('Systemnachricht im Chat fehlgeschlagen', error);
	} catch (e) {
		console.error('Systemnachricht im Chat fehlgeschlagen', e);
	}
}

/**
 * Von den übergebenen Thread-Keys (thread_key aus match_messages — für
 * jeden der vier Kontexte identisch mit dessen eigener ID, siehe 0023):
 * welche haben seit dem letzten Lesevermerk der aufrufenden Person neue
 * Nachrichten? Zwei schmale Abfragen statt eines Joins, weil
 * match_message_reads pro Person nur ein paar Dutzend Zeilen hat.
 */
export async function getUnreadThreadKeys(
	supabase: SupabaseClient,
	threadKeys: string[]
): Promise<Set<string>> {
	const keys = [...new Set(threadKeys.filter(Boolean))];
	if (keys.length === 0) return new Set();

	try {
		const [{ data: messages }, { data: reads }] = await Promise.all([
			supabase
				.from('match_messages')
				.select('thread_key, created_at')
				.in('thread_key', keys)
				.order('created_at', { ascending: false }),
			supabase.from('match_message_reads').select('thread_key, last_read_at').in('thread_key', keys)
		]);

		// Erstes Vorkommen je thread_key ist wegen der absteigenden Sortierung
		// automatisch die jüngste Nachricht dieses Threads.
		const lastMessageAt = new Map<string, string>();
		for (const row of messages ?? []) {
			if (!lastMessageAt.has(row.thread_key)) lastMessageAt.set(row.thread_key, row.created_at);
		}

		const lastReadAt = new Map((reads ?? []).map((r) => [r.thread_key, r.last_read_at] as const));

		const unread = new Set<string>();
		for (const [key, messageAt] of lastMessageAt) {
			const readAt = lastReadAt.get(key);
			if (!readAt || readAt < messageAt) unread.add(key);
		}
		return unread;
	} catch (e) {
		console.error('Unread-Status für Chat konnte nicht geladen werden', e);
		return new Set();
	}
}
