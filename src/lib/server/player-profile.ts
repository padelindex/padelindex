// ============================================================
// PadelIndex — Öffentliches Spielerprofil (/p/[handle])
// ============================================================
//
// players ist seit 0005_claimable_profiles.sql nicht mehr direkt für
// anon lesbar (siehe club_leaderboard-View dort). Für ein Profil reicht
// aber keine einfache View — Matchhistorie, Formkurve und bevorzugte
// Partner brauchen mehrere Tabellen und echte Berechnung. Deshalb wie
// claims.ts/matches.ts: service_role + Maskierung in TypeScript statt
// einer weiteren SQL-View.
//
// abbreviateName() maskiert unbeanspruchte Profile exakt wie
// public_display_name() in der DB (siehe claim-match.ts) — Klarnamen
// importierter, nie beanspruchter Profile bleiben so auch hier verborgen.

import type { SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { formatPlayerName } from '$lib/claim-match';
import type { MatchType } from '$lib/match-report';

export type PlayingHand = 'rechts' | 'links';
export type PreferredSide = 'rechts' | 'links';
export type Gender = 'maennlich' | 'weiblich' | 'divers';

export type PublicProfile = {
	id: string;
	handle: string;
	name: string;
	claimed: boolean;
	rating: number;
	confidence: number;
	matchesPlayed: number;
	provisional: boolean;
	city: string | null;
	playingHand: PlayingHand | null;
	preferredSide: PreferredSide | null;
	gender: Gender | null;
	selfAssessedLevel: number | null;
};

/** null = nicht gefunden ODER profile_public=false — Aufrufer soll das nicht unterscheiden (404 in beiden Fällen). */
export async function loadPublicProfile(
	admin: SupabaseClient,
	handle: string
): Promise<PublicProfile | null> {
	const { data, error: err } = await admin
		.from('players')
		.select(
			'id, handle, display_name, claim_status, rating, sigma, matches_played, is_provisional, profile_public, city, playing_hand, preferred_side, gender, self_assessed_level'
		)
		.eq('handle', handle)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data || !data.profile_public) return null;

	const claimed = data.claim_status === 'claimed';
	const sigma = Number(data.sigma);
	const confidence = Math.max(0, Math.min(1, 1 - sigma / (25 / 3)));

	return {
		id: data.id,
		handle: data.handle,
		name: formatPlayerName(data.display_name, data.claim_status),
		claimed,
		rating: Number(data.rating),
		confidence: Number(confidence.toFixed(4)),
		matchesPlayed: data.matches_played,
		provisional: data.is_provisional,
		city: data.city,
		playingHand: data.playing_hand,
		preferredSide: data.preferred_side,
		gender: data.gender,
		selfAssessedLevel: data.self_assessed_level === null ? null : Number(data.self_assessed_level)
	};
}

export type ProfileMatchEntry = {
	matchId: string;
	playedAt: string;
	won: boolean;
	ratingAfter: number;
	ratingDelta: number;
	myTeam: 1 | 2;
	matchType: MatchType;
	partner: { id: string; handle: string; name: string; claimed: boolean } | null;
	team1: { name: string; claimed: boolean }[];
	team2: { name: string; claimed: boolean }[];
	sets: { team1Games: number; team2Games: number }[];
};

type RawParticipant = {
	match_id: string;
	player_id: string;
	team: 1 | 2;
	players: { handle: string; display_name: string; claim_status: string; gender: string | null } | null;
};

const nameOf = (p: RawParticipant['players']) =>
	p ? formatPlayerName(p.display_name, p.claim_status) : '?';

/**
 * Matchhistorie neueste-zuerst (für die Anzeige) — Formkurve/Badges
 * schneiden sich ihr eigenes Fenster daraus, drehen bei Bedarf selbst um.
 * mixedMatchCount zählt Matches, bei denen sich das Geschlecht von
 * Spieler und Partner unterscheidet (beide müssen es angegeben haben).
 */
