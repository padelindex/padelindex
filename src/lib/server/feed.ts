// ============================================================
// PadelIndex — Live-Ticker & RSS-Feed: zentrale Feed-Engine
// ============================================================
// Bündelt sechs Quellen zu einem einheitlichen Event-Stream (siehe
// feed.ts fürs FeedItem-Format): Ergebnisse und Spieler-Spotlight
// brauchen echte DB-Zugriffe, der Rest ist entweder eine öffentliche
// View/Tabelle oder komplett statisch (Feature-Hinweise, Club-Aufruf,
// Ratgeber-Rotation aus guides-data.ts).
//
// Jeder Loader fängt seine eigenen Fehler ab und gibt im Zweifel []
// zurück (gleiches Muster wie resolveDataOrigin() in leaderboard.ts):
// eine wackelige Quelle darf nie den ganzen Feed/Ticker mitreißen.
//
// matches/match_participants/match_sets sind per RLS auf Teilnehmer
// beschränkt (0001_schema.sql) — für aggregierte "wer hat gegen wen
// gewonnen"-Ergebnisse geht das nur mit dem Admin-Client, gefiltert auf
// Matches, bei denen ALLE vier Teilnehmer profile_public = true haben.

import { supabaseAdmin, supabaseAnon } from './supabase';
import { formatPlayerName } from '$lib/claim-match';
import { GUIDES } from '$lib/guides-data';
import { MIN_MATCHES_FOR_INDEXING } from '$lib/seo';
import { capFeed, hashString, pseudoRecentDate, type FeedItem } from '$lib/feed';

const RESULT_LIMIT = 5;
const SPOTLIGHT_LIMIT = 3;
const NEW_CLUB_LIMIT = 3;
const GUIDE_HIGHLIGHT_LIMIT = 3;

type MatchParticipantRow = {
	team: 1 | 2;
	players: {
		display_name: string;
		claim_status: string;
		show_full_name: boolean;
		profile_public: boolean;
	} | null;
};

type MatchSetRow = { set_number: number; team1_games: number; team2_games: number };

type MatchRow = {
	id: string;
	played_at: string;
	clubs: { name: string; slug: string } | null;
	match_participants: MatchParticipantRow[];
	match_sets: MatchSetRow[];
};

function resultItemFor(match: MatchRow): FeedItem | null {
	const participants = match.match_participants ?? [];
	if (participants.length !== 4) return null;
	if (!match.clubs) return null;
	if (!participants.every((p) => p.players?.profile_public)) return null;

	const nameOf = (p: MatchParticipantRow) =>
		formatPlayerName(p.players!.display_name, p.players!.claim_status, p.players!.show_full_name);

	const team1 = participants.filter((p) => p.team === 1).map(nameOf);
	const team2 = participants.filter((p) => p.team === 2).map(nameOf);
	if (team1.length !== 2 || team2.length !== 2) return null;

	const sets = [...(match.match_sets ?? [])].sort((a, b) => a.set_number - b.set_number);
	if (sets.length === 0) return null;

	let team1Sets = 0;
	let team2Sets = 0;
	for (const s of sets) {
		if (s.team1_games > s.team2_games) team1Sets++;
		else if (s.team2_games > s.team1_games) team2Sets++;
	}
	if (team1Sets === team2Sets) return null;

	const winnerIsTeam1 = team1Sets > team2Sets;
	const winners = winnerIsTeam1 ? team1 : team2;
	const losers = winnerIsTeam1 ? team2 : team1;
	const score = sets
		.map((s) =>
			winnerIsTeam1 ? `${s.team1_games}:${s.team2_games}` : `${s.team2_games}:${s.team1_games}`
		)
		.join(', ');

	return {
		id: `ergebnis-${match.id}`,
		title: `${winners.join(' & ')} gewinnen ${score} gegen ${losers.join(' & ')}`,
		link: `/c/${match.clubs.slug}`,
		category: 'ERGEBNIS',
		pubDate: match.played_at,
		description: `Bestätigtes Match beim ${match.clubs.name}.`
	};
}

