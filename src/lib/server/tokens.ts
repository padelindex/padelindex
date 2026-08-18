// ============================================================
// PadelIndex — Token-Kontostand für /konto
// ============================================================
//
// Nur für den eigenen Kontostand gedacht (RLS: token_transactions_self_read,
// player_id = current_player_id()) — nie für fremde Spieler abfragen.
// Gleiches Muster wie rating-history.ts: bewusst nicht in hooks.server.ts
// geladen, sondern nur dort, wo /konto es tatsächlich zeigt.
//
// Einlösen gibt es noch nicht (kein Prämienkatalog, keine Redeem-Route) —
// token_transactions.amount ist per Check-Constraint immer positiv, der
// Kontostand ist deshalb schlicht die Summe aller Zeilen.

import type { SupabaseClient } from '@supabase/supabase-js';

export type TokenReason = 'match_played' | 'match_won' | 'tournament' | 'milestone' | 'streak';

export type TokenTransactionEntry = {
	id: string;
	amount: number;
	reason: TokenReason;
	createdAt: string;
};

export type TokenAccount = {
	balance: number;
	recent: TokenTransactionEntry[];
};

const EMPTY_ACCOUNT: TokenAccount = { balance: 0, recent: [] };

export async function loadTokenAccount(
	supabase: SupabaseClient,
	playerId: string,
	recentLimit = 12
): Promise<TokenAccount> {
	const [{ data: sumRows }, { data: recentRows }] = await Promise.all([
		supabase.from('token_transactions').select('amount').eq('player_id', playerId),
		supabase
			.from('token_transactions')
			.select('id, amount, reason, created_at')
			.eq('player_id', playerId)
			.order('created_at', { ascending: false })
			.limit(recentLimit)
	]);

	if (!sumRows) return EMPTY_ACCOUNT;

	const balance = sumRows.reduce((sum, row) => sum + row.amount, 0);

	const recent: TokenTransactionEntry[] = (recentRows ?? []).map((row) => ({
		id: row.id,
		amount: row.amount,
		reason: row.reason as TokenReason,
		createdAt: row.created_at
	}));

	return { balance, recent };
}
