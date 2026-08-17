export type LicenseTier = 'free' | 'basic' | 'pro';

export type LeaderboardPlayer = {
	rank: number;
	handle: string;
	name: string;
	rating: number;
	confidence: number;
	matches: number;
	provisional: boolean;
	trend: number;
};

export type LeaderboardResponse = {
	club: { name: string; slug: string; accent?: string | null };
	updated_at: string | null;
	players: LeaderboardPlayer[];
};

export const FREE_LEADERBOARD_LIMIT = 10;
export const MAX_LEADERBOARD_LIMIT = 50;

export function clampLeaderboardLimit(requested: number | undefined, tier: LicenseTier): number {
	const fallback = tier === 'free' ? FREE_LEADERBOARD_LIMIT : 10;
	const n = Number.isFinite(requested) ? Math.trunc(requested as number) : fallback;
	const cap = tier === 'free' ? FREE_LEADERBOARD_LIMIT : MAX_LEADERBOARD_LIMIT;
	return Math.max(3, Math.min(cap, n));
}
