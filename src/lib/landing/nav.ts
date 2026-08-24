// ============================================================
// PadelIndex — geteilte Hauptnavigation
// ============================================================
// War bislang 14x identisch in einzelnen +page.svelte-Dateien kopiert
// (Startseite, /rating, /vereine, /faq, /ueber, /karte,
// /level-schaetzen, die Liga-Verwaltungsseiten). Eine Stelle, damit ein
// neuer Nav-Punkt nicht 14 Edits braucht.
//
// BEWUSST EINE FUNKTION, KEIN STATISCHES ARRAY: m.xxx()/localizeHref()
// lesen die aktuelle Sprache aus Paraglides Request-lokalem Kontext
// (AsyncLocalStorage). Ein einmal beim Modul-Laden ausgewertetes Array
// würde auf dem Server über den ersten Request hinweg im selben
// Worker-Isolate hängen bleiben — mainNav() wird deshalb bei jedem
// Komponenten-Render frisch aufgerufen (siehe LandingNav-Aufrufstellen).
import { m } from '$lib/paraglide/messages.js';
import { localizeHref } from '$lib/paraglide/runtime';

// Ziel des "Platz sichern"-CTAs (Nav-Button, Rating-Seite, Vereinsseiten):
// wer schon ein Konto hat, will spielen (Spieler finden), alle anderen
// erst mal eins anlegen. Ersetzt die frühere Warteliste (E-Mail-Eintrag),
// die auf `/registrieren` — direkte Kontoerstellung — nicht mehr gebraucht
// wird.
export function ctaHref(loggedIn: boolean): string {
	return localizeHref(loggedIn ? '/spieler-finden' : '/registrieren');
}

export function mainNav(): { href: string; label: string }[] {
	return [
		{ href: localizeHref('/#problem'), label: m.nav_warum() },
		{ href: localizeHref('/rating'), label: m.nav_rating() },
		{ href: localizeHref('/c/stc-oberland'), label: m.nav_rangliste() },
		{ href: localizeHref('/spieler-finden'), label: m.nav_spieler_finden() },
		{ href: localizeHref('/#tokens'), label: m.nav_tokens() },
		{ href: localizeHref('/vereine'), label: m.nav_fuer_vereine() }
	];
}
