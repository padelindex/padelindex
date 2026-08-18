// ============================================================
// PadelIndex — Super-Admin: Vereine & Vereins-Admins pflegen
// ============================================================
// Schreiben läuft über service_role wie überall in diesem Schema — es
// gibt bewusst keine INSERT/UPDATE/DELETE-Policies dafür. Die eigentliche
// Autorisierung ("ist das der Plattform-Owner?") prüft der Aufrufer VOR
// jedem Call über isPlatformOwner() aus platform-owner.ts, nie hier.
//
// Zählungen (Mitglieder/Matches pro Verein) laufen bewusst client-seitig
// über drei einfache Selects statt einer SQL-Aggregat-View — bei der
// aktuellen Größenordnung (eine Handvoll Vereine) unproblematisch, und
// erspart eine weitere Migration nur für diesen einen Screen.

import type { SupabaseClient } from '@supabase/supabase-js';

export type ClubAdminEntry = { playerId: string; handle: string; name: string };

export type ClubOverview = {
	id: string;
	slug: string;
	name: string;
	licenseTier: string;
	memberCount: number;
	matchCount: number;
	admins: ClubAdminEntry[];
};

export async function loadClubOverview(admin: SupabaseClient): Promise<ClubOverview[]> {
	const [{ data: clubs }, { data: memberships }, { data: matches }, { data: admins }] =
		await Promise.all([
			admin.from('clubs').select('id, slug, name, license_tier').order('name', { ascending: true }),
			admin.from('club_memberships').select('club_id'),
			admin.from('matches').select('club_id'),
			admin.from('club_admins').select('club_id, player_id, players(handle, display_name)')
		]);

	const memberCounts = new Map<string, number>();
	for (const m of memberships ?? []) memberCounts.set(m.club_id, (memberCounts.get(m.club_id) ?? 0) + 1);

	const matchCounts = new Map<string, number>();
	for (const m of matches ?? []) {
		if (!m.club_id) continue;
		matchCounts.set(m.club_id, (matchCounts.get(m.club_id) ?? 0) + 1);
	}

	const adminsByClub = new Map<string, ClubAdminEntry[]>();
	for (const row of (admins ?? []) as unknown as {
		club_id: string;
		player_id: string;
		players: { handle: string; display_name: string } | null;
	}[]) {
		if (!row.players) continue;
		const list = adminsByClub.get(row.club_id) ?? [];
		list.push({ playerId: row.player_id, handle: row.players.handle, name: row.players.display_name });
		adminsByClub.set(row.club_id, list);
	}

	return (clubs ?? []).map((c) => ({
		id: c.id,
		slug: c.slug,
		name: c.name,
		licenseTier: c.license_tier,
		memberCount: memberCounts.get(c.id) ?? 0,
		matchCount: matchCounts.get(c.id) ?? 0,
		admins: adminsByClub.get(c.id) ?? []
	}));
}

export type ClubWriteResult = { ok: true } | { ok: false; message: string };

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LICENSE_TIERS = ['free', 'basic', 'pro'];

function validateClubInput(input: { name: string; slug: string; licenseTier: string }): string | null {
	if (!input.name.trim()) return 'Vereinsname darf nicht leer sein.';
	if (input.name.length > 120) return 'Vereinsname ist zu lang.';
	if (!SLUG_PATTERN.test(input.slug)) {
		return 'Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten (z. B. "mein-verein").';
	}
	if (!LICENSE_TIERS.includes(input.licenseTier)) return 'Ungültige Lizenzstufe.';
	return null;
}

export async function createClub(
	admin: SupabaseClient,
	input: { name: string; slug: string; licenseTier: string }
): Promise<ClubWriteResult> {
	const validationError = validateClubInput(input);
	if (validationError) return { ok: false, message: validationError };

	const { error } = await admin.from('clubs').insert({
		name: input.name.trim(),
		slug: input.slug,
		license_tier: input.licenseTier
	});

	if (error) {
		if (error.code === '23505') return { ok: false, message: 'Slug ist bereits vergeben.' };
		return { ok: false, message: error.message };
	}
	return { ok: true };
}

export async function updateLicenseTier(
	admin: SupabaseClient,
	clubId: string,
	licenseTier: string
): Promise<ClubWriteResult> {
	if (!LICENSE_TIERS.includes(licenseTier)) return { ok: false, message: 'Ungültige Lizenzstufe.' };

	const { error } = await admin.from('clubs').update({ license_tier: licenseTier }).eq('id', clubId);
	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

export type PlayerSearchResult = { id: string; handle: string; name: string };

/**
 * Nur registrierte (user_id gesetzt) Spieler — ein unbeanspruchtes
 * Profil kann sich nicht einloggen und damit auch keinen Verein
 * administrieren. Zwei ilike()-Queries statt eines rohen .or()-Strings,
 * damit die Sucheingabe nicht als PostgREST-Filterausdruck geparst wird
 * (gleiches Muster wie searchClaimablePlayersNotInClub in club-members.ts).
 */
export async function searchClaimedPlayers(
	admin: SupabaseClient,
	query: string
): Promise<PlayerSearchResult[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) return [];

	const pattern = `%${trimmed}%`;
	const [byName, byHandle] = await Promise.all([
		admin
			.from('players')
			.select('id, handle, display_name')
			.not('user_id', 'is', null)
			.ilike('display_name', pattern)
			.limit(10),
		admin
			.from('players')
			.select('id, handle, display_name')
			.not('user_id', 'is', null)
			.ilike('handle', pattern)
			.limit(10)
	]);

	const byId = new Map<string, PlayerSearchResult>();
	for (const row of [...(byName.data ?? []), ...(byHandle.data ?? [])]) {
		byId.set(row.id, { id: row.id, handle: row.handle, name: row.display_name });
	}
	return [...byId.values()].slice(0, 10);
}

export async function addClubAdmin(
	admin: SupabaseClient,
	clubId: string,
	playerId: string
): Promise<ClubWriteResult> {
	const { error } = await admin.from('club_admins').insert({ club_id: clubId, player_id: playerId });

	if (error) {
		if (error.code === '23505') return { ok: false, message: 'Ist bereits Admin dieses Vereins.' };
		return { ok: false, message: error.message };
	}
	return { ok: true };
}

export async function removeClubAdmin(
	admin: SupabaseClient,
	clubId: string,
	playerId: string
): Promise<ClubWriteResult> {
	const { error } = await admin
		.from('club_admins')
		.delete()
		.eq('club_id', clubId)
		.eq('player_id', playerId);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}