export async function loadPublicMatchHistory(
	admin: SupabaseClient,
	playerId: string,
	limit = 40
): Promise<{ entries: ProfileMatchEntry[]; mixedMatchCount: number }> {
	const { data: history, error: histErr } = await admin
		.from('rating_history')
		.select('match_id, rating_before, rating_after, factors, created_at')
		.eq('player_id', playerId)
		.eq('reason', 'match')
		.order('created_at', { ascending: false })
		.limit(limit);

	if (histErr) throw error(500, histErr.message);
	if (!history || history.length === 0) return { entries: [], mixedMatchCount: 0 };

	const matchIds = history.map((h) => h.match_id).filter((id): id is string => id !== null);

	const [{ data: myGenderRow }, { data: matches }, { data: participants }, { data: sets }] =
		await Promise.all([
			admin.from('players').select('gender').eq('id', playerId).maybeSingle(),
			admin.from('matches').select('id, played_at, match_type').in('id', matchIds),
			admin
				.from('match_participants')
				.select('match_id, player_id, team, players(handle, display_name, claim_status, gender)')
				.in('match_id', matchIds),
			admin
				.from('match_sets')
				.select('match_id, set_number, team1_games, team2_games')
				.in('match_id', matchIds)
		]);

	const playedAtByMatch = new Map((matches ?? []).map((m) => [m.id, m.played_at]));
	const matchTypeByMatch = new Map((matches ?? []).map((m) => [m.id, m.match_type as MatchType]));
	const myGender = myGenderRow?.gender ?? null;
	let mixedMatchCount = 0;

	const entries: ProfileMatchEntry[] = history.map((h) => {
		const matchId = h.match_id as string;
		const mine = (participants ?? []).filter(
			(p) => p.match_id === matchId
		) as unknown as RawParticipant[];
		const myRow = mine.find((p) => p.player_id === playerId);
		const myTeam = (myRow?.team ?? 1) as 1 | 2;
		const partnerRow = mine.find((p) => p.player_id !== playerId && p.team === myTeam);

		if (myGender && partnerRow?.players?.gender && partnerRow.players.gender !== myGender) {
			mixedMatchCount++;
		}

		const toEntry = (p: RawParticipant) => ({
			name: nameOf(p.players),
			claimed: p.players?.claim_status === 'claimed'
		});

		return {
			matchId,
			playedAt: playedAtByMatch.get(matchId) ?? h.created_at,
			won: (h.factors as { won?: boolean } | null)?.won === true,
			ratingAfter: Number(h.rating_after),
			ratingDelta: Number(h.rating_after) - Number(h.rating_before),
			myTeam,
			matchType: matchTypeByMatch.get(matchId) ?? 'freizeit',
			partner: partnerRow
				? {
						id: partnerRow.player_id,
						handle: partnerRow.players?.handle ?? '',
						name: nameOf(partnerRow.players),
						claimed: partnerRow.players?.claim_status === 'claimed'
					}
				: null,
			team1: mine.filter((p) => p.team === 1).map(toEntry),
			team2: mine.filter((p) => p.team === 2).map(toEntry),
			sets: (sets ?? [])
				.filter((s) => s.match_id === matchId)
				.sort((a, b) => a.set_number - b.set_number)
				.map((s) => ({ team1Games: s.team1_games, team2Games: s.team2_games }))
		};
	});

	return { entries, mixedMatchCount };
}

/** club_most_improved (0010) ist service_role-only — reines Vergleichs-Ergebnis, keine sensiblen Daten. */
export async function isMostImprovedInClub(
	admin: SupabaseClient,
	clubId: string,
	playerId: string,
	sinceDays = 30
): Promise<boolean> {
	const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
	const { data } = await admin.rpc('club_most_improved', { p_club_id: clubId, p_since: since });
	return data === playerId;
}
