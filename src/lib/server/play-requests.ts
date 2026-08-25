// ============================================================
// PadelIndex — Spielanfragen (Datenzugriff)
// ============================================================
// Lesen über den Session-Client (RLS: play_requests_involved_read),
// Schreiben über service_role nach Prüfung hier. Jede Statusänderung
// prüft (a) die Berechtigung — nur der Empfänger nimmt an/lehnt ab, nur
// der Absender zieht zurück — und (b) den Statusübergang selbst, damit
// eine abgelaufene oder bereits beantwortete Anfrage nicht nachträglich
// angenommen werden kann.

import type { SupabaseClient } from '@supabase/supabase-js';
import { formatPlayerName } from '$lib/claim-match';
import type { AvailabilityMatchType } from '$lib/availability';
import { canTransitionPlayRequest, isExpired, type PlayRequestStatus } from '$lib/challenge-rules';
import { postSystemMessage } from '$lib/server/chat';
import { notify, resolvePlayerEmailAddress } from './notification-store';
import { sendEmail, type EmailEnv } from './email';
import {
	playRequestAcceptedEmail,
	playRequestDeclinedEmail,
	playRequestEmail
} from '$lib/notifications';

export type PlayRequest = {
	id: string;
	direction: 'incoming' | 'outgoing';
	counterpartId: string;
	counterpartHandle: string;
	counterpartName: string;
	proposedDate: string;
	proposedStart: string;
	proposedEnd: string;
	clubName: string | null;
	locationText: string | null;
	matchType: AvailabilityMatchType;
	message: string | null;
	status: PlayRequestStatus;
	expiresAt: string;
	createdAt: string;
};

type RequestRow = {
	id: string;
	sender_id: string;
	receiver_id: string;
	proposed_date: string;
	proposed_start: string;
	proposed_end: string;
	club_id: string | null;
	location_text: string | null;
	match_type: AvailabilityMatchType;
	message: string | null;
	status: PlayRequestStatus;
	expires_at: string;
	created_at: string;
	clubs?: { name: string } | null;
};

const COLUMNS =
	'id, sender_id, receiver_id, proposed_date, proposed_start, proposed_end, club_id, location_text, match_type, message, status, expires_at, created_at, clubs(name)';

const trimTime = (v: string) => v.slice(0, 5);

/**
 * Namen fremder Spieler kommen per Admin-Client — RLS auf players gibt nur
 * die eigene Zeile frei. Zulässig, weil vorher feststeht, dass die
 * anfragende Person an genau diesen Anfragen beteiligt ist.
 */
export async function getPlayRequests(
	supabase: SupabaseClient,
	admin: SupabaseClient,
	playerId: string
): Promise<{ incoming: PlayRequest[]; outgoing: PlayRequest[] }> {
	const { data, error } = await supabase
		.from('play_requests')
		.select(COLUMNS)
		.order('created_at', { ascending: false })
		.limit(100);

	if (error || !data) return { incoming: [], outgoing: [] };

	const rows = data as unknown as RequestRow[];
	const counterpartIds = [
		...new Set(rows.map((r) => (r.sender_id === playerId ? r.receiver_id : r.sender_id)))
	];

	const names = await loadPlayerNames(admin, counterpartIds);

	const toRequest = (row: RequestRow): PlayRequest => {
		const outgoing = row.sender_id === playerId;
		const counterpartId = outgoing ? row.receiver_id : row.sender_id;
		const counterpart = names.get(counterpartId);

		return {
			id: row.id,
			direction: outgoing ? 'outgoing' : 'incoming',
			counterpartId,
			counterpartHandle: counterpart?.handle ?? '',
			counterpartName: counterpart?.name ?? 'Unbekannt',
			proposedDate: row.proposed_date,
			proposedStart: trimTime(row.proposed_start),
			proposedEnd: trimTime(row.proposed_end),
			clubName: row.clubs?.name ?? null,
			locationText: row.location_text,
			matchType: row.match_type,
			message: row.message,
			status: row.status,
			expiresAt: row.expires_at,
			createdAt: row.created_at
		};
	};

	return {
		incoming: rows.filter((r) => r.receiver_id === playerId).map(toRequest),
		outgoing: rows.filter((r) => r.sender_id === playerId).map(toRequest)
	};
}

