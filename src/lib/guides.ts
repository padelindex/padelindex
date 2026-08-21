// ============================================================
// PadelIndex — Ratgeber: Typen und reine Hilfsfunktionen
// ============================================================
// Content liegt lokal in guides-data.ts (kein CMS) — reine Daten,
// getrennt von den Svelte-Komponenten, die sie rendern. Gleiches
// Muster wie venues.ts/rating-core.ts: Datenlogik ohne DOM-/DB-Zugriff
// ist trivial zu testen und unabhängig von der Anzeige.

export type GuideCategory = 'regeln' | 'ausruestung' | 'technik-taktik' | 'einstieg' | 'kosten';

export const CATEGORY_LABELS: Record<GuideCategory, string> = {
	regeln: 'Regeln & Wissen',
	ausruestung: 'Ausrüstung',
	'technik-taktik': 'Technik & Taktik',
	einstieg: 'Einstieg & Training',
	kosten: 'Kosten'
};

export const CATEGORY_DESCRIPTIONS: Record<GuideCategory, string> = {
	regeln: 'Grundlagen, Begriffe und der Vergleich zu anderen Rückschlagsportarten.',
	ausruestung: 'Schläger, Schuhe und was du zum Start wirklich brauchst.',
	'technik-taktik': 'Schläge, Spielsysteme und Doppel-Strategie fürs bessere Spiel.',
	einstieg: 'Dein erster Schritt in den Sport und wie du dich danach verbesserst.',
	kosten: 'Was Padel unterm Strich kostet — und wo du sparen kannst.'
};

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

export const DIFFICULTY_LABELS: Record<GuideArticle['difficulty'], string> = {
	einsteiger: 'Einsteiger',
	fortgeschritten: 'Fortgeschritten',
	alle: 'Für alle Level'
};

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
