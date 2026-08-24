// ============================================================
// PadelIndex — eingeloggter Spieler pro Request
// ============================================================
//
// Wird von hooks.server.ts nach der Session-Prüfung aufgerufen. Läuft
// über den anon-Key-Client mit dem User-JWT aus dem Cookie — RLS-Policy
// players_self_select (user_id = auth.uid()) sorgt dafür, dass hier
// niemals das Profil eines anderen Spielers zurückkommt.

import type { SupabaseClient } from '@supabase/supabase-js';

export type SessionPlayer = {
	id: string;
	displayName: string;
	handle: string;
	rating: number;
	matchesPlayed: number;
	claimStatus: 'unclaimed' | 'pending' | 'awaiting_review' | 'claimed' | 'rejected';
	city: string | null;
	playingHand: 'rechts' | 'links' | null;
	preferredSide: 'rechts' | 'links' | null;
	gender: 'maennlich' | 'weiblich' | 'divers' | null;
	selfAssessedLevel: number | null;
	showFullName: boolean;
	avatarUrl: string | null;
};

export async function loadSessionPlayer(
	supabase: SupabaseClient,
	userId: string
): Promise<SessionPlayer | null> {
	const { data, error } = await supabase
		.from('players')
		.select(
			'id, display_name, handle, rating, matches_played, claim_status, city, playing_hand, preferred_side, gender, self_assessed_level, show_full_name, avatar_url'
		)
		.eq('user_id', userId)
		.maybeSingle();

	if (error || !data) return null;

	return {
		id: data.id,
		displayName: data.display_name,
		handle: data.handle,
		rating: Number(data.rating),
		matchesPlayed: data.matches_played,
		claimStatus: data.claim_status,
		city: data.city,
		playingHand: data.playing_hand,
		preferredSide: data.preferred_side,
		gender: data.gender,
		selfAssessedLevel: data.self_assessed_level === null ? null : Number(data.self_assessed_level),
		showFullName: data.show_full_name,
		avatarUrl: data.avatar_url
	};
}