async function loadRecentResults(platform?: App.Platform): Promise<FeedItem[]> {
	try {
		const admin = supabaseAdmin(platform);
		const { data, error } = await admin
			.from('matches')
			.select(
				'id, played_at, clubs(name, slug), match_participants(team, players(display_name, claim_status, show_full_name, profile_public)), match_sets(set_number, team1_games, team2_games)'
			)
			.eq('status', 'confirmed')
			.order('played_at', { ascending: false })
			.limit(20);

		if (error || !data) return [];

		const items: FeedItem[] = [];
		for (const match of data as unknown as MatchRow[]) {
			if (items.length >= RESULT_LIMIT) break;
			const item = resultItemFor(match);
			if (item) items.push(item);
		}
		return items;
	} catch {
		return [];
	}
}

type PlayerSpotlightRow = {
	handle: string;
	display_name: string;
	claim_status: string;
	show_full_name: boolean;
	city: string | null;
	rating: number | string;
	matches_played: number;
	last_match_at: string | null;
};

function pickRandom<T>(pool: T[], count: number): T[] {
	const copy = [...pool];
	const picked: T[] = [];
	while (copy.length > 0 && picked.length < count) {
		const index = Math.floor(Math.random() * copy.length);
		picked.push(copy.splice(index, 1)[0]);
	}
	return picked;
}

/**
 * Nur Profile ab MIN_MATCHES_FOR_INDEXING (siehe seo.ts): dieselbe
 * Schwelle, ab der die Plattform ein Spielerprofil selbst für
 * aussagekräftig genug hält, um es indexieren zu lassen — konsistent,
 * statt fürs Spotlight eine eigene, willkürliche Grenze zu erfinden.
 */
async function loadPlayerSpotlights(platform?: App.Platform): Promise<FeedItem[]> {
	try {
		const sb = supabaseAnon(platform);
		if (!sb) return [];

		const { data, error } = await sb
			.from('players')
			.select(
				'handle, display_name, claim_status, show_full_name, city, rating, matches_played, last_match_at'
			)
			.eq('profile_public', true)
			.gte('matches_played', MIN_MATCHES_FOR_INDEXING)
			.order('last_match_at', { ascending: false })
			.limit(20);

		if (error || !data) return [];

		const pool = data as unknown as PlayerSpotlightRow[];
		return pickRandom(pool, SPOTLIGHT_LIMIT).map((p) => {
			const name = formatPlayerName(p.display_name, p.claim_status, p.show_full_name);
			const place = p.city ? ` in ${p.city}` : '';
			return {
				id: `spieler-${p.handle}`,
				title: `Spieler-Profil: ${name} – Level ${Number(p.rating).toFixed(1)}${place}`,
				link: `/p/${p.handle}`,
				category: 'SPIELER',
				pubDate: p.last_match_at ?? new Date().toISOString(),
				description: `${name} hat bereits ${p.matches_played} bestätigte Matches auf PadelIndex gespielt.`
			};
		});
	} catch {
		return [];
	}
}

type ClubRow = { name: string; slug: string; created_at: string };

async function loadNewClubs(platform?: App.Platform): Promise<FeedItem[]> {
	try {
		const sb = supabaseAnon(platform);
		if (!sb) return [];

		const { data, error } = await sb
			.from('clubs')
			.select('name, slug, created_at')
			.order('created_at', { ascending: false })
			.limit(NEW_CLUB_LIMIT);

		if (error || !data) return [];

		return (data as unknown as ClubRow[]).map((c) => ({
			id: `verein-${c.slug}`,
			title: `Neu dabei: ${c.name}!`,
			link: `/c/${c.slug}`,
			category: 'NEUER_VEREIN',
			pubDate: c.created_at,
			description: `${c.name} ist jetzt mit PadelIndex-Rating auf der Plattform vertreten.`
		}));
	} catch {
		return [];
	}
}

/**
 * Bewusst generisch statt mit einem konkreten, nicht angemeldeten Verein
 * ("Padel-Point Berlin") zu werben — das würde einen echten Betrieb ohne
 * dessen Zutun als Zielscheibe nennen. Ein Aufruf ohne Namen ist ebenso
 * wirksam und sauber.
 */
