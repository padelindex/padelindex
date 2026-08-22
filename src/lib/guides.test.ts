import { describe, it, expect } from 'vitest';
import {
	findGuide,
	guidesByCategory,
	popularGuides,
	beginnerGuides,
	relatedGuides,
	searchGuides,
	type GuideArticle
} from './guides';
import { GUIDES_DE as GUIDES } from './content/guides/de';
import { GUIDES_EN } from './content/guides/en';
import { GUIDES_ES } from './content/guides/es';

describe('guides-data Integrität (DE)', () => {
	it('hat für jeden Artikel einen eindeutigen Slug', () => {
		const slugs = GUIDES.map((g) => g.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('verlinkt in relatedSlugs nur auf existierende Artikel', () => {
		const slugs = new Set(GUIDES.map((g) => g.slug));
		for (const guide of GUIDES) {
			for (const related of guide.relatedSlugs) {
				expect(slugs.has(related), `${guide.slug} verlinkt auf unbekannten Slug "${related}"`).toBe(
					true
				);
			}
		}
	});

	it('verlinkt keinen Artikel auf sich selbst', () => {
		for (const guide of GUIDES) {
			expect(guide.relatedSlugs).not.toContain(guide.slug);
		}
	});

	it('hat für jeden Artikel mindestens eine Sektion und eine FAQ', () => {
		for (const guide of GUIDES) {
			expect(guide.sections.length).toBeGreaterThan(0);
			expect(guide.faq.length).toBeGreaterThan(0);
		}
	});

	it('hat innerhalb eines Artikels eindeutige Sektions-IDs (für Sprungmarken)', () => {
		for (const guide of GUIDES) {
			const ids = guide.sections.map((s) => s.id);
			expect(new Set(ids).size, `${guide.slug} hat doppelte Sektions-IDs`).toBe(ids.length);
		}
	});

	it('enthält alle 12 im Briefing geforderten Artikel', () => {
		const expected = [
			'padel-regeln',
			'padel-ausruestung',
			'padel-schlaeger',
			'padel-schuhe',
			'padel-technik',
			'padel-taktik',
			'padel-fuer-anfaenger',
			'padel-vs-tennis',
			'padel-begriffe',
			'padel-training',
			'padel-doppel',
			'padel-kosten'
		];
		const slugs = GUIDES.map((g) => g.slug);
		for (const slug of expected) {
			expect(slugs).toContain(slug);
		}
		expect(slugs.length).toBe(expected.length);
	});
});

describe('findGuide', () => {
	it('findet einen Artikel per Slug', () => {
		expect(findGuide(GUIDES, 'padel-regeln')?.slug).toBe('padel-regeln');
	});

	it('gibt undefined für unbekannten Slug zurück', () => {
		expect(findGuide(GUIDES, 'nicht-vorhanden')).toBeUndefined();
	});
});

describe('guidesByCategory', () => {
	it('filtert korrekt nach Kategorie', () => {
		const result = guidesByCategory(GUIDES, 'ausruestung');
		expect(result.length).toBeGreaterThan(0);
		expect(result.every((g) => g.category === 'ausruestung')).toBe(true);
	});
});

describe('popularGuides / beginnerGuides', () => {
	it('gibt nur als populär markierte Artikel zurück', () => {
		const result = popularGuides(GUIDES);
		expect(result.every((g) => g.popular)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});

	it('gibt nur für Anfänger empfohlene Artikel zurück', () => {
		const result = beginnerGuides(GUIDES);
		expect(result.every((g) => g.beginnerRecommended)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});

	it('respektiert das Limit', () => {
		expect(popularGuides(GUIDES, 2).length).toBeLessThanOrEqual(2);
	});
});

describe('relatedGuides', () => {
	it('löst relatedSlugs zu echten Artikeln auf', () => {
		const article = findGuide(GUIDES, 'padel-regeln') as GuideArticle;
		const related = relatedGuides(GUIDES, article);
		expect(related.length).toBeGreaterThan(0);
		expect(related.every((g) => article.relatedSlugs.includes(g.slug))).toBe(true);
	});
});

describe('searchGuides', () => {
	it('gibt bei leerer Query alle Artikel zurück', () => {
		expect(searchGuides(GUIDES, '').length).toBe(GUIDES.length);
	});

	it('findet Artikel über den Titel', () => {
		const result = searchGuides(GUIDES, 'Schläger');
		expect(result.some((g) => g.slug === 'padel-schlaeger')).toBe(true);
	});

	it('ist case-insensitiv', () => {
		const result = searchGuides(GUIDES, 'BANDEJA');
		expect(result.length).toBeGreaterThan(0);
	});

	it('gibt leeres Array für nicht vorkommende Begriffe zurück', () => {
		expect(searchGuides(GUIDES, 'xyzxyzxyz')).toEqual([]);
	});
});

describe('Übersetzungsparität DE/EN/ES', () => {
	const locales: [string, GuideArticle[]][] = [
		['en', GUIDES_EN],
		['es', GUIDES_ES]
	];

	it('hat in jeder Sprache dieselbe Anzahl Artikel', () => {
		for (const [, guides] of locales) {
			expect(guides.length).toBe(GUIDES.length);
		}
	});

	it('hat in jeder Sprache dieselben Slugs in derselben Reihenfolge', () => {
		const deSlugs = GUIDES.map((g) => g.slug);
		for (const [locale, guides] of locales) {
			expect(
				guides.map((g) => g.slug),
				`Slugs weichen ab für ${locale}`
			).toEqual(deSlugs);
		}
	});

	it('hat pro Artikel in jeder Sprache dieselben Sektions-IDs', () => {
		for (const [locale, guides] of locales) {
			for (const deGuide of GUIDES) {
				const translated = findGuide(guides, deGuide.slug) as GuideArticle;
				expect(
					translated.sections.map((s) => s.id),
					`${deGuide.slug} (${locale}) hat andere Sektions-IDs als DE`
				).toEqual(deGuide.sections.map((s) => s.id));
			}
		}
	});

	it('hat pro Artikel in jeder Sprache dieselbe FAQ-Anzahl', () => {
		for (const [locale, guides] of locales) {
			for (const deGuide of GUIDES) {
				const translated = findGuide(guides, deGuide.slug) as GuideArticle;
				expect(
					translated.faq.length,
					`${deGuide.slug} (${locale}) hat andere FAQ-Anzahl als DE`
				).toBe(deGuide.faq.length);
			}
		}
	});

	it('hat pro Artikel in jeder Sprache dieselben category/difficulty/relatedSlugs-Werte', () => {
		for (const [locale, guides] of locales) {
			for (const deGuide of GUIDES) {
				const translated = findGuide(guides, deGuide.slug) as GuideArticle;
				expect(translated.category, `${deGuide.slug} (${locale})`).toBe(deGuide.category);
				expect(translated.difficulty, `${deGuide.slug} (${locale})`).toBe(deGuide.difficulty);
				expect(translated.relatedSlugs, `${deGuide.slug} (${locale})`).toEqual(
					deGuide.relatedSlugs
				);
			}
		}
	});
});