export async function loadPlayerNames(
	admin: SupabaseClient,
	ids: string[]
): Promise<Map<string, { handle: string; name: string }>> {
	const map = new Map<string, { handle: string; name: string }>();
	if (ids.length === 0) return map;

	const { data } = await admin
		.from('players')
		.select('id, handle, display_name, claim_status, show_full_name')
		.in('id', ids);

	for (const row of data ?? []) {
		map.set(row.id, {
			handle: row.handle,
			name: formatPlayerName(row.display_name, row.claim_status, row.show_full_name)
		});
	}
	return map;
}

export type PlayRequestInput = {
	receiverId: string;
	availabilityId?: string | null;
	proposedDate: string;
	proposedStart: string;
	proposedEnd: string;
	clubId?: string | null;
	locationText?: string | null;
	matchType: AvailabilityMatchType;
	message?: string | null;
};

export type RequestResult = { ok: true; id: string } | { ok: false; message: string };
export type ActionResult = { ok: true } | { ok: false; message: string };

const MAX_MESSAGE_LENGTH = 500;

/** Freitext wird gekürzt und getrimmt; das Escaping passiert beim Rendern (Svelte) bzw. in notifications.ts (E-Mail). */
function cleanMessage(message: string | null | undefined): string | null {
	const trimmed = (message ?? '').trim();
	if (!trimmed) return null;
	return trimmed.slice(0, MAX_MESSAGE_LENGTH);
}

export async function createPlayRequest(
	admin: SupabaseClient,
	senderId: string,
	input: PlayRequestInput,
	notifyCtx?: { emailEnv: EmailEnv | null; baseUrl: string; senderName: string }
): Promise<RequestResult> {
	if (senderId === input.receiverId) {
		return { ok: false, message: 'Du kannst dir selbst keine Anfrage senden.' };
	}
	if (input.proposedEnd <= input.proposedStart) {
		return { ok: false, message: 'Die Endzeit muss nach der Startzeit liegen.' };
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.proposedDate)) {
		return { ok: false, message: 'Bitte ein gültiges Datum angeben.' };
	}
	if (input.proposedDate < new Date().toISOString().slice(0, 10)) {
		return { ok: false, message: 'Das Datum liegt in der Vergangenheit.' };
	}

	// Blockiert der Empfänger mich? Dann gar nicht erst zustellen — aber ohne
	// das zu verraten (kein Oracle über Blocklisten).
	const { data: blocked } = await admin
		.from('suggestion_dismissals')
		.select('blocked')
		.eq('player_id', input.receiverId)
		.eq('dismissed_player_id', senderId)
		.maybeSingle();

	if (blocked?.blocked) {
		return { ok: false, message: 'Anfrage konnte nicht zugestellt werden.' };
	}

	const { data, error } = await admin
		.from('play_requests')
		.insert({
			sender_id: senderId,
			receiver_id: input.receiverId,
			availability_id: input.availabilityId ?? null,
			proposed_date: input.proposedDate,
			proposed_start: input.proposedStart,
			proposed_end: input.proposedEnd,
			club_id: input.clubId ?? null,
			location_text: cleanMessage(input.locationText),
			match_type: input.matchType,
			message: cleanMessage(input.message)
		})
		.select('id')
		.single();

	if (error) {
		// Teilindex play_requests_one_open_idx (0013)
		if (error.code === '23505') {
			return {
				ok: false,
				message: 'Du hast diesem Spieler bereits eine offene Anfrage geschickt.'
			};
		}
		return { ok: false, message: error.message };
	}

	await notifyPlayRequest(admin, {
		playerId: input.receiverId,
		kind: 'play_request_received',
		title: `Neue Spielanfrage von ${notifyCtx?.senderName ?? 'einem Spieler'}`,
		body: `${input.proposedDate}, ${input.proposedStart}–${input.proposedEnd}`,
		link: '/anfragen',
		email: notifyCtx
			? {
					env: notifyCtx.emailEnv,
					subjectName: notifyCtx.senderName,
					date: input.proposedDate,
					start: input.proposedStart,
					end: input.proposedEnd,
					url: `${notifyCtx.baseUrl}/anfragen`
				}
			: undefined
	});

	return { ok: true, id: data.id };
}

