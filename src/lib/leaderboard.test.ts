import { describe, expect, it } from 'vitest';
import { clampLeaderboardLimit, clampLeaderboardPage, totalPagesFor } from './leaderboard';

describe('clampLeaderboardLimit', () => {
	it('caps free clubs at 10', () => {
		expect(clampLeaderboardLimit(50, 'free')).toBe(10);
	});

	it('allows basic/pro up to 50', () => {
		expect(clampLeaderboardLimit(40, 'basic')).toBe(40);
		expect(clampLeaderboardLimit(80, 'pro')).toBe(50);
	});
});

describe('totalPagesFor', () => {
	it('rechnet Gesamtseiten aus Mitgliederzahl und Seitengröße', () => {
		expect(totalPagesFor(86, 25)).toBe(4);
		expect(totalPagesFor(25, 25)).toBe(1);
		expect(totalPagesFor(26, 25)).toBe(2);
	});

	it('liefert mindestens eine Seite, auch bei einem leeren Verein', () => {
		expect(totalPagesFor(0, 25)).toBe(1);
	});
});

describe('clampLeaderboardPage', () => {
	it('lässt gültige Seiten unverändert', () => {
		expect(clampLeaderboardPage(2, 4)).toBe(2);
	});

	it('klemmt zu hohe Seiten auf die letzte gültige (URL-Manipulation)', () => {
		expect(clampLeaderboardPage(99, 4)).toBe(4);
	});

	it('klemmt Seite 0 oder negative Werte auf 1', () => {
		expect(clampLeaderboardPage(0, 4)).toBe(1);
		expect(clampLeaderboardPage(-5, 4)).toBe(1);
	});

	it('fällt ohne Angabe auf Seite 1 zurück', () => {
		expect(clampLeaderboardPage(undefined, 4)).toBe(1);
	});

	it('kommt mit einem Verein ohne Mitglieder klar (totalPages=1)', () => {
		expect(clampLeaderboardPage(3, 1)).toBe(1);
	});
});