function clubCallToAction(): FeedItem[] {
	return [
		{
			id: 'cta-vereine',
			title: 'Dein Verein ist noch nicht dabei? Jetzt kostenlos eintragen.',
			link: '/vereine',
			category: 'CLUB_CTA',
			pubDate: pseudoRecentDate('cta-vereine', 60),
			description: 'PadelIndex läuft direkt auf eurer Vereinsseite — eine Zeile Code genügt.'
		}
	];
}

/** Rotiert deterministisch pro Kalendertag durch guides-data.ts, ohne Wiederholungen innerhalb einer Auswahl. */
function guideHighlights(): FeedItem[] {
	if (GUIDES.length === 0) return [];

	const day = new Date().toISOString().slice(0, 10);
	const offset = hashString(day) % GUIDES.length;
	const count = Math.min(GUIDE_HIGHLIGHT_LIMIT, GUIDES.length);

	return Array.from({ length: count }, (_, i) => GUIDES[(offset + i) % GUIDES.length]).map((g) => ({
		id: `ratgeber-${g.slug}`,
		title: `Ratgeber: ${g.title}`,
		link: `/ratgeber/${g.slug}`,
		category: 'RATGEBER',
		pubDate: pseudoRecentDate(g.slug, 72),
		description: g.excerpt
	}));
}

/**
 * Roulette zeigt bewusst auf den echten Pilotverein (/c/stc-oberland) statt
 * auf eine generische Übersicht — dasselbe ehrliche Framing wie die
 * Liga-Teaser auf der Startseite: ein konkretes Beispiel, keine Behauptung
 * flächendeckender Verfügbarkeit.
 */
const FEATURE_ANNOUNCEMENTS: Omit<FeedItem, 'pubDate'>[] = [
	{
		id: 'feature-roulette',
		title: 'Neu: Probier das Padel Roulette aus!',
		link: '/c/stc-oberland/roulette',
		category: 'FEATURE',
		description: 'Zufällige Doppelpartner für offene Vereinstermine — direkt online zusagen.'
	},
	{
		id: 'feature-quiz',
		title: 'Neu: Teste dein Padel-Wissen im Quiz',
		link: '/quiz',
		category: 'FEATURE',
		description: 'Drei Schwierigkeitsgrade, mit Erklärung zu jeder Antwort.'
	},
	{
		id: 'feature-ratgeber',
		title: 'Neu: Der PadelIndex-Ratgeber ist da',
		link: '/ratgeber',
		category: 'FEATURE',
		description: 'Regeln, Ausrüstung, Technik und Taktik verständlich erklärt.'
	},
	{
		id: 'feature-rating',
		title: 'Rating-Simulator: Sieh, wie ein Match dein Level verändert',
		link: '/rating',
		category: 'FEATURE',
		description: 'Derselbe Code wie im echten Betrieb — zum Selberausprobieren.'
	},
	{
		id: 'feature-karte',
		title: 'Karte: Finde Padel-Anlagen in deiner Nähe',
		link: '/karte',
		category: 'FEATURE',
		description: 'Anlagen-Verzeichnis mit Filter nach PadelIndex-Partnern.'
	}
];

function featureAnnouncements(): FeedItem[] {
	return FEATURE_ANNOUNCEMENTS.map((item) => ({ ...item, pubDate: pseudoRecentDate(item.id, 96) }));
}

/** Zentrale Einstiegsstelle für feed.xml und api/ticker — beide bündeln dieselben sechs Quellen. */
export async function buildFeed(platform?: App.Platform): Promise<FeedItem[]> {
	const [results, spotlights, newClubs] = await Promise.all([
		loadRecentResults(platform),
		loadPlayerSpotlights(platform),
		loadNewClubs(platform)
	]);

	return capFeed([
		...results,
		...spotlights,
		...newClubs,
		...clubCallToAction(),
		...guideHighlights(),
		...featureAnnouncements()
	]);
}
