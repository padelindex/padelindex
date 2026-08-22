// ============================================================
// PadelIndex — Filter und Suche fürs Anlagen-Verzeichnis
// ============================================================
// Reine Funktionen ohne DOM- oder DB-Zugriff, damit sie sich wie
// rating-core.ts direkt testen lassen. Die Karte ruft sie nur auf.

export type VenueFilter = 'all' | 'partner' | 'non_partner';

export type FilterableVenue = {
	name: string;
	city: string | null;
	postalCode: string | null;
	isPartner: boolean;
};

/**
 * Normalisiert für die Suche: Kleinschreibung plus Umlaut-Faltung.
 * Ohne die Faltung fände "Munchen" das "München" nicht — und genau so
 * tippen Leute, die gerade kein Umlaut-Layout haben.
 *
 * Bewusst NICHT über NFD/diakritische Zeichen gelöst: im Deutschen wird
 * ö zu oe, nicht zu o. "Koln" soll "Köln" finden, aber "Koeln" eben auch.
 */
export function normalizeForSearch(value: string): string {
	return value
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss');
}

/** Trifft der Suchbegriff Name, Stadt oder PLZ? Leerer Begriff trifft alles. */
export function matchesQuery(venue: FilterableVenue, query: string): boolean {
	const q = normalizeForSearch(query.trim());
	if (q === '') return true;

	// Auch die entgegengesetzte Richtung abdecken: wer "Köln" tippt, soll
	// einen als "Koeln" erfassten Datensatz ebenfalls finden.
	const haystack = [venue.name, venue.city, venue.postalCode]
		.filter((v): v is string => typeof v === 'string' && v.length > 0)
		.map(normalizeForSearch)
		.join(' ');

	return haystack.includes(q);
}

export function matchesFilter(venue: FilterableVenue, filter: VenueFilter): boolean {
	if (filter === 'partner') return venue.isPartner;
	if (filter === 'non_partner') return !venue.isPartner;
	return true;
}

export function filterVenues<T extends FilterableVenue>(
	venues: T[],
	filter: VenueFilter,
	query: string
): T[] {
	return venues.filter((v) => matchesFilter(v, filter) && matchesQuery(v, query));
}
