// ============================================================
// PadelIndex — Freie Spielzeiten (Datenzugriff)
// ============================================================
// Lesen der EIGENEN Zeiten läuft über den Session-Client (RLS-Policy
// availabilities_self_read). Schreiben über service_role nach Prüfung
// hier — dasselbe Muster wie rewards.ts/club-members.ts. Jede
// schreibende Funktion filtert zusätzlich auf player_id, damit eine
// geratene fremde id auch dann nicht greift, wenn die Prüfung im
// Aufrufer je umgangen würde.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
	validateAvailability,
	type AvailabilityInput,
	type AvailabilityMatchType,
	type AvailabilityStatus,
	type DesiredLevel,
	type PreferredFormat
} from '$lib/availability';

export type Availability = {
	id: string;
	weekday: number | null;
	specificDate: string | null;
	startTime: string;
	endTime: string;
	isRecurring: boolean;
	clubId: string | null;
	clubName: string | null;
	maxDistanceKm: number;
	matchType: AvailabilityMatchType;
	preferredFormat: PreferredFormat;
	desiredLevel: DesiredLevel;
	status: AvailabilityStatus;
};

type AvailabilityRow = {
	id: string;
	weekday: number | null;
	specific_date: string | null;
	start_time: string;
	end_time: string;
	is_recurring: boolean;
	club_id: string | null;
	max_distance_km: number;
	match_type: AvailabilityMatchType;
	preferred_format: PreferredFormat;
	desired_level: DesiredLevel;
	status: AvailabilityStatus;
	clubs?: { name: string } | null;
};

const SELECT_COLUMNS =
	'id, weekday, specific_date, start_time, end_time, is_recurring, club_id, max_distance_km, match_type, preferred_format, desired_level, status, clubs(name)';

/** Postgres liefert time als "HH:MM:SS" — die UI arbeitet durchgehend mit "HH:MM". */
function trimTime(value: string): string {
	return value.slice(0, 5);
}

function toAvailability(row: AvailabilityRow): Availability {
	return {
		id: row.id,
		weekday: row.weekday,
		specificDate: row.specific_date,
		startTime: trimTime(row.start_time),
		endTime: trimTime(row.end_time),
		isRecurring: row.is_recurring,
		clubId: row.club_id,
		clubName: row.clubs?.name ?? null,
		maxDistanceKm: row.max_distance_km,
		matchType: row.match_type,
		preferredFormat: row.preferred_format,
		desiredLevel: row.desired_level,
		status: row.status
	};
}

/** Eigene Zeiten inklusive pausierter — gelöschte bleiben unsichtbar. */
export async function getPlayerAvailabilities(
	supabase: SupabaseClient,
	playerId: string
): Promise<Availability[]> {
	const { data, error } = await supabase
		.from('player_availabilities')
		.select(SELECT_COLUMNS)
		.eq('player_id', playerId)
		.neq('status', 'deleted')
		.order('weekday', { ascending: true })
		.order('start_time', { ascending: true });

	if (error || !data) return [];
	return (data as unknown as AvailabilityRow[]).map(toAvailability);
}

export type AvailabilityWriteResult = { ok: true; id?: string } | { ok: false; message: string };

function toRow(playerId: string, input: AvailabilityInput) {
	return {
		player_id: playerId,
		weekday: input.isRecurring ? input.weekday : null,
		specific_date: input.isRecurring ? null : input.specificDate,
		start_time: input.startTime,
		end_time: input.endTime,
		is_recurring: input.isRecurring,
		club_id: input.clubId,
		max_distance_km: input.maxDistanceKm,
		match_type: input.matchType,
		preferred_format: input.preferredFormat,
		desired_level: input.desiredLevel
	};
}

export const MAX_AVAILABILITIES_PER_PLAYER = 20;

export async function createAvailability(
	admin: SupabaseClient,
	playerId: string,
	input: AvailabilityInput
): Promise<AvailabilityWriteResult> {
	const validation = validateAvailability(input);
	if (!validation.ok) return validation;

	// Obergrenze gegen versehentliches/absichtliches Zumüllen — der
	// Matchmaking-Query lädt die Slots aller Kandidaten, unbegrenzt viele
	// Zeilen pro Person würden ihn direkt teuer machen.
	const { count } = await admin
		.from('player_availabilities')
		.select('id', { count: 'exact', head: true })
		.eq('player_id', playerId)
		.neq('status', 'deleted');

	if ((count ?? 0) >= MAX_AVAILABILITIES_PER_PLAYER) {
		return {
			ok: false,
			message: `Maximal ${MAX_AVAILABILITIES_PER_PLAYER} Spielzeiten. Lösche zuerst eine bestehende.`
		};
	}

	const { data, error } = await admin
		.from('player_availabilities')
		.insert(toRow(playerId, input))
		.select('id')
		.single();

	if (error) return { ok: false, message: error.message };
	return { ok: true, id: data.id };
}

export async function updateAvailability(
	admin: SupabaseClient,
	playerId: string,
	availabilityId: string,
	input: AvailabilityInput
): Promise<AvailabilityWriteResult> {
	const validation = validateAvailability(input);
	if (!validation.ok) return validation;

	const { player_id: _ignored, ...updatable } = toRow(playerId, input);

	const { data, error } = await admin
		.from('player_availabilities')
		.update({ ...updatable, updated_at: new Date().toISOString() })
		.eq('id', availabilityId)
		.eq('player_id', playerId)
		.neq('status', 'deleted')
		.select('id');

	if (error) return { ok: false, message: error.message };
	if (!data || data.length === 0) return { ok: false, message: 'Spielzeit nicht gefunden.' };
	return { ok: true, id: availabilityId };
}

export async function setAvailabilityStatus(
	admin: SupabaseClient,
	playerId: string,
	availabilityId: string,
	status: AvailabilityStatus
): Promise<AvailabilityWriteResult> {
	const { data, error } = await admin
		.from('player_availabilities')
		.update({ status, updated_at: new Date().toISOString() })
		.eq('id', availabilityId)
		.eq('player_id', playerId)
		.select('id');

	if (error) return { ok: false, message: error.message };
	if (!data || data.length === 0) return { ok: false, message: 'Spielzeit nicht gefunden.' };
	return { ok: true, id: availabilityId };
}

/** Löschen ist ein Statuswechsel: play_requests verweisen per FK auf die Zeile. */
export function deleteAvailability(
	admin: SupabaseClient,
	playerId: string,
	availabilityId: string
): Promise<AvailabilityWriteResult> {
	return setAvailabilityStatus(admin, playerId, availabilityId, 'deleted');
}
