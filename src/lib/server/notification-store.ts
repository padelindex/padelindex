// ============================================================
// PadelIndex — In-App-Benachrichtigungen
// ============================================================
// Ergänzt die bestehende E-Mail-Zustellung (lib/server/email.ts, siehe
// 2d3287c) um einen Verlauf IN der App. Beide Wege sind bewusst
// getrennt: E-Mail holt jemanden zurück, die Liste hier beantwortet
// "was ist passiert, während ich weg war".
//
// notify() ist wie sendEmail() best-effort — eine fehlgeschlagene
// Benachrichtigung darf nie den auslösenden Vorgang (Anfrage senden,
// Challenge annehmen) scheitern lassen.

import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationKind =
	| 'play_request_received'
	| 'play_request_accepted'
	| 'play_request_declined'
	| 'challenge_received'
	| 'challenge_accepted'
	| 'challenge_declined'
	| 'challenge_expiring'
	| 'challenge_expired'
	| 'league_substitute_assigned'
	| 'league_substitute_joined'
	| 'league_schedule_reminder'
	| 'league_slot_assigned'
	| 'league_cycle_closed';

export type AppNotification = {
	id: string;
	kind: NotificationKind;
	title: string;
	body: string | null;
	link: string | null;
	readAt: string | null;
	createdAt: string;
};

export type NotificationInput = {
	playerId: string;
	kind: NotificationKind;
	title: string;
	body?: string | null;
	link?: string | null;
};

/** Best-effort: loggt Fehler und läuft weiter, wirft nie. */
export async function notify(admin: SupabaseClient, input: NotificationInput): Promise<void> {
	try {
		const { error } = await admin.from('notifications').insert({
			player_id: input.playerId,
			kind: input.kind,
			title: input.title,
			body: input.body ?? null,
			link: input.link ?? null
		});
		if (error) console.error('Benachrichtigung konnte nicht gespeichert werden', error.message);
	} catch (e) {
		console.error('Benachrichtigung fehlgeschlagen', e);
	}
}

export async function getNotifications(
	supabase: SupabaseClient,
	playerId: string,
	limit = 30
): Promise<AppNotification[]> {
	const { data, error } = await supabase
		.from('notifications')
		.select('id, kind, title, body, link, read_at, created_at')
		.eq('player_id', playerId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error || !data) return [];

	return data.map((row) => ({
		id: row.id,
		kind: row.kind as NotificationKind,
		title: row.title,
		body: row.body,
		link: row.link,
		readAt: row.read_at,
		createdAt: row.created_at
	}));
}

export async function countUnread(supabase: SupabaseClient, playerId: string): Promise<number> {
	const { count, error } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('player_id', playerId)
		.is('read_at', null);

	if (error) return 0;
	return count ?? 0;
}

export async function markAllRead(admin: SupabaseClient, playerId: string): Promise<void> {
	await admin
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('player_id', playerId)
		.is('read_at', null);
}

/**
 * Login-E-Mail eines Spielers, falls vorhanden — für Benachrichtigungen
 * per Mail (play-requests.ts, challenges.ts). null für unbeanspruchte
 * Profile (kein user_id, also kein Postfach) oder wenn die Auth-Zeile
 * aus irgendeinem Grund keine E-Mail trägt.
 */
export async function resolvePlayerEmailAddress(
	admin: SupabaseClient,
	playerId: string
): Promise<string | null> {
	try {
		const { data: player } = await admin
			.from('players')
			.select('user_id')
			.eq('id', playerId)
			.maybeSingle();
		if (!player?.user_id) return null;

		const { data: userRes } = await admin.auth.admin.getUserById(player.user_id);
		return userRes?.user?.email ?? null;
	} catch (e) {
		console.error('E-Mail-Adresse konnte nicht aufgelöst werden', e);
		return null;
	}
}
