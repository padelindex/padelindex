import { describe, expect, it } from 'vitest';
import { validateMatchReport } from './match-report';

const base = {
	reporterId: 'p1',
	partnerId: 'p2',
	opponent1Id: 'p3',
	opponent2Id: 'p4',
	sets: [{ team1Games: 6, team2Games: 3 }],
	matchType: 'freizeit' as const
};

describe('validateMatchReport', () => {
	it('akzeptiert ein gültiges Einzelsatz-Match', () => {
		expect(validateMatchReport(base)).toEqual({ ok: true });
	});

	it('akzeptiert bis zu drei Sätze', () => {
		expect(
			validateMatchReport({
				...base,
				sets: [
					{ team1Games: 6, team2Games: 4 },
					{ team1Games: 4, team2Games: 6 },
					{ team1Games: 7, team2Games: 6 }
				]
			})
		).toEqual({ ok: true });
	});

	it('lehnt weniger als vier verschiedene Spieler ab', () => {
		expect(validateMatchReport({ ...base, partnerId: 'p1' }).ok).toBe(false);
	});

	it('lehnt fehlende Spieler ab', () => {
		expect(validateMatchReport({ ...base, opponent2Id: '' }).ok).toBe(false);
	});

	it('lehnt null oder mehr als drei Sätze ab', () => {
		expect(validateMatchReport({ ...base, sets: [] }).ok).toBe(false);
		expect(
			validateMatchReport({
				...base,
				sets: [
					{ team1Games: 6, team2Games: 0 },
					{ team1Games: 6, team2Games: 0 },
					{ team1Games: 6, team2Games: 0 },
					{ team1Games: 6, team2Games: 0 }
				]
			}).ok
		).toBe(false);
	});

	it('lehnt unentschiedene Sätze ab', () => {
		expect(validateMatchReport({ ...base, sets: [{ team1Games: 6, team2Games: 6 }] }).ok).toBe(
			false
		);
	});

	it('lehnt Spielstände außerhalb 0-99 ab', () => {
		expect(validateMatchReport({ ...base, sets: [{ team1Games: 100, team2Games: 3 }] }).ok).toBe(
			false
		);
		expect(validateMatchReport({ ...base, sets: [{ team1Games: -1, team2Games: 3 }] }).ok).toBe(
			false
		);
	});

	it('lehnt Nicht-Ganzzahlen ab', () => {
		expect(validateMatchReport({ ...base, sets: [{ team1Games: 6.5, team2Games: 3 }] }).ok).toBe(
			false
		);
	});

	it('lehnt ungültigen Match-Typ ab', () => {
		// @ts-expect-error absichtlich ungültiger Wert
		expect(validateMatchReport({ ...base, matchType: 'urlaub' }).ok).toBe(false);
	});

	it('akzeptiert alle fünf gültigen Match-Typen', () => {
		for (const matchType of ['gps', 'turnier', 'vereinsliga', 'padelindex_challenge', 'freizeit'] as const) {
			expect(validateMatchReport({ ...base, matchType })).toEqual({ ok: true });
		}
	});
});
