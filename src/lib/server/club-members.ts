// ============================================================
// PadelIndex — Vereins-Admin: Mitglieder pflegen
// ============================================================
// Schreiben läuft über service_role, wie überall in diesem Schema —
// es gibt bewusst keine INSERT/UPDATE/DELETE-Policies auf
// club_memberships für Admins. Die eigentliche Autorisierung ("ist
// diese Person Admin GENAU dieses Vereins?") prüft der Aufrufer VOR
// jedem Call über isClubAdmin() aus club-admin.ts, nie hier — diese
// Funktionen vertrauen der übergebenen clubId.

import type { SupabaseClient } from '@supabase/supabase-js';
import { formatPlayerName } from '$lib/claim-match';

export type ClubMember = {
	id: string;
	handle: string;
	name: string;
	claimed: boolean;
	rating: number;
	matchesPlayed: number;
};

type MemberRow = {
	id: string;
	handle: string;
	display_name: string;
	claim_status: string;
	show_full_name: boolean;
	rating: number;
	matches_played: number;
};

export async function loadClubMembers(admin: SupabaseClient, clubId: string): Promise<ClubMember[]> {
	const { data, error } = await admin
		.from('club_memberships')
		.select('players!inner(id, handle, display_name, claim_status, show_full_name, rating, matches_played)')
		.eq('club_id', clubId);

	if (error || !data) return [];

	return (data as unknown as { players: MemberRow }[])
		.map((row) => row.players)
		.map((p) => ({
			id: p.id,
			handle: p.handle,
			name: formatPlayerName(p.display_name, p.claim_status, p.show_full_name),
			claimed: p.claim_status === 'claimed',
			rating: Number(p.rating),
			matchesPlayed: p.matches_played
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export type PlayerSearchResult = { id: string; handle: string; name: string };

/**
 * Nur registrierte (user_id gesetzt) Spieler, die noch in KEINEM
 * Verein dieses Vereins sind — unbeanspruchte Import-Profile fremder
 * Vereine lassen sich über die Suche bewusst nicht "kapern", dafür
 * gibt es addUnclaimedMember() für einen eigenen neuen Platzhalter.
 * Zwei getrennte ilike()-Queries statt eines rohen .or()-Strings, damit
 * die Sucheingabe nicht als PostgREST-Filterausdruck geparst wird.
 */
export async function searchClaimablePlayersNotInClub(
	admin: SupabaseClient,
	clubId: string,
	query: string
): Promise<PlayerSearchResult[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) return [];

	const { data: existing } = await admin
		.from('club_memberships')
		.select('player_id')
		.eq('club_id', clubId);
	const existingIds = (existing ?? []).map((r) => r.player_id);

	const pattern = `%${trimmed}%`;
	// existingIds sind eigene, bereits abgefragte UUIDs — sicher als Roh-
	// string interpolierbar (keine Nutzereingabe, im Gegensatz zu query).
	const exclusion = existingIds.length > 0 ? `(${existingIds.join(',')})` : null;

	function searchColumn(column: 'display_name' | 'handle') {
		const base = admin
			.from('players')
			.select('id, handle, display_name')
			.not('user_id', 'is', null)
			.ilike(column, pattern)
			.limit(10);
		return exclusion ? base.not('id', 'in', exclusion) : base;
	}

	const [byName, byHandle] = await Promise.all([
		searchColumn('display_name'),
		searchColumn('handle')
	]);

	const byId = new Map<string, PlayerSearchResult>();
	for (const row of [...(byName.data ?? []), ...(byHandle.data ?? [])]) {
		byId.set(row.id, { id: row.id, handle: row.handle, name: row.display_name });
	}
	return [...byId.values()].slice(0, 10);
}

export type MemberWriteResult = { ok: true } | { ok: false; message: string };

export async function addExistingPlayerToClub(
	admin: SupabaseClient,
	clubId: string,
	playerId: string
): Promise<MemberWriteResult> {
	const { error } = await admin
		.from('club_memberships')
		.insert({ club_id: clubId, player_id: playerId });

	if (error) {
		if (error.code === '23505') return { ok: false, message: 'Ist bereits Mitglied.' };
		return { ok: false, message: error.message };
	}
	return { ok: true };
}

export async function addUnclaimedMember(
	admin: SupabaseClient,
	clubId: string,
	displayName: string
): Promise<MemberWriteResult> {
	const name = displayName.trim();
	if (!name) return { ok: false, message: 'Name darf nicht leer sein.' };
	if (name.length > 120) return { ok: false, message: 'Name ist zu lang.' };

	const { error } = await admin.rpc('admin_add_unclaimed_member', {
		p_club_id: clubId,
		p_display_name: name
	});

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

export async function removeMemberFromClub(
	admin: SupabaseClient,
	clubId: string,
	playerId: string
): Promise<MemberWriteResult> {
	const { error } = await admin
		.from('club_memberships')
		.delete()
		.eq('club_id', clubId)
		.eq('player_id', playerId);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}
