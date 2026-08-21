// ============================================================
// PadelIndex — Locale für Date.toLocaleDateString()
// ============================================================
// BCP-47-Tags mit Bindestrich statt Unterstrich (anders als og:locale
// in hreflang.ts) — das erwartet die Intl-API.

import type { Locale } from '$lib/paraglide/runtime';

const DATE_LOCALES: Record<Locale, string> = { de: 'de-DE', en: 'en-US', es: 'es-ES' };

export function dateLocaleFor(locale: Locale): string {
	return DATE_LOCALES[locale];
}
