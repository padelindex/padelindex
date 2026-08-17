import { error } from '@sveltejs/kit';
import { supabaseAnon } from './supabase';
import {
	clampLeaderboardLimit,
	type LeaderboardPlayer,
	type LeaderboardResponse,
	type LicenseTier
} from '$lib/leaderboard';

type LeaderboardRow = {
	club_id: string;
	club_slug: string;
	club_name: string;
	license_tier: LicenseTier;
	accent: string | null;
	player_id: string;
	handle: string;
	name: string;
	rating: number | string;
	confidence: number | string;
	matches: number;
	provisional: boolean;
	trend: number | string;
	last_match_at: string | null;
};

export async function getClubLeaderboard(
	slug: string,
	requestedLimit?: number,
	platform?: App.Platform
): Promise<LeaderboardResponse> {
	const sb = supabaseAnon(platform);
	if (!sb) {
		throw error(503, 'Supabase ist noch nicht verbunden.');
	}

	const { data: club, error: clubErr } = await sb
		.from('clubs')
		.select('name, slug, license_tier, accent')
		.eq('slug', slug)
		.maybeSingle();

	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');

	const tier = (club.license_tier as LicenseTier) ?? 'free';
	const limit = clampLeaderboardLimit(requestedLimit, tier);

	const { data, error: rowsErr } = await sb
		.from('club_leaderboard')
		.select(
			'club_slug, club_name, license_tier, accent, handle, name, rating, confidence, matches, provisional, trend, last_match_at'
		)
		.eq('club_slug', slug)
		.order('rating', { ascending: false })
		.order('matches', { ascending: false })
		.limit(limit);

	if (rowsErr) throw error(500, rowsErr.message);

	const rows = (data ?? []) as LeaderboardRow[];
	const players: LeaderboardPlayer[] = rows.map((row, i) => ({
		rank: i + 1,
		handle: row.handle,
		name: row.name,
		rating: Number(row.rating),
		confidence: Number(row.confidence),
		matches: row.matches,
		provisional: row.provisional,
		trend: Number(row.trend)
	}));

	const updatedAt =
		rows.reduce<string | null>((latest, row) => {
			if (!row.last_match_at) return latest;
			if (!latest || row.last_match_at > latest) return row.last_match_at;
			return latest;
		}, null) ?? new Date().toISOString();

	return {
		club: {
			name: club.name,
			slug: club.slug,
			accent: club.accent
		},
		updated_at: players.length ? updatedAt : null,
		players
	};
}
