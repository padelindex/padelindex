import { error } from '@sveltejs/kit';
import { supabaseAnon, supabaseAdmin } from './supabase';
import {
	CLUB_LEADERBOARD_PAGE_SIZE,
	clampLeaderboardLimit,
	clampLeaderboardPage,
	totalPagesFor,
	type LeaderboardPlayer,
	type LeaderboardResponse,
	type LicenseTier,
	type PaginatedLeaderboardResponse
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
	claimed: boolean;
};

const LEADERBOARD_COLUMNS =
	'club_slug, club_name, license_tier, accent, handle, name, rating, confidence, matches, provisional, trend, last_match_at, claimed';

function toPlayer(row: LeaderboardRow, rank: number): LeaderboardPlayer {
	return {
		rank,
		handle: row.handle,
		name: row.name,
		rating: Number(row.rating),
		confidence: Number(row.confidence),
		matches: row.matches,
		provisional: row.provisional,
		trend: Number(row.trend),
		claimed: row.claimed
	};
}

function latestMatchAt(rows: LeaderboardRow[]): string | null {
	return rows.reduce<string | null>((latest, row) => {
		if (!row.last_match_at) return latest;
		if (!latest || row.last_match_at > latest) return row.last_match_at;
		return latest;
	}, null);
}

async function findClub(sb: ReturnType<typeof supabaseAnon>, slug: string) {
	const { data: club, error: clubErr } = await sb!
		.from('clubs')
		.select('id, name, slug, license_tier, accent')
		.eq('slug', slug)
		.maybeSingle();

	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');
	return club;
}

/**
 * 'league_import' nur, solange AUSNAHMSLOS jedes bestätigte Match dieses
 * Vereins aus einem Import stammt (matches.source, siehe 0001_schema.sql) —
 * sobald ein einziges Match über die App gemeldet und bestätigt wurde, ist
 * die Rangliste nicht mehr reine Altdaten und der Hinweis verschwindet.
 * anon darf matches.source nicht lesen (RLS: nur Teilnehmer), deshalb hier
 * service_role — best-effort: ein Fehler darf die öffentliche Seite nicht
 * mitreißen, im Zweifel lieber kein Badge als ein blockierendes Ranking.
 */
async function resolveDataOrigin(
	platform: App.Platform | undefined,
	clubId: string
): Promise<'live' | 'league_import'> {
	try {
		const admin = supabaseAdmin(platform);
		const { data, error: err } = await admin
			.from('matches')
			.select('source')
			.eq('club_id', clubId)
			.eq('status', 'confirmed')
			.limit(1000);
		if (err || !data || data.length === 0) return 'live';
		const allImported = data.every((m) => m.source === 'club_league' || m.source === 'import');
		return allImported ? 'league_import' : 'live';
	} catch {
		return 'live';
	}
}

/** Fürs Widget/Embed: kurze Liste, Länge über die license_tier des Vereins gedeckelt. */
export async function getClubLeaderboard(
	slug: string,
	requestedLimit?: number,
	platform?: App.Platform
): Promise<LeaderboardResponse> {
	const sb = supabaseAnon(platform);
	if (!sb) throw error(503, 'Supabase ist noch nicht verbunden.');

	const club = await findClub(sb, slug);
	const tier = (club.license_tier as LicenseTier) ?? 'free';
	const limit = clampLeaderboardLimit(requestedLimit, tier);

	const { data, error: rowsErr } = await sb
		.from('club_leaderboard')
		.select(LEADERBOARD_COLUMNS)
		.eq('club_slug', slug)
		.order('rating', { ascending: false })
		.order('matches', { ascending: false })
		.limit(limit);

	if (rowsErr) throw error(500, rowsErr.message);

	const rows = (data ?? []) as LeaderboardRow[];
	const players = rows.map((row, i) => toPlayer(row, i + 1));
	const updatedAt = latestMatchAt(rows) ?? new Date().toISOString();
	const dataOrigin = players.length ? await resolveDataOrigin(platform, club.id) : 'live';

	return {
		club: { name: club.name, slug: club.slug, accent: club.accent },
		updated_at: players.length ? updatedAt : null,
		dataOrigin,
		players
	};
}

/**
 * Fürs vollständige, öffentliche Vereinsranking (/c/[slug]) — alle Mitglieder,
 * seitenweise. Unabhängig vom Widget-Limit, das ist eine bewusst kurze
 * Teaser-Liste für externe Seiten.
 */
export async function getClubLeaderboardPage(
	slug: string,
	requestedPage: number | undefined,
	platform?: App.Platform,
	pageSize: number = CLUB_LEADERBOARD_PAGE_SIZE
): Promise<PaginatedLeaderboardResponse> {
	const sb = supabaseAnon(platform);
	if (!sb) throw error(503, 'Supabase ist noch nicht verbunden.');

	const club = await findClub(sb, slug);

	// Total zuerst separat ermitteln (billige HEAD-Anfrage). Wichtig: PostgREST
	// beantwortet .range() mit einem Offset jenseits der Zeilenzahl NICHT mit
	// leeren Daten, sondern mit HTTP 416 "Requested range not satisfiable" —
	// verifiziert gegen die echte Instanz. Genau das würde bei einer zu hohen
	// Seitenzahl (URL-Manipulation, geschrumpfter Verein) passieren. Die Seite
	// deshalb VOR der eigentlichen Datenabfrage auf totalPages klemmen, damit
	// der Offset garantiert innerhalb der vorhandenen Zeilen bleibt.
	const { count, error: countErr } = await sb
		.from('club_leaderboard')
		.select('player_id', { count: 'exact', head: true })
		.eq('club_slug', slug);

	if (countErr) throw error(500, countErr.message);

	const total = count ?? 0;
	const totalPages = totalPagesFor(total, pageSize);
	const page = clampLeaderboardPage(requestedPage, totalPages);
	const from = (page - 1) * pageSize;

	let rows: LeaderboardRow[] = [];
	if (total > 0) {
		const { data, error: rowsErr } = await sb
			.from('club_leaderboard')
			.select(LEADERBOARD_COLUMNS)
			.eq('club_slug', slug)
			.order('rating', { ascending: false })
			.order('matches', { ascending: false })
			.range(from, from + pageSize - 1);

		if (rowsErr) throw error(500, rowsErr.message);
		rows = (data ?? []) as LeaderboardRow[];
	}

	const players = rows.map((row, i) => toPlayer(row, from + i + 1));
	const updatedAt = latestMatchAt(rows) ?? new Date().toISOString();
	const dataOrigin = players.length ? await resolveDataOrigin(platform, club.id) : 'live';

	return {
		club: { name: club.name, slug: club.slug, accent: club.accent },
		updated_at: players.length ? updatedAt : null,
		dataOrigin,
		players,
		total,
		page,
		pageSize,
		totalPages
	};
}
