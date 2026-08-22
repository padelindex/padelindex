// ============================================================
// PadelIndex — reine Hilfsfunktionen rund um Login-Redirects
// ============================================================

/**
 * Sanitisiert ein ?next=-Ziel nach einem Magic-Link-Login. Nur relative,
 * interne Pfade sind erlaubt — sonst könnte ein manipulierter Link
 * (`?next=https://böse.example`) den Nutzer nach dem Login umleiten
 * (Open Redirect).
 *
 * Supabase liefert {{ .RedirectTo }} im E-Mail-Template als ABSOLUTE URL
 * (emailRedirectTo verlangt das). Mit bekanntem `origin` wird eine
 * absolute URL deshalb auf ihren Pfad reduziert, wenn sie zum eigenen
 * Origin gehört — jede andere absolute URL bleibt abgelehnt.
 */
export function safeRedirectTarget(
	raw: string | null | undefined,
	{ fallback = '/', origin }: { fallback?: string; origin?: string } = {}
): string {
	if (!raw) return fallback;

	if (raw.includes('://')) {
		if (!origin) return fallback;
		try {
			const parsed = new URL(raw);
			if (parsed.origin !== origin) return fallback;
			const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
			return path || fallback;
		} catch {
			return fallback;
		}
	}

	if (!raw.startsWith('/')) return fallback;
	// "//evil.com" ist protokollrelativ und wird von Browsern wie eine
	// absolute URL behandelt.
	if (raw.startsWith('//')) return fallback;
	return raw;
}
