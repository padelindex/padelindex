// ============================================================
// PadelIndex — Vereins-Admin: Autorisierung
// ============================================================
//
// club_admins ist absichtlich winzig (nur club_id + player_id, siehe
// 0009_club_admin.sql) — die eigentliche Prüfung "darf diese Person
// diesen Verein verwalten?" läuft hier, per Session-Client. RLS
// (club_admins_self_read) sorgt dafür, dass ein Spieler ohnehin nur
// seine EIGENEN Admin-Zeilen sehen kann; loadAdminClubs() muss also gar
// nicht extra nach player_id filtern — die Policy tut das schon.

import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminClub = { id: string; slug: string; name: string };

/** Für den "Vereins-Admin"-Link auf /konto — leer, wenn niemand-Admin. */
export async function loadAdminClubs(
	supabase: SupabaseClient,
	playerId: string
): Promise<AdminClub[]> {
	const { data, error } = await supabase
		.from('club_admins')
		.select('clubs(id, slug, name)')
		.eq('player_id', playerId);

	if (error || !data) return [];

	return data
		.map((row) => (row as unknown as { clubs: AdminClub | null }).clubs)
		.filter((c): c is AdminClub => c !== null);
}

/**
 * Muss vor JEDER Schreibaktion in /verein/[slug] erneut geprüft werden —
 * nie nur einmal beim Laden der Seite. Der Slug in der URL ist
 * Nutzereingabe; ohne diese Prüfung könnte jeder eingeloggte Spieler
 * per direktem POST an einen fremden Vereins-Slug dessen Prämien ändern.
 */
export async function isClubAdmin(
	supabase: SupabaseClient,
	clubId: string,
	playerId: string
): Promise<boolean> {
	const { data } = await supabase
		.from('club_admins')
		.select('club_id')
		.eq('club_id', clubId)
		.eq('player_id', playerId)
		.maybeSingle();

	return data !== null;
}
