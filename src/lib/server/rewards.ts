// ============================================================
// PadelIndex — Prämienkatalog und Einlösen für /konto
// ============================================================
//
// Katalog lesen läuft über den Session-Client (RLS: rewards_public_read,
// active=true — Vereins-öffentliche Info, wie clubs/club_memberships).
// Einlösen läuft wie Match-Bestätigung über service_role + eine atomare
// SQL-Funktion (redeem_reward in 0008_rewards.sql) — der Kontostand wird
// dort unter einem Advisory Lock geprüft, das darf kein Client-Call sein.

import type { SupabaseClient } from '@supabase/supabase-js';

export type RewardCatalogEntry = {
	id: string;
	title: string;
	description: string | null;
	cost: number;
};

export async function loadRewardCatalog(
	supabase: SupabaseClient,
	clubId: string
): Promise<RewardCatalogEntry[]> {
	const { data, error } = await supabase
		.from('rewards')
		.select('id, title, description, cost')
		.eq('club_id', clubId)
		.order('cost', { ascending: true });

	if (error || !data) return [];

	return data.map((row) => ({
		id: row.id,
		title: row.title,
		description: row.description,
		cost: row.cost
	}));
}

export type RedeemResult = { ok: true } | { ok: false; message: string };

/**
 * Fehlermeldungen der RPC (Nicht-Mitglied, nicht genug Tokens, Prämie
 * inaktiv) sind bereits deutschsprachig und nutzerfreundlich formuliert —
 * einfach durchreichen statt zu übersetzen.
 */
export async function redeemReward(
	admin: SupabaseClient,
	playerId: string,
	rewardId: string
): Promise<RedeemResult> {
	const { error } = await admin.rpc('redeem_reward', {
		p_player_id: playerId,
		p_reward_id: rewardId
	});

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

// ============================================================
// Vereins-Admin: Katalog pflegen (/verein/[slug])
// ============================================================
// Schreiben läuft über service_role, wie überall in diesem Schema — es
// gibt bewusst keine INSERT/UPDATE-Policies auf rewards. Die eigentliche
// Autorisierung ("ist diese Person Admin GENAU dieses Vereins?") prüft
// der Aufrufer VOR jedem Call über isClubAdmin() aus club-admin.ts, nie
// hier — diese Funktionen vertrauen der übergebenen clubId/rewardId.

export type AdminRewardEntry = RewardCatalogEntry & { active: boolean };

/** Im Gegensatz zu loadRewardCatalog() auch inaktive Prämien — braucht den Admin-Client, RLS zeigt nur active=true. */
export async function loadRewardCatalogForAdmin(
	admin: SupabaseClient,
	clubId: string
): Promise<AdminRewardEntry[]> {
	const { data, error } = await admin
		.from('rewards')
		.select('id, title, description, cost, active')
		.eq('club_id', clubId)
		.order('created_at', { ascending: false });

	if (error || !data) return [];

	return data.map((row) => ({
		id: row.id,
		title: row.title,
		description: row.description,
		cost: row.cost,
		active: row.active
	}));
}

export type RewardInput = { title: string; description: string; cost: number };
export type RewardWriteResult = { ok: true } | { ok: false; message: string };

function validateRewardInput(input: RewardInput): string | null {
	if (!input.title.trim()) return 'Titel darf nicht leer sein.';
	if (input.title.length > 120) return 'Titel ist zu lang.';
	if (!Number.isInteger(input.cost) || input.cost <= 0) {
		return 'Kosten müssen eine ganze Zahl über 0 sein.';
	}
	return null;
}

export async function createReward(
	admin: SupabaseClient,
	clubId: string,
	input: RewardInput
): Promise<RewardWriteResult> {
	const validationError = validateRewardInput(input);
	if (validationError) return { ok: false, message: validationError };

	const { error } = await admin.from('rewards').insert({
		club_id: clubId,
		title: input.title.trim(),
		description: input.description.trim() || null,
		cost: input.cost
	});

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

export async function updateReward(
	admin: SupabaseClient,
	clubId: string,
	rewardId: string,
	input: RewardInput
): Promise<RewardWriteResult> {
	const validationError = validateRewardInput(input);
	if (validationError) return { ok: false, message: validationError };

	// club_id im WHERE, nicht nur in der id: eine geratene rewardId aus
	// einem fremden Verein darf hier nicht greifen, selbst wenn die
	// Admin-Prüfung im Aufrufer aus irgendeinem Grund umgangen würde.
	const { error } = await admin
		.from('rewards')
		.update({
			title: input.title.trim(),
			description: input.description.trim() || null,
			cost: input.cost
		})
		.eq('id', rewardId)
		.eq('club_id', clubId);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}

export async function setRewardActive(
	admin: SupabaseClient,
	clubId: string,
	rewardId: string,
	active: boolean
): Promise<RewardWriteResult> {
	const { error } = await admin
		.from('rewards')
		.update({ active })
		.eq('id', rewardId)
		.eq('club_id', clubId);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}
