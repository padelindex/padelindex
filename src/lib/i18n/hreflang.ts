// ============================================================
// PadelIndex — hreflang-Alternates für mehrsprachige Seiten
// ============================================================
// Eine Quelle der Wahrheit für "welche Sprachvarianten gibt es von
// dieser Seite und wie lauten ihre URLs" — verwendet sowohl in den
// Seiten-<svelte:head>-Blöcken (HreflangLinks.svelte) als auch in der
// Sitemap (sitemap.xml/+server.ts). Baut auf Paraglides eigener
// localizeUrl()/locales/baseLocale auf statt eine zweite, abweichende
// URL-Logik zu pflegen.

import { baseLocale, locales, localizeUrl, type Locale } from '$lib/paraglide/runtime';

const ORIGIN = 'https://padelindex.de';

export type HreflangLink = { hreflang: Locale | 'x-default'; href: string };

/**
 * @param pathname Seitenrelativer, DELOKALISIERTER Pfad (z. B. "/ratgeber/padel-regeln",
 *   nicht "/en/ratgeber/padel-regeln") — die Basis, aus der alle Sprachvarianten
 *   abgeleitet werden.
 */
export function hreflangLinksFor(pathname: string): HreflangLink[] {
	const base = new URL(pathname, ORIGIN);

	const perLocale: HreflangLink[] = locales.map((locale) => ({
		hreflang: locale,
		href: localizeUrl(base, { locale }).href
	}));

	const defaultHref = localizeUrl(base, { locale: baseLocale }).href;

	return [...perLocale, { hreflang: 'x-default', href: defaultHref }];
}
