// ============================================================
// PadelIndex — Token-Kontostand für /konto
// ============================================================
//
// Nur für den eigenen Kontostand gedacht (RLS: token_transactions_self_read
// / reward_redemptions_self_read, beide player_id = current_player_id()) —
// nie für fremde Spieler abfragen. Gleiches Muster wie rating-history.ts:
// bewusst nicht in hooks.server.ts geladen, sondern nur dort, wo /konto es
// tatsächlich zeigt.
//
// Der Kontostand hat zwei Quellen: token_transactions (Gutschriften, immer
// positiv per Constraint) und reward_redemptions (Einlösungen, siehe
// 0008_rewards.sql). Beide werden hier zu EINER chronologischen Liste
// gemischt — Gutschriften mit positivem, Einlösungen mit negativem amount.

import type { SupabaseClient } from '@supabase/supabase-js';

export type TokenReason = 'match_played' | 'match_won' | 'tournament' | 'milestone' | 'streak';

export type TokenLedgerEntry = {
	id: string;
	/** Positiv für Gutschriften, negativ für Einlösungen. */
	amount: number;
	createdAt: string;
} & ({ kind: 'grant'; reason: TokenReason } | { kind: 'redemption'; rewardTitle: string });

export type TokenAccount = {
	balance: number;
	recent: TokenLedgerEntry[];
};

const EMPTY_ACCOUNT: TokenAccount = { balance: 0, recent: [] };

export async function loadTokenAccount(
	supabase: SupabaseClient,
	playerId: string,
	recentLimit = 12
): Promise<TokenAccount> {
	const [grantsAll, redemptionsAll, grantsRecent, redemptionsRecent] = await Promise.all([
		supabase.from('token_transactions').select('amount').eq('player_id', playerId),
		supabase.from('reward_redemptions').select('cost').eq('player_id', playerId),
		supabase
			.from('token_transactions')
			.select('id, amount, reason, created_at')
			.eq('player_id', playerId)
			.order('created_at', { ascending: false })
			.limit(recentLimit),
		supabase
			.from('reward_redemptions')
			.select('id, cost, reward_title, created_at')
			.eq('player_id', playerId)
			.order('created_at', { ascending: false })
			.limit(recentLimit)
	]);

	if (!grantsAll.data) return EMPTY_ACCOUNT;

	const earned = grantsAll.data.reduce((sum, row) => sum + row.amount, 0);
	const spent = (redemptionsAll.data ?? []).reduce((sum, row) => sum + row.cost, 0);

	const grantEntries: TokenLedgerEntry[] = (grantsRecent.data ?? []).map((row) => ({
		id: row.id,
		amount: row.amount,
		createdAt: row.created_at,
		kind: 'grant',
		reason: row.reason as TokenReason
	}));

	const redemptionEntries: TokenLedgerEntry[] = (redemptionsRecent.data ?? []).map((row) => ({
		id: row.id,
		amount: -row.cost,
		createdAt: row.created_at,
		kind: 'redemption',
		rewardTitle: row.reward_title
	}));

	const recent = [...grantEntries, ...redemptionEntries]
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
		.slice(0, recentLimit);

	return { balance: earned - spent, recent };
}
