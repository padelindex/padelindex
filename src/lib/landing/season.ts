// ============================================================
// Die Beispiel-Saison der Landingpage
// ============================================================
// Rating-Verlauf und Token-Konto zeigen dieselbe Saison und müssen
// deshalb aus derselben Quelle lesen — sonst behaupten zwei Abschnitte
// dasselbe Beispiel und zeigen verschiedene Zahlen.
//
// Beide Abschnitte rechnen diese Folge durch das Produktivmodell:
// simulateCareer() für den Verlauf, simulateSeasonTokens() für die
// Gutschriften.

import type { CareerMatch } from './rating-demo';

const two = (a: number, b: number, c: number, d: number) => [
	{ team1Games: a, team2Games: b },
	{ team1Games: c, team2Games: d }
];
const three = (a: number, b: number, c: number, d: number, e: number, f: number) => [
	{ team1Games: a, team2Games: b },
	{ team1Games: c, team2Games: d },
	{ team1Games: e, team2Games: f }
];

export const SEASON: CareerMatch[] = [
	{ partner: 3.4, opponents: [3.6, 3.5], sets: two(6, 4, 6, 2) },
	{ partner: 3.5, opponents: [4.0, 3.9], sets: two(4, 6, 3, 6) },
	{ partner: 3.8, opponents: [3.7, 3.6], sets: two(6, 3, 6, 4) },
	{ partner: 3.6, opponents: [4.2, 4.1], sets: two(7, 5, 6, 4) },
	{ partner: 4.0, opponents: [4.3, 4.4], sets: two(6, 7, 4, 6) },
	{ partner: 3.9, opponents: [4.0, 3.8], sets: two(6, 2, 6, 1) },
	{ partner: 4.1, opponents: [4.5, 4.3], sets: two(6, 4, 7, 6) },
	{ partner: 4.2, opponents: [4.6, 4.7], sets: two(3, 6, 4, 6) },
	{ partner: 4.0, opponents: [4.2, 4.1], sets: two(6, 3, 6, 3) },
	{ partner: 4.3, opponents: [4.4, 4.5], sets: two(6, 4, 6, 4) },
	{ partner: 4.2, opponents: [4.8, 4.6], sets: three(7, 6, 3, 6, 7, 5) },
	{ partner: 4.4, opponents: [4.5, 4.4], sets: two(6, 2, 6, 3) },
	{ partner: 4.5, opponents: [4.9, 5.0], sets: two(4, 6, 6, 7) },
	{ partner: 4.6, opponents: [4.7, 4.6], sets: two(6, 4, 6, 2) }
];

/** Aus den Sätzen abgeleitet statt danebengeschrieben — sonst driftet die Zahl. */
export const SEASON_WINS = SEASON.filter((m) => {
	let s1 = 0;
	let s2 = 0;
	for (const s of m.sets) {
		if (s.team1Games > s.team2Games) s1++;
		else if (s.team2Games > s.team1Games) s2++;
	}
	return s1 > s2;
}).length;

export const SEASON_MATCHES = SEASON.length;