/** Lädt eine Anfrage und prüft Berechtigung + Statusübergang in einem Schritt. */
async function loadForTransition(
	admin: SupabaseClient,
	requestId: string,
	playerId: string,
	role: 'sender' | 'receiver',
	target: PlayRequestStatus
): Promise<{ ok: true; row: RequestRow } | { ok: false; message: string }> {
	const { data, error } = await admin
		.from('play_requests')
		.select(COLUMNS)
		.eq('id', requestId)
		.maybeSingle();

	if (error) return { ok: false, message: error.message };
	if (!data) return { ok: false, message: 'Anfrage nicht gefunden.' };

	const row = data as unknown as RequestRow;
	const allowedId = role === 'sender' ? row.sender_id : row.receiver_id;
	// Bewusst dieselbe Meldung wie "nicht gefunden": wer nicht beteiligt ist,
	// soll nicht erfahren, ob diese id existiert.
	if (allowedId !== playerId) return { ok: false, message: 'Anfrage nicht gefunden.' };

	if (!canTransitionPlayRequest(row.status, target)) {
		return { ok: false, message: `Diese Anfrage ist bereits ${statusWord(row.status)}.` };
	}
	if (target !== 'expired' && isExpired(row.expires_at)) {
		return { ok: false, message: 'Diese Anfrage ist abgelaufen.' };
	}

	return { ok: true, row };
}

function statusWord(status: PlayRequestStatus): string {
	return {
		pending: 'offen',
		accepted: 'angenommen',
		declined: 'abgelehnt',
		cancelled: 'zurückgezogen',
		expired: 'abgelaufen'
	}[status];
}

async function setStatus(
	admin: SupabaseClient,
	requestId: string,
	from: PlayRequestStatus,
	to: PlayRequestStatus
): Promise<boolean> {
	// status im WHERE: zwei gleichzeitige Klicks (annehmen + ablehnen) dürfen
	// sich nicht überschreiben — der zweite trifft dann null Zeilen.
	const { data } = await admin
		.from('play_requests')
		.update({ status: to, updated_at: new Date().toISOString() })
		.eq('id', requestId)
		.eq('status', from)
		.select('id');

	return (data?.length ?? 0) > 0;
}

export async function acceptPlayRequest(
	admin: SupabaseClient,
	requestId: string,
	playerId: string,
	receiverName: string,
	notifyCtx?: { emailEnv: EmailEnv | null; baseUrl: string }
): Promise<ActionResult> {
	const loaded = await loadForTransition(admin, requestId, playerId, 'receiver', 'accepted');
	if (!loaded.ok) return loaded;

	if (!(await setStatus(admin, requestId, 'pending', 'accepted'))) {
		return { ok: false, message: 'Diese Anfrage wurde bereits beantwortet.' };
	}

	await postSystemMessage(
		admin,
		'play_request',
		requestId,
		`${receiverName} hat die Anfrage angenommen.`
	);

	await notify(admin, {
		playerId: loaded.row.sender_id,
		kind: 'play_request_accepted',
		title: `${receiverName} hat deine Spielanfrage angenommen`,
		body: `${loaded.row.proposed_date}, ${trimTime(loaded.row.proposed_start)}–${trimTime(loaded.row.proposed_end)}`,
		link: '/anfragen'
	});

	if (notifyCtx) {
		await sendPlayRequestAnswerEmail(admin, loaded.row.sender_id, notifyCtx, (address) => {
			const { subject, html } = playRequestAcceptedEmail({
				responderName: receiverName,
				date: loaded.row.proposed_date,
				startTime: trimTime(loaded.row.proposed_start),
				endTime: trimTime(loaded.row.proposed_end),
				url: `${notifyCtx.baseUrl}/anfragen`
			});
			return { to: address, subject, html };
		});
	}

	return { ok: true };
}

