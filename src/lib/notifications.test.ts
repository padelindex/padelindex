import { describe, expect, it } from 'vitest';
import {
	challengeAcceptedEmail,
	challengeDeclinedEmail,
	formatScore,
	matchReportedEmail,
	playRequestAcceptedEmail,
	playRequestDeclinedEmail
} from './notifications';

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

describe('playRequestAcceptedEmail', () => {
	const base = {
		responderName: 'Markus K.',
		date: '2026-04-13',
		startTime: '18:00',
		endTime: '20:00',
		url: 'https://padelindex.de/anfragen'
	};

	it('enthält Name, Termin und Link', () => {
		const { subject, html } = playRequestAcceptedEmail(base);
		expect(subject).toContain('Markus K.');
		expect(html).toContain('13.04.2026');
		expect(html).toContain('18:00');
		expect(html).toContain('href="https://padelindex.de/anfragen"');
	});

	it('escaped HTML im Namen', () => {
		const { html } = playRequestAcceptedEmail({ ...base, responderName: '<b>x</b>' });
		expect(html).not.toContain('<b>x</b>');
	});
});

describe('playRequestDeclinedEmail', () => {
	it('enthält Name und Link', () => {
		const { subject, html } = playRequestDeclinedEmail({
			responderName: 'Markus K.',
			url: 'https://padelindex.de/spieler-finden'
		});
		expect(subject).toContain('Markus K.');
		expect(html).toContain('href="https://padelindex.de/spieler-finden"');
	});
});

describe('challengeAcceptedEmail', () => {
	const base = {
		accepterName: 'Tobias L.',
		date: '2026-04-13',
		startTime: '19:00',
		endTime: '21:00',
		url: 'https://padelindex.de/challenges'
	};

	it('enthält Name, Termin und Link', () => {
		const { subject, html } = challengeAcceptedEmail(base);
		expect(subject).toContain('Tobias L.');
		expect(html).toContain('13.04.2026');
		expect(html).toContain('19:00');
		expect(html).toContain('href="https://padelindex.de/challenges"');
	});

	it('escaped HTML im Namen', () => {
		const { html } = challengeAcceptedEmail({ ...base, accepterName: '<i>y</i>' });
		expect(html).not.toContain('<i>y</i>');
	});
});

describe('challengeDeclinedEmail', () => {
	it('enthält Name und Link', () => {
		const { subject, html } = challengeDeclinedEmail({
			declinerName: 'Tobias L.',
			url: 'https://padelindex.de/challenges'
		});
		expect(subject).toContain('Tobias L.');
		expect(html).toContain('href="https://padelindex.de/challenges"');
	});
});
