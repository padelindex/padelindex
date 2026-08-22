// ============================================================
// PadelIndex — Live-Ticker & RSS-Feed: Typen und reine Hilfsfunktionen
// ============================================================
// Gleiches Muster wie guides.ts/quiz.ts: alles, was sich ohne DB/DOM
// testen lässt, liegt hier. Das eigentliche Zusammenstellen aus der
// Datenbank passiert in server/feed.ts.

import { m } from './paraglide/messages.js';
import type { Locale } from './paraglide/runtime';

export type FeedCategory =
	'ERGEBNIS' | 'SPIELER' | 'NEUER_VEREIN' | 'CLUB_CTA' | 'RATGEBER' | 'FEATURE';

export type FeedItem = {
	id: string;
	title: string;
	/** Seitenrelativ, z. B. "/ratgeber/padel-regeln" — absolut gemacht erst beim Ausgeben (RSS). */
	link: string;
	category: FeedCategory;
	/** ISO 8601. */
	pubDate: string;
	description: string;
};

export type CategoryMeta = { label: string; background: string; color: string };

/**
 * Vier Badge-Farben für sechs Kategorien: Spieler-Spotlight und
 * Club-Aufruf drehen sich beide um Community-Wachstum und teilen sich
 * deshalb "COMMUNITY" (Blau). Die übrigen vier Kategorien greifen auf
 * bestehende Marken-Tokens zurück statt neue Farben zu erfinden
 * (--court-deep fürs Ratgeber-Teal, --signal fürs Feature-Gelb).
 */
export function categoryMetaFor(locale: Locale): Record<FeedCategory, CategoryMeta> {
	return {
		ERGEBNIS: {
			label: m.feed_cat_ergebnis({}, { locale }),
			background: '#E4572E',
			color: '#FFF4EE'
		},
		NEUER_VEREIN: {
			label: m.feed_cat_neuer_verein({}, { locale }),
			background: '#1E9E52',
			color: '#EAFBEF'
		},
		SPIELER: {
			label: m.feed_cat_community({}, { locale }),
			background: '#2F6FE0',
			color: '#EAF1FF'
		},
		CLUB_CTA: {
			label: m.feed_cat_community({}, { locale }),
			background: '#2F6FE0',
			color: '#EAF1FF'
		},
		RATGEBER: {
			label: m.feed_cat_ratgeber({}, { locale }),
			background: '#0C6E64',
			color: '#E7FBF8'
		},
		FEATURE: { label: m.feed_cat_feature({}, { locale }), background: '#E9B23C', color: '#241B00' }
	};
}

const ORIGIN = 'https://padelindex.de';
export const FEED_ORIGIN = ORIGIN;

export function absoluteLink(link: string): string {
	return link.startsWith('http') ? link : `${ORIGIN}${link}`;
}

export const MAX_FEED_ITEMS = 20;

export function sortByPubDateDesc(items: FeedItem[]): FeedItem[] {
	return [...items].sort((a, b) => (a.pubDate < b.pubDate ? 1 : a.pubDate > b.pubDate ? -1 : 0));
}

export function capFeed(items: FeedItem[], max: number = MAX_FEED_ITEMS): FeedItem[] {
	return sortByPubDateDesc(items).slice(0, max);
}

/** Deterministischer String-Hash (FNV-1a) — nur für Sortier-Positionen, keine Kryptografie. */
export function hashString(value: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/**
 * Statische Feed-Einträge (Feature-Hinweise, Ratgeber-Empfehlungen) haben
 * kein echtes Ereignisdatum. Ein deterministisches Pseudo-Datum sorgt
 * dafür, dass sie sich mit echten Ereignissen mischen statt immer an
 * derselben Stelle "einzufrieren" — pro Kalendertag stabil (mehrfacher
 * Abruf am selben Tag liefert dieselbe Reihenfolge), am nächsten Tag
 * neu gemischt.
 */
export function pseudoRecentDate(
	seed: string,
	maxHoursAgo: number,
	now: Date = new Date()
): string {
	const day = now.toISOString().slice(0, 10);
	const fraction = hashString(`${seed}:${day}`) / 0xffffffff;
	const offsetMs = fraction * maxHoursAgo * 60 * 60 * 1000;
	return new Date(now.getTime() - offsetMs).toISOString();
}

/** XML-Escaping fürs RSS — & muss zuerst laufen, sonst werden eigene Escapes erneut escaped. */
export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
