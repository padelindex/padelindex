// ============================================================
// PadelIndex — FAQ: Markdown-Links in Antworten
// ============================================================
// Die FAQ-Antworten kommen als Paraglide-Messages (reine Strings) mit
// einer schmalen Markdown-Syntax für interne Links: [Text](/pfad). Für
// die sichtbare Darstellung wird daraus ein echter Link (localizeHref
// sorgt für das Sprachpräfix), fürs FAQPage-JSON-LD dagegen reiner Text
// ohne Markup — Schema.org erwartet dort eine Antwort als Klartext.
//
// Kein Markdown-Parser: es gibt nur diese eine Syntax, alles andere im
// String ist normaler (zu escapender) Text.

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function parseFaqAnswer(
	markdown: string,
	localizeHref: (href: string) => string
): { html: string; plain: string } {
	let html = '';
	let plain = '';
	let lastIndex = 0;

	for (const match of markdown.matchAll(LINK_RE)) {
		const [full, label, href] = match;
		const index = match.index ?? 0;

		const before = markdown.slice(lastIndex, index);
		html += escapeHtml(before);
		plain += before;

		html += `<a href="${escapeHtml(localizeHref(href))}">${escapeHtml(label)}</a>`;
		plain += label;

		lastIndex = index + full.length;
	}

	const rest = markdown.slice(lastIndex);
	html += escapeHtml(rest);
	plain += rest;

	return { html, plain };
}
