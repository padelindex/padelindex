// ============================================================
// PadelIndex — Indexierungsregeln (Website-Audit Block 4)
// ============================================================
// Ein Profil mit einem oder zwei Matches ist noch keine belastbare
// Aussage über das Level — Google soll solche Seiten nicht ranken, bis
// genug bestätigte Matches für einen stabilen Wert da sind (siehe auch
// is_provisional in der DB, das dieselbe Grenze grob nachbildet, aber
// eigenständig bleibt: provisorisch ist eine Aussage übers Rating,
// indexierbar eine Aussage über die Seite).
export const MIN_MATCHES_FOR_INDEXING = 5;

export function isProfileIndexable(matchesPlayed: number): boolean {
	return matchesPlayed >= MIN_MATCHES_FOR_INDEXING;
}
