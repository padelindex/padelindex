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
	claimStatus: 'unclaimed' | 'pending' | 'claimed';
};

export async function loadSessionPlayer(
	supabase: SupabaseClient,
	userId: string
): Promise<SessionPlayer | null> {
	const { data, error } = await supabase
		.from('players')
		.select('id, display_name, handle, rating, matches_played, claim_status')
		.eq('user_id', userId)
		.maybeSingle();

	if (error || !data) return null;

	return {
		id: data.id,
		displayName: data.display_name,
		handle: data.handle,
		rating: Number(data.rating),
		matchesPlayed: data.matches_played,
		claimStatus: data.claim_status
	};
}
