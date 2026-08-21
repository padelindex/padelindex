import { describe, expect, it } from 'vitest';
import {
	CATEGORY_META,
	type FeedCategory,
	type FeedItem,
	absoluteLink,
	capFeed,
	escapeXml,
	hashString,
	pseudoRecentDate,
	sortByPubDateDesc
} from './feed';

const CATEGORIES: FeedCategory[] = [
	'ERGEBNIS',
	'SPIELER',
	'NEUER_VEREIN',
	'CLUB_CTA',
	'RATGEBER',
	'FEATURE'
];

function item(overrides: Partial<FeedItem> & Pick<FeedItem, 'id' | 'pubDate'>): FeedItem {
	return {
		title: 'Titel',
		link: '/',
		category: 'FEATURE',
		description: 'Beschreibung',
		...overrides
	};
}

describe('CATEGORY_META', () => {
	it('deckt jede Kategorie mit Label und Farben ab', () => {
		for (const category of CATEGORIES) {
			const meta = CATEGORY_META[category];
			expect(meta.label.length).toBeGreaterThan(0);
			expect(meta.background).toMatch(/^#/);
			expect(meta.color).toMatch(/^#/);
		}
	});
});

describe('absoluteLink', () => {
	it('macht einen seitenrelativen Link absolut', () => {
		expect(absoluteLink('/ratgeber/padel-regeln')).toBe(
			'https://padelindex.de/ratgeber/padel-regeln'
		);
	});

	it('lässt bereits absolute Links unverändert', () => {
		expect(absoluteLink('https://example.com/x')).toBe('https://example.com/x');
	});
});

describe('sortByPubDateDesc / capFeed', () => {
	it('sortiert neueste zuerst', () => {
		const items = [
			item({ id: 'a', pubDate: '2026-01-01T00:00:00.000Z' }),
			item({ id: 'b', pubDate: '2026-03-01T00:00:00.000Z' }),
			item({ id: 'c', pubDate: '2026-02-01T00:00:00.000Z' })
		];
		expect(sortByPubDateDesc(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
	});

	it('kappt auf die angegebene Höchstzahl', () => {
		const items = Array.from({ length: 25 }, (_, i) =>
			item({ id: `item-${i}`, pubDate: new Date(2026, 0, i + 1).toISOString() })
		);
		expect(capFeed(items).length).toBe(20);
		expect(capFeed(items, 5).length).toBe(5);
	});

	it('verändert das übergebene Array nicht', () => {
		const items = [item({ id: 'a', pubDate: '2026-01-01T00:00:00.000Z' })];
		const copy = [...items];
		sortByPubDateDesc(items);
		expect(items).toEqual(copy);
	});
});

describe('hashString', () => {
	it('ist deterministisch für denselben Input', () => {
		expect(hashString('padel-regeln:2026-08-21')).toBe(hashString('padel-regeln:2026-08-21'));
	});

	it('liefert für unterschiedliche Inputs (meistens) unterschiedliche Werte', () => {
		expect(hashString('a')).not.toBe(hashString('b'));
	});

	it('liefert immer ein nicht-negatives Ergebnis', () => {
		expect(hashString('')).toBeGreaterThanOrEqual(0);
		expect(hashString('ß€🎾')).toBeGreaterThanOrEqual(0);
	});
});

describe('pseudoRecentDate', () => {
	const now = new Date('2026-08-21T12:00:00.000Z');

	it('liegt innerhalb des angegebenen Zeitfensters in der Vergangenheit', () => {
		const result = new Date(pseudoRecentDate('feature-quiz', 96, now));
		expect(result.getTime()).toBeLessThanOrEqual(now.getTime());
		expect(result.getTime()).toBeGreaterThanOrEqual(now.getTime() - 96 * 60 * 60 * 1000);
	});

	it('ist für denselben Tag deterministisch', () => {
		expect(pseudoRecentDate('feature-quiz', 96, now)).toBe(
			pseudoRecentDate('feature-quiz', 96, now)
		);
	});

	it('unterscheidet sich an einem anderen Kalendertag', () => {
		const nextDay = new Date('2026-08-22T12:00:00.000Z');
		expect(pseudoRecentDate('feature-quiz', 96, now)).not.toBe(
			pseudoRecentDate('feature-quiz', 96, nextDay)
		);
	});
});

describe('escapeXml', () => {
	it('escaped alle fünf XML-Sonderzeichen', () => {
		expect(escapeXml(`Tom & Jerry <"'>`)).toBe('Tom &amp; Jerry &lt;&quot;&apos;&gt;');
	});

	it('escaped & zuerst, damit bestehende Escapes nicht doppelt escaped werden', () => {
		expect(escapeXml('&amp;')).toBe('&amp;amp;');
	});
});