export async function declinePlayRequest(
	admin: SupabaseClient,
	requestId: string,
	playerId: string,
	receiverName: string,
	notifyCtx?: { emailEnv: EmailEnv | null; baseUrl: string }
): Promise<ActionResult> {
	const loaded = await loadForTransition(admin, requestId, playerId, 'receiver', 'declined');
	if (!loaded.ok) return loaded;

	if (!(await setStatus(admin, requestId, 'pending', 'declined'))) {
		return { ok: false, message: 'Diese Anfrage wurde bereits beantwortet.' };
	}

	await notify(admin, {
		playerId: loaded.row.sender_id,
		kind: 'play_request_declined',
		title: `${receiverName} hat deine Spielanfrage abgelehnt`,
		link: '/anfragen'
	});

	if (notifyCtx) {
		await sendPlayRequestAnswerEmail(admin, loaded.row.sender_id, notifyCtx, (address) => {
			const { subject, html } = playRequestDeclinedEmail({
				responderName: receiverName,
				url: `${notifyCtx.baseUrl}/spieler-finden`
			});
			return { to: address, subject, html };
		});
	}

	return { ok: true };
}

/** Gemeinsamer Best-effort-Versand für accept/decline — löst die Adresse auf, ruft die übergebene Template-Funktion, schickt ab. */
async function sendPlayRequestAnswerEmail(
	admin: SupabaseClient,
	playerId: string,
	notifyCtx: { emailEnv: EmailEnv | null; baseUrl: string },
	buildMessage: (address: string) => { to: string; subject: string; html: string }
): Promise<void> {
	try {
		const address = await resolvePlayerEmailAddress(admin, playerId);
		if (!address) return;
		await sendEmail(notifyCtx.emailEnv, buildMessage(address));
	} catch (e) {
		console.error('E-Mail zur Spielanfrage-Antwort fehlgeschlagen', e);
	}
}

export async function cancelPlayRequest(
	admin: SupabaseClient,
	requestId: string,
	playerId: string
): Promise<ActionResult> {
	const loaded = await loadForTransition(admin, requestId, playerId, 'sender', 'cancelled');
	if (!loaded.ok) return loaded;

	if (!(await setStatus(admin, requestId, 'pending', 'cancelled'))) {
		return { ok: false, message: 'Diese Anfrage wurde bereits beantwortet.' };
	}
	return { ok: true };
}

async function notifyPlayRequest(
	admin: SupabaseClient,
	input: {
		playerId: string;
		kind: 'play_request_received';
		title: string;
		body: string;
		link: string;
		email?: {
			env: EmailEnv | null;
			subjectName: string;
			date: string;
			start: string;
			end: string;
			url: string;
		};
	}
): Promise<void> {
	await notify(admin, {
		playerId: input.playerId,
		kind: input.kind,
		title: input.title,
		body: input.body,
		link: input.link
	});

	if (!input.email) return;

	try {
		const address = await resolvePlayerEmailAddress(admin, input.playerId);
		if (!address) return;

		const { subject, html } = playRequestEmail({
			senderName: input.email.subjectName,
			date: input.email.date,
			startTime: input.email.start,
			endTime: input.email.end,
			url: input.email.url
		});
		await sendEmail(input.email.env, { to: address, subject, html });
	} catch (e) {
		console.error('E-Mail zur Spielanfrage fehlgeschlagen', e);
	}
}
