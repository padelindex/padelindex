import { describe, expect, it } from 'vitest';
import { parseFaqAnswer } from './faq';

const identity = (href: string) => href;

describe('parseFaqAnswer', () => {
	it('gibt Text ohne Link unverändert zurück', () => {
		const { html, plain } = parseFaqAnswer('Einfacher Satz ohne Link.', identity);
		expect(html).toBe('Einfacher Satz ohne Link.');
		expect(plain).toBe('Einfacher Satz ohne Link.');
	});

	it('wandelt [Text](/pfad) in einen echten Link um', () => {
		const { html, plain } = parseFaqAnswer('Siehe [die Rating-Seite](/rating) für mehr.', identity);
		expect(html).toBe('Siehe <a href="/rating">die Rating-Seite</a> für mehr.');
		expect(plain).toBe('Siehe die Rating-Seite für mehr.');
	});

	it('wendet localizeHref auf das Linkziel an, nicht auf den Label-Text', () => {
		const localize = (href: string) => `/en${href}`;
		const { html } = parseFaqAnswer('[Für Vereine](/vereine)', localize);
		expect(html).toBe('<a href="/en/vereine">Für Vereine</a>');
	});

	it('escaped HTML-Sonderzeichen im Fließtext', () => {
		const { html, plain } = parseFaqAnswer('Wert < 5 & > 0 sowie "Zitat"', identity);
		expect(html).toBe('Wert &lt; 5 &amp; &gt; 0 sowie &quot;Zitat&quot;');
		expect(plain).toBe('Wert < 5 & > 0 sowie "Zitat"');
	});

	it('verarbeitet mehrere Links im selben Text', () => {
		const { html, plain } = parseFaqAnswer(
			'Mehr unter [Rating](/rating) und [Vereine](/vereine).',
			identity
		);
		expect(html).toBe(
			'Mehr unter <a href="/rating">Rating</a> und <a href="/vereine">Vereine</a>.'
		);
		expect(plain).toBe('Mehr unter Rating und Vereine.');
	});
});
