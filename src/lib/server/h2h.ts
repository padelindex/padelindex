// ============================================================
// PadelIndex — Head-to-Head & Teammate-Statistik (/p/[handle])
// ============================================================
// Dünner Wrapper um die RPC get_h2h_stats() (0028_h2h_stats.sql). Läuft
// bewusst über den Sessions-Client (RLS, SECURITY INVOKER), nicht über
// den Admin-Client: die Policies auf matches/match_participants/
// match_sets (plays_in_match(), seit 0005) sorgen dafür, dass nur Matches
// zählen, an denen playerA (die eingeloggte Person) selbst beteiligt war.
//
// null = kein einziges gemeinsames Match — die Komponente rendert dann
// gar nichts (siehe Anforderung: erst ab einem gemeinsamen Match zeigen).

import type { SupabaseClient } from '@supabase/supabase-js';

export type H2HStats = {
	asOpponents: number;
	winsAgainst: number;
	lossesAgainst: number;
	asTeammates: number;
	teammateWins: number;
	teammateLosses: number;
};

type RawH2HStats = {
	as_opponents: number;
	wins_against: number;
	losses_against: number;
	as_teammates: number;
	teammate_wins: number;
	teammate_losses: number;
};

export async function loadH2HStats(
	supabase: SupabaseClient,
	playerA: string,
	playerB: string
): Promise<H2HStats | null> {
	const { data, error } = await supabase.rpc('get_h2h_stats', {
		player_a: playerA,
		player_b: playerB
	});

	// Best-effort: ein RPC-Fehler soll das Profil nicht mit einem 500
	// abschießen, die H2H-Sektion ist eine Ergänzung, keine Kernfunktion.
	if (error) {
		console.error('get_h2h_stats fehlgeschlagen', error);
		return null;
	}
	if (!data) return null;

	const raw = data as RawH2HStats;
	if (raw.as_opponents === 0 && raw.as_teammates === 0) return null;

	return {
		asOpponents: raw.as_opponents,
		winsAgainst: raw.wins_against,
		lossesAgainst: raw.losses_against,
		asTeammates: raw.as_teammates,
		teammateWins: raw.teammate_wins,
		teammateLosses: raw.teammate_losses
	};
}
