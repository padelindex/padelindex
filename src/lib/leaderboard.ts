export type LicenseTier = 'free' | 'basic' | 'pro';

export type LeaderboardPlayer = {
	rank: number;
	handle: string;
	/** Bei unbeanspruchten Profilen abgekürzt ("Robin K.") — siehe public_display_name(). */
	name: string;
	rating: number;
	confidence: number;
	matches: number;
	provisional: boolean;
	trend: number;
	/** false = importiertes Profil, das noch niemand beansprucht hat. */
	claimed: boolean;
};

export type LeaderboardResponse = {
	club: { name: string; slug: string; accent?: string | null };
	updated_at: string | null;
	/**
	 * 'league_import': alle bestätigten Matches dieses Vereins stammen aus
	 * importierten Liga-Ergebnissen, noch keine über die App gemeldet — das
	 * "Stand"-Datum würde sonst Aktualität suggerieren, die nicht da ist.
	 */
	dataOrigin: 'live' | 'league_import';
	players: LeaderboardPlayer[];
};

/** Wie LeaderboardResponse, aber für die vollständige, seitenweise Vereinsseite (nicht das Widget). */
export type PaginatedLeaderboardResponse = LeaderboardResponse & {
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export const FREE_LEADERBOARD_LIMIT = 10;
export const MAX_LEADERBOARD_LIMIT = 50;

/** Größe einer Seite auf der öffentlichen Vereinsseite (/c/[slug]) — unabhängig vom Widget-Limit. */
export const CLUB_LEADERBOARD_PAGE_SIZE = 25;

export function clampLeaderboardLimit(requested: number | undefined, tier: LicenseTier): number {
	const fallback = tier === 'free' ? FREE_LEADERBOARD_LIMIT : 10;
	const n = Number.isFinite(requested) ? Math.trunc(requested as number) : fallback;
	const cap = tier === 'free' ? FREE_LEADERBOARD_LIMIT : MAX_LEADERBOARD_LIMIT;
	return Math.max(3, Math.min(cap, n));
}

export function totalPagesFor(total: number, pageSize: number): number {
	return Math.max(1, Math.ceil(total / pageSize));
}

/** Ungültige oder außerhalb liegende Seitenzahlen (URL-Manipulation) auf einen gültigen Wert klemmen. */
export function clampLeaderboardPage(requested: number | undefined, totalPages: number): number {
	const n = Number.isFinite(requested) ? Math.trunc(requested as number) : 1;
	return Math.max(1, Math.min(Math.max(1, totalPages), n));
}
