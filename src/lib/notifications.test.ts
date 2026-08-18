import { describe, expect, it } from 'vitest';
import { formatScore, matchReportedEmail } from './notifications';

describe('formatScore', () => {
	it('verbindet mehrere Sätze mit Komma', () => {
		expect(
			formatScore([
				{ team1Games: 6, team2Games: 3 },
				{ team1Games: 4, team2Games: 6 }
			])
		).toBe('6:3, 4:6');
	});
});

describe('matchReportedEmail', () => {
	const base = {
		reporterName: 'Sören N.',
		partnerName: 'Jannik M.',
		sets: [{ team1Games: 6, team2Games: 3 }],
		kontoUrl: 'https://padelindex.de/konto#ausstehend'
	};

	it('enthält das Ergebnis im Betreff', () => {
		expect(matchReportedEmail(base).subject).toContain('6:3');
	});

	it('enthält Namen und einen Link zum Bestätigen im HTML', () => {
		const { html } = matchReportedEmail(base);
		expect(html).toContain('Sören N.');
		expect(html).toContain('Jannik M.');
		expect(html).toContain('href="https://padelindex.de/konto#ausstehend"');
	});

	it('escaped HTML in Namen (Anzeigename ist frei wählbar)', () => {
		const { html } = matchReportedEmail({
			...base,
			reporterName: '<script>alert(1)</script>'
		});
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});
});
