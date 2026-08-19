// ============================================================
// PadelIndex — Namensabgleich für das Beanspruchen von Profilen
// ============================================================
//
// Importierte Profile sind öffentlich nur abgekürzt sichtbar ("Robin K.").
// Wer sein Profil beanspruchen will, tippt deshalb seinen vollen Namen ein
// und wir suchen serverseitig danach. Das darf ausdrücklich KEINE Liste
// zurückgeben — sonst wäre der Klarnamen-Bestand durchprobierbar.
//
// Regel: nur ein einziger, deutlich bester Treffer wird bestätigt.

/** Spiegelt public_display_name() aus 0005_claimable_profiles.sql. */
export function abbreviateName(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length < 2) return fullName.trim();
	return `${parts[0]} ${parts[1][0]}.`;
}

/**
 * Zentrale Stelle für die Namensdarstellung im JS-Teil der App — jede Anzeige
 * eines Spielernamens gegenüber Dritten geht hier durch (player-profile.ts,
 * matchmaking.ts, club-members.ts, matches.ts, play-requests.ts). Spiegelt
 * public_display_name() aus 0014_block0_privacy.sql, das dieselbe Regel für
 * die SQL-Seite (club_leaderboard-View) übernimmt: voller Name nur bei
 * beanspruchtem UND dafür freigegebenem Profil (players.show_full_name),
 * sonst Vorname + Nachname-Initial.
 */
export function formatPlayerName(
	fullName: string,
	claimStatus: string,
	showFullName: boolean
): string {
	return claimStatus === 'claimed' && showFullName ? fullName : abbreviateName(fullName);
}

/** Kleinschreibung, Umlaute aufgelöst, Satzzeichen weg, Leerraum normalisiert. */
export function normalizeName(value: string): string {
	return value
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Levenshtein-Ähnlichkeit, 0..1. */
export function similarity(a: string, b: string): number {
	if (!a || !b) return 0;
	if (a === b) return 1;

	const m = a.length;
	const k = b.length;
	let prev = Array.from({ length: k + 1 }, (_, j) => j);
	let cur = new Array<number>(k + 1);

	for (let i = 1; i <= m; i++) {
		cur[0] = i;
		for (let j = 1; j <= k; j++) {
			cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
		}
		[prev, cur] = [cur, prev];
	}
	return 1 - prev[k] / Math.max(m, k);
}

/**
 * Eingabe muss nach Vor- UND Nachname aussehen. Verhindert, dass jemand
 * mit einem einzelnen Buchstaben oder einem bloßen Vornamen den Bestand
 * abklappert.
 */
export function isUsableClaimQuery(value: string): boolean {
	const parts = normalizeName(value).split(' ').filter(Boolean);
	return parts.length >= 2 && parts.every((p) => p.length >= 2) && parts.join('').length >= 6;
}

export const CLAIM_MATCH_THRESHOLD = 0.82;
/** Der beste Treffer muss den zweitbesten klar schlagen. */
export const CLAIM_MATCH_MARGIN = 0.08;

export interface NameCandidate {
	id: string;
	displayName: string;
}

/**
 * Genau ein Treffer oder gar keiner. Bei zwei ähnlich guten Kandidaten
 * (etwa Geschwistern mit ähnlichem Namen) bewusst kein Ergebnis — dann
 * muss der Verein manuell zuordnen, statt dass wir raten.
 */
export function matchClaimName<T extends NameCandidate>(
	query: string,
	candidates: T[]
): { match: T; score: number } | null {
	if (!isUsableClaimQuery(query)) return null;

	const q = normalizeName(query);
	const scored = candidates
		.map((c) => ({ candidate: c, score: similarity(q, normalizeName(c.displayName)) }))
		.sort((a, b) => b.score - a.score);

	const best = scored[0];
	if (!best || best.score < CLAIM_MATCH_THRESHOLD) return null;

	const runnerUp = scored[1];
	if (runnerUp && best.score - runnerUp.score < CLAIM_MATCH_MARGIN) return null;

	return { match: best.candidate, score: Number(best.score.toFixed(4)) };
}
