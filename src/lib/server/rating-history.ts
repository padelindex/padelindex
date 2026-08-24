// ============================================================
// PadelIndex — Rating-Verlauf für /konto
// ============================================================
//
// Nur für den eigenen Verlauf gedacht (RLS: rating_history_self_read,
// player_id = current_player_id()) — nie für fremde Spieler abfragen.
// Bewusst NICHT in hooks.server.ts geladen: das würde bei jedem Request
// die History mitziehen, auch auf Seiten, die sie nie zeigen.

import type { SupabaseClient } from '@supabase/supabase-js';

export type RatingHistoryReason = 'match' | 'seed' | 'inactivity_decay' | 'manual_adjust';

/** Deckt beide bisherigen Seed-Quellen ab (Liga-Import und Fragebogen), plus Match-Faktoren aus rating.ts. */
export type RatingHistoryFactors = {
	source?: 'league_import';
	league?: string;
	season?: string;
	league_rank?: number | null;
	league_size?: number;
	skillTier?: 'beginner' | 'intermediate' | 'advanced';
	setByAdminId?: string;
	won?: boolean;
	dominance?: number;
	opponentAvgRating?: number;
	partnerAvgRating?: number;
	expectedWinProb?: number;
	provisional?: boolean;
};

export type RatingHistoryEntry = {
	id: string;
	reason: RatingHistoryReason;
	ratingBefore: number;
	ratingAfter: number;
	createdAt: string;
	factors: RatingHistoryFactors;
};

export async function loadRatingHistory(
	supabase: SupabaseClient,
	playerId: string,
	limit = 20
): Promise<RatingHistoryEntry[]> {
	const { data, error } = await supabase
		.from('rating_history')
		.select('id, reason, rating_before, rating_after, factors, created_at')
		.eq('player_id', playerId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error || !data) return [];

	return data.map((row) => ({
		id: row.id,
		reason: row.reason,
		ratingBefore: Number(row.rating_before),
		ratingAfter: Number(row.rating_after),
		createdAt: row.created_at,
		factors: (row.factors ?? {}) as RatingHistoryFactors
	}));
}
