// ============================================================
// PadelIndex — Padel Roulette
// ============================================================
// Slots legt ausschließlich ein Vereins-Admin an (isClubAdmin(), siehe
// club-admin.ts) — das prüft jede Aktion selbst nochmal, nie nur einmal
// beim Laden. Beitreten/Verlassen ist dagegen für jedes eingeloggte
// Vereinsmitglied offen.
//
// Schreiben läuft über service_role (Admin-Client), außer beim Beitritt
// selbst: roulette_join() (0018) prüft Vier-Personen-Limit und
// Vereinsmitgliedschaft atomar in einer SQL-Funktion — ein
// Client-seitiger "zähl dann füg ein"-Check wäre ein Wettlauf zwischen
// zwei gleichzeitigen Beitritten.
//
// Wird ein Slot voll (4 Zusagen), entsteht daraus KEIN eigener
// Rating-Pfad: die vier melden ihr Ergebnis ganz normal über
// /c/[slug]/match/neu (create_match_report, 0006) — Padel Roulette ist
// nur die Vermittlung, nicht die Wertung.

import type { SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';

export type RouletteSignup = {
	playerId: string;
	name: string;
	handle: string;
};

export type RouletteSlot = {
	id: string;
	startsAt: string;
	durationMin: number;
	court: string | null;
	info: string | null;
	signups: RouletteSignup[];
};

type SlotRow = {
	id: string;
	starts_at: string;
	duration_min: number;
	court: string | null;
	info: string | null;
	roulette_signups: { player_id: string; players: { display_name: string; handle: string } | null }[];
};

/** Offene (nicht abgesagte) Slots eines Vereins, jüngste zuerst abgelaufene noch 2 Tage sichtbar. */
export async function loadOpenSlotsForClub(
	admin: SupabaseClient,
	clubId: string
): Promise<RouletteSlot[]> {
	const { data, error: err } = await admin
		.from('roulette_slots')
		.select(
			'id, starts_at, duration_min, court, info, roulette_signups(player_id, players(display_name, handle))'
		)
		.eq('club_id', clubId)
		.eq('cancelled', false)
		.gt('starts_at', new Date(Date.now() - 2 * 86_400_000).toISOString())
		.order('starts_at', { ascending: true });

	if (err) throw error(500, err.message);

	return ((data ?? []) as unknown as SlotRow[]).map((row) => ({
		id: row.id,
		startsAt: row.starts_at,
		durationMin: row.duration_min,
		court: row.court,
		info: row.info,
		signups: (row.roulette_signups ?? []).map((s) => ({
			playerId: s.player_id,
			name: s.players?.display_name ?? '?',
			handle: s.players?.handle ?? ''
		}))
	}));
}

const JOIN_ERROR_MESSAGES: Record<string, string> = {
	WEG: 'Dieser Termin gibt es nicht mehr.',
	VOLL: 'Der Termin ist inzwischen voll.',
	KEIN_MITGLIED: 'Du bist kein Mitglied dieses Vereins.'
};

export async function joinSlot(
	admin: SupabaseClient,
	slotId: string,
	playerId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const { error: err } = await admin.rpc('roulette_join', { p_slot: slotId, p_player: playerId });
	if (err) {
		return { ok: false, message: JOIN_ERROR_MESSAGES[err.message] ?? 'Das hat nicht geklappt.' };
	}
	return { ok: true };
}

export async function leaveSlot(admin: SupabaseClient, slotId: string, playerId: string): Promise<void> {
	await admin.from('roulette_signups').delete().eq('slot_id', slotId).eq('player_id', playerId);
}

export type CreateSlotInput = {
	startsAt: string; // ISO
	durationMin: number;
	court: string | null;
	info: string | null;
};

export async function createSlot(
	admin: SupabaseClient,
	clubId: string,
	createdBy: string,
	input: CreateSlotInput
): Promise<{ ok: true } | { ok: false; message: string }> {
	const { error: err } = await admin.from('roulette_slots').insert({
		club_id: clubId,
		created_by: createdBy,
		starts_at: input.startsAt,
		duration_min: input.durationMin,
		court: input.court,
		info: input.info
	});
	if (err) return { ok: false, message: err.message };
	return { ok: true };
}

/** Scoped auf clubId — ein Admin darf nur Slots des eigenen Vereins canceln. */
export async function cancelSlot(admin: SupabaseClient, slotId: string, clubId: string): Promise<void> {
	await admin.from('roulette_slots').update({ cancelled: true }).eq('id', slotId).eq('club_id', clubId);
}

export type AdminSlot = RouletteSlot & { cancelled: boolean };

export async function loadSlotsForAdmin(admin: SupabaseClient, clubId: string): Promise<AdminSlot[]> {
	const { data, error: err } = await admin
		.from('roulette_slots')
		.select(
			'id, starts_at, duration_min, court, info, cancelled, roulette_signups(player_id, players(display_name, handle))'
		)
		.eq('club_id', clubId)
		.gt('starts_at', new Date(Date.now() - 2 * 86_400_000).toISOString())
		.order('starts_at', { ascending: true });

	if (err) throw error(500, err.message);

	return ((data ?? []) as unknown as (SlotRow & { cancelled: boolean })[]).map((row) => ({
		id: row.id,
		startsAt: row.starts_at,
		durationMin: row.duration_min,
		court: row.court,
		info: row.info,
		cancelled: row.cancelled,
		signups: (row.roulette_signups ?? []).map((s) => ({
			playerId: s.player_id,
			name: s.players?.display_name ?? '?',
			handle: s.players?.handle ?? ''
		}))
	}));
}
