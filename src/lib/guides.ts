// ============================================================
// PadelIndex — Ratgeber: Typen und reine Hilfsfunktionen
// ============================================================
// Content liegt lokal in guides-data.ts (kein CMS) — reine Daten,
// getrennt von den Svelte-Komponenten, die sie rendern. Gleiches
// Muster wie venues.ts/rating-core.ts: Datenlogik ohne DOM-/DB-Zugriff
// ist trivial zu testen und unabhängig von der Anzeige.

import { m } from './paraglide/messages.js';
import { type Locale } from './paraglide/runtime';
import { GUIDES_DE } from './content/guides/de';
import { GUIDES_EN } from './content/guides/en';
import { GUIDES_ES } from './content/guides/es';

export type GuideCategory = 'regeln' | 'ausruestung' | 'technik-taktik' | 'einstieg' | 'kosten';

export function categoryLabels(): Record<GuideCategory, string> {
	return {
		regeln: m.guide_cat_regeln(),
		ausruestung: m.guide_cat_ausruestung(),
		'technik-taktik': m.guide_cat_technik_taktik(),
		einstieg: m.guide_cat_einstieg(),
		kosten: m.guide_cat_kosten()
	};
}

export function categoryDescriptions(): Record<GuideCategory, string> {
	return {
		regeln: m.guide_cat_regeln_desc(),
		ausruestung: m.guide_cat_ausruestung_desc(),
		'technik-taktik': m.guide_cat_technik_taktik_desc(),
		einstieg: m.guide_cat_einstieg_desc(),
		kosten: m.guide_cat_kosten_desc()
	};
}

/** Zentrale Content-Quelle je Sprache — identische Slugs/Struktur, nur Text unterschiedlich. */
export function guidesFor(locale: Locale): GuideArticle[] {
	switch (locale) {
		case 'en':
			return GUIDES_EN;
		case 'es':
			return GUIDES_ES;
		default:
			return GUIDES_DE;
	}
}

export type GuideBoxKind = 'info' | 'checklist' | 'tips' | 'mistakes';

export type GuideBox = {
	kind: GuideBoxKind;
	title: string;
	items: string[];
};

export type GuideSection = {
	id: string;
	heading: string;
	paragraphs?: string[];
	box?: GuideBox;
};

export type FAQItem = {
	question: string;
	answer: string;
};

export type GuideArticle = {
	slug: string;
	title: string;
	metaTitle: string;
	metaDescription: string;
	excerpt: string;
	category: GuideCategory;
	difficulty: 'einsteiger' | 'fortgeschritten' | 'alle';
	readingTime: number;
	updatedAt: string;
	popular?: boolean;
	beginnerRecommended?: boolean;
	sections: GuideSection[];
	faq: FAQItem[];
	relatedSlugs: string[];
};

export function difficultyLabels(): Record<GuideArticle['difficulty'], string> {
	return {
		einsteiger: m.guide_diff_einsteiger(),
		fortgeschritten: m.guide_diff_fortgeschritten(),
		alle: m.guide_diff_alle()
	};
}

export function findGuide(guides: GuideArticle[], slug: string): GuideArticle | undefined {
	return guides.find((g) => g.slug === slug);
}

export function guidesByCategory(guides: GuideArticle[], category: GuideCategory): GuideArticle[] {
	return guides.filter((g) => g.category === category);
}

export function popularGuides(guides: GuideArticle[], limit = 4): GuideArticle[] {
	return guides.filter((g) => g.popular).slice(0, limit);
}

export function beginnerGuides(guides: GuideArticle[], limit = 4): GuideArticle[] {
	return guides.filter((g) => g.beginnerRecommended).slice(0, limit);
}

export function relatedGuides(
	guides: GuideArticle[],
	article: GuideArticle,
	limit = 3
): GuideArticle[] {
	return article.relatedSlugs
		.map((slug) => findGuide(guides, slug))
		.filter((g): g is GuideArticle => g !== undefined)
		.slice(0, limit);
}

/** Einfache Substring-Suche über Titel, Kurztext und Überschriften — reicht für ~12–50 Artikel völlig aus, kein Suchindex nötig. */
export function searchGuides(guides: GuideArticle[], query: string): GuideArticle[] {
	const q = query.trim().toLowerCase();
	if (!q) return guides;
	return guides.filter((g) => {
		const haystack = [g.title, g.excerpt, ...g.sections.map((s) => s.heading)]
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}
