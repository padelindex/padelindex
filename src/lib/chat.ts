// ============================================================
// PadelIndex — Match-Chat: gemeinsame Typen (Client + Server)
// ============================================================
// Siehe supabase/migrations/0023_match_chat.sql: ein Chat-Thread gehört
// immer zu genau einem von vier Kontexten. Welcher das ist, muss der
// Aufrufer mitgeben (die Einbettungsstelle — Box-Seite, Anfragen-Liste,
// Konto — kennt ihr eigenes Datenmodell ohnehin) statt es per
// Zusatz-Query aus der bloßen ID zu erraten.

export type ChatContextType = 'match' | 'league_box_match' | 'league_box' | 'play_request';

/** Welche Spalte in match_messages für welchen Kontext gesetzt wird. */
export const CHAT_CONTEXT_COLUMN = {
	match: 'match_id',
	league_box_match: 'league_box_match_id',
	league_box: 'league_box_id',
	play_request: 'play_request_id'
} as const satisfies Record<ChatContextType, string>;

export type ChatMessageKind = 'user' | 'system';

export type ChatMessage = {
	id: string;
	kind: ChatMessageKind;
	senderId: string | null;
	senderName: string | null;
	senderAvatarUrl: string | null;
	content: string;
	createdAt: string;
};

type ChatMessageRow = {
	id: string;
	kind: ChatMessageKind;
	sender_id: string | null;
	sender_name: string | null;
	sender_avatar_url: string | null;
	content: string;
	created_at: string;
};

/** Spaltenliste für .select() — an einer Stelle gepflegt, Client und Server brauchen dieselbe. */
export const CHAT_MESSAGE_COLUMNS =
	'id, kind, sender_id, sender_name, sender_avatar_url, content, created_at';

export function mapChatMessageRow(row: ChatMessageRow): ChatMessage {
	return {
		id: row.id,
		kind: row.kind,
		senderId: row.sender_id,
		senderName: row.sender_name,
		senderAvatarUrl: row.sender_avatar_url,
		content: row.content,
		createdAt: row.created_at
	};
}

const MAX_MESSAGE_LENGTH = 2000;

/** Trimmt & kürzt wie cleanMessage() in play-requests.ts — leer nach dem Trimmen ist ungültig. */
export function cleanChatMessage(content: string): string | null {
	const trimmed = content.trim();
	if (!trimmed) return null;
	return trimmed.slice(0, MAX_MESSAGE_LENGTH);
}
