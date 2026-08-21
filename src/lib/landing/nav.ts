// ============================================================
// PadelIndex — geteilte Hauptnavigation
// ============================================================
// War bislang 14x identisch in einzelnen +page.svelte-Dateien kopiert
// (Startseite, /rating, /vereine, /faq, /ueber, /karte,
// /level-schaetzen, die Liga-Verwaltungsseiten). Eine Stelle, damit ein
// neuer Nav-Punkt nicht 14 Edits braucht.

export const MAIN_NAV = [
	{ href: '/#problem', label: 'Warum' },
	{ href: '/rating', label: 'Rating' },
	{ href: '/#tokens', label: 'Tokens' },
	{ href: '/ratgeber', label: 'Ratgeber' },
	{ href: '/quiz', label: 'Quiz' },
	{ href: '/vereine', label: 'Für Vereine' }
];
