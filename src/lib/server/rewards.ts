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
