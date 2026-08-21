import { describe, expect, it } from 'vitest';
import { hreflangLinksFor } from './hreflang';

describe('hreflangLinksFor', () => {
	it('liefert für jede Sprache plus x-default eine URL', () => {
		const links = hreflangLinksFor('/ratgeber/padel-regeln');
		const hreflangs = links.map((l) => l.hreflang).sort();
		expect(hreflangs).toEqual(['de', 'en', 'es', 'x-default']);
	});

	it('setzt die richtigen Präfixe pro Sprache', () => {
		const links = hreflangLinksFor('/rating');
		const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
		expect(byLang.de).toBe('https://padelindex.de/rating');
		expect(byLang.en).toBe('https://padelindex.de/en/rating');
		expect(byLang.es).toBe('https://padelindex.de/es/rating');
	});

	it('x-default zeigt auf die deutsche (Basis-)Version', () => {
		const links = hreflangLinksFor('/vereine');
		const xDefault = links.find((l) => l.hreflang === 'x-default');
		const de = links.find((l) => l.hreflang === 'de');
		expect(xDefault?.href).toBe(de?.href);
	});

	it('funktioniert für die Startseite ("/")', () => {
		const links = hreflangLinksFor('/');
		const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
		expect(byLang.de).toBe('https://padelindex.de/');
		expect(byLang.en).toBe('https://padelindex.de/en');
		expect(byLang.es).toBe('https://padelindex.de/es');
	});

	it('gibt für eine In-Scope-Seite mit Unterpfad korrekte Präfixe', () => {
		const links = hreflangLinksFor('/ratgeber/padel-schuhe');
		const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
		expect(byLang.en).toBe('https://padelindex.de/en/ratgeber/padel-schuhe');
		expect(byLang.es).toBe('https://padelindex.de/es/ratgeber/padel-schuhe');
	});

	it('funktioniert auch, wenn der übergebene Pfad bereits lokalisiert ist (page.url.pathname auf /en/…)', () => {
		const links = hreflangLinksFor('/en/rating');
		const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
		expect(byLang.de).toBe('https://padelindex.de/rating');
		expect(byLang.en).toBe('https://padelindex.de/en/rating');
		expect(byLang.es).toBe('https://padelindex.de/es/rating');
	});
});
