// ============================================================
// PadelIndex — Brücke zwischen Demo-UI und echtem Rating-Modell
// ============================================================
// Der Match-Simulator auf der Landingpage rechnet mit computeMatchRatings()
// aus $lib/rating-core — demselben Code, der produktiv die Ratings vergibt.
// Dieses Modul übersetzt nur zwischen dem, was die Oberfläche zeigt
// (Rating 0–7, "so viele Matches gespielt"), und dem, was das Modell
// braucht (mu, sigma).
//
// Wichtig für die Ehrlichkeit der Demo: sigma wird NICHT frei erfunden.
// Im echten System schrumpft sigma durch die OpenSkill-Updates selbst.
// sigmaAfterMatches() bildet das nach, indem es tatsächlich n Matches
// durch dieselbe rate()-Funktion laufen lässt und das resultierende sigma
// abliest. Die Kurve stammt also aus dem Modell, nicht aus einer Formel,
// die "ungefähr so aussieht".
//
// Dieses Modul zieht openskill ins Bundle (~11 kB gzip) und wird deshalb
// von der Landingpage bewusst dynamisch importiert, sobald der Simulator
// in Sichtweite kommt.

import {
	BASE_MU,
	BASE_SIGMA,
	computeMatchRatings,
	computeTokenGrants,
	toDisplayRating,
	type PlayerState,
	type SetScore
} from '$lib/rating-core';

export { toDisplayRating, BASE_SIGMA, type SetScore };

/**
 * Umkehrung von toDisplayRating(): welches mu ergibt bei gegebenem sigma
 * den gewünschten Anzeigewert?
 *   display = (mu - 2*sigma) * 7 / 50   ->   mu = display * 50/7 + 2*sigma
 */
export function muForDisplay(display: number, sigma: number): number {
	return (display * 50) / 7 + 2 * sigma;
}

const sigmaTable: number[] = [];

/**
 * Realistisches sigma für "hat n Matches gespielt" — ermittelt, indem n
 * Matches wirklich durch das Produktivmodell gerechnet werden.
 *
 * Damit mu dabei nicht wegdriftet (was die Kurve verfälschen würde),
 * wechseln sich Sieg und Niederlage ab: die Unsicherheit sinkt, das
 * Können bleibt im Mittel gleich — genau der Effekt, den wir zeigen wollen.
 */
export function sigmaAfterMatches(matches: number): number {
	const n = Math.max(0, Math.min(120, Math.round(matches)));
	if (sigmaTable.length === 0) buildSigmaTable();
	return sigmaTable[Math.min(n, sigmaTable.length - 1)];
}

function buildSigmaTable() {
	const fresh = (): PlayerState => ({
		playerId: 'x',
		mu: BASE_MU,
		sigma: BASE_SIGMA,
		matchesPlayed: 0,
		currentStreak: 0
	});

	let me = fresh();
	const others = [fresh(), fresh(), fresh()];
	sigmaTable.push(BASE_SIGMA);

	for (let i = 0; i < 120; i++) {
		// Abwechselnd gewinnen und verlieren: 6:4 / 4:6 im Wechsel.
		const win = i % 2 === 0;
		const sets: SetScore[] = win
			? [{ team1Games: 6, team2Games: 4 }]
			: [{ team1Games: 4, team2Games: 6 }];

		const results = computeMatchRatings({
			team1: [me, others[0]],
			team2: [others[1], others[2]],
			sets
		});

		const mine = results.find((r) => r.playerId === me.playerId);
		if (!mine) break;

		me = {
			...me,
			mu: mine.muAfter,
			sigma: mine.sigmaAfter,
			matchesPlayed: me.matchesPlayed + 1
		};
		sigmaTable.push(me.sigma);
	}
}

export interface DemoPlayer {
	id: string;
	name: string;
	/** Anzeigewert 0–7, wie ihn die Oberfläche zeigt. */
	display: number;
	/** Bisher gespielte Matches — bestimmt sigma und damit die Beweglichkeit. */
	matches: number;
}

export interface DemoOutcome {
	id: string;
	name: string;
	before: number;
	after: number;
	delta: number;
	won: boolean;
	provisional: boolean;
	factors: {
		dominance: number;
		expectedWinProb: number;
		marginFactor: number;
		appliedFactor: number;
	};
}

function toState(p: DemoPlayer): PlayerState {
	const sigma = sigmaAfterMatches(p.matches);
	return {
		playerId: p.id,
		mu: muForDisplay(p.display, sigma),
		sigma,
		matchesPlayed: p.matches,
		currentStreak: 0
	};
}

/**
 * Rechnet ein Doppel mit dem echten Modell durch und gibt pro Spieler
 * das zurück, was die Oberfläche zeigt. Die Reihenfolge entspricht
 * team1 gefolgt von team2.
 */
export function simulateMatch(
	team1: DemoPlayer[],
	team2: DemoPlayer[],
	sets: SetScore[]
): DemoOutcome[] {
	const states1 = team1.map(toState);
	const states2 = team2.map(toState);
	const results = computeMatchRatings({ team1: states1, team2: states2, sets });
	const byId = new Map([...team1, ...team2].map((p) => [p.id, p]));

	return results.map((r) => ({
		id: r.playerId,
		name: byId.get(r.playerId)?.name ?? '',
		before: r.ratingBefore,
		after: r.ratingAfter,
		delta: Number((r.ratingAfter - r.ratingBefore).toFixed(2)),
		won: r.factors.won,
		provisional: r.factors.provisional,
		factors: {
			dominance: r.factors.dominance,
			expectedWinProb: r.factors.expectedWinProb,
			marginFactor: r.factors.marginFactor,
			appliedFactor: r.factors.appliedFactor
		}
	}));
}

export interface CareerMatch {
	/** Beide Gegner-Ratings, so wie sie in der Rangliste stünden. */
	opponents: [number, number];
	partner: number;
	sets: SetScore[];
}

export interface CareerPoint {
	index: number;
	rating: number;
	delta: number;
	won: boolean;
	opponents: [number, number];
	partner: number;
	sets: SetScore[];
	provisional: boolean;
}

/**
 * Spielt eine feste Match-Folge durch das echte Modell und gibt den
 * Rating-Verlauf zurück. Der Spieler startet bei BASE_MU/BASE_SIGMA wie
 * jeder neue Account; jedes Match aktualisiert mu und sigma über
 * computeMatchRatings(), inklusive Serie.
 *
 * Damit ist der gezeigte Verlauf kein gezeichneter Graph, sondern das
 * Ergebnis von n echten Rating-Updates hintereinander.
 */
export function simulateCareer(script: CareerMatch[]): CareerPoint[] {
	let me: PlayerState = {
		playerId: 'me',
		mu: BASE_MU,
		sigma: BASE_SIGMA,
		matchesPlayed: 0,
		currentStreak: 0
	};

	const points: CareerPoint[] = [];

	script.forEach((m, i) => {
		const partnerSigma = sigmaAfterMatches(18);
		const oppSigma = sigmaAfterMatches(20);

		const team1: PlayerState[] = [
			me,
			{
				playerId: 'partner',
				mu: muForDisplay(m.partner, partnerSigma),
				sigma: partnerSigma,
				matchesPlayed: 18,
				currentStreak: 0
			}
		];
		const team2: PlayerState[] = m.opponents.map((o, k) => ({
			playerId: `opp${k}`,
			mu: muForDisplay(o, oppSigma),
			sigma: oppSigma,
			matchesPlayed: 20,
			currentStreak: 0
		}));

		const res = computeMatchRatings({ team1, team2, sets: m.sets });
		const mine = res.find((r) => r.playerId === 'me');
		if (!mine) return;

		points.push({
			index: i + 1,
			rating: mine.ratingAfter,
			delta: Number((mine.ratingAfter - mine.ratingBefore).toFixed(2)),
			won: mine.factors.won,
			opponents: m.opponents,
			partner: m.partner,
			sets: m.sets,
			provisional: mine.factors.provisional
		});

		me = {
			...me,
			mu: mine.muAfter,
			sigma: mine.sigmaAfter,
			matchesPlayed: me.matchesPlayed + 1,
			currentStreak: mine.factors.won
				? Math.max(me.currentStreak, 0) + 1
				: Math.min(me.currentStreak, 0) - 1
		};
	});

	return points;
}

/**
 * Wie viele Tokens bringt diese Saison? Gerechnet mit computeTokenGrants()
 * aus dem Produktivcode — also mit denselben Regeln, die auch nach einem
 * bestätigten Match gutschreiben (Grundwert, Sieg, Meilenstein, Serie).
 */
export function simulateSeasonTokens(script: CareerMatch[]): number {
	let me: PlayerState = {
		playerId: 'me',
		mu: BASE_MU,
		sigma: BASE_SIGMA,
		matchesPlayed: 0,
		currentStreak: 0
	};
	let total = 0;

	for (const m of script) {
		const partnerSigma = sigmaAfterMatches(18);
		const oppSigma = sigmaAfterMatches(20);

		const team1: PlayerState[] = [
			me,
			{
				playerId: 'partner',
				mu: muForDisplay(m.partner, partnerSigma),
				sigma: partnerSigma,
				matchesPlayed: 18,
				currentStreak: 0
			}
		];
		const team2: PlayerState[] = m.opponents.map((o, k) => ({
			playerId: `opp${k}`,
			mu: muForDisplay(o, oppSigma),
			sigma: oppSigma,
			matchesPlayed: 20,
			currentStreak: 0
		}));

		const results = computeMatchRatings({ team1, team2, sets: m.sets });
		const grants = computeTokenGrants(results, [...team1, ...team2], 'manual');
		total += grants.filter((g) => g.playerId === 'me').reduce((sum, g) => sum + g.amount, 0);

		const mine = results.find((r) => r.playerId === 'me');
		if (!mine) continue;
		me = {
			...me,
			mu: mine.muAfter,
			sigma: mine.sigmaAfter,
			matchesPlayed: me.matchesPlayed + 1,
			currentStreak: mine.factors.won
				? Math.max(me.currentStreak, 0) + 1
				: Math.min(me.currentStreak, 0) - 1
		};
	}

	return total;
}

/** Wer hat gewonnen? Gleiche Regel wie im Produktivcode (Sätze, dann Games). */
export function winnerOf(sets: SetScore[]): 1 | 2 {
	let s1 = 0;
	let s2 = 0;
	let g1 = 0;
	let g2 = 0;
	for (const s of sets) {
		g1 += s.team1Games;
		g2 += s.team2Games;
		if (s.team1Games > s.team2Games) s1++;
		else if (s.team2Games > s.team1Games) s2++;
	}
	if (s1 !== s2) return s1 > s2 ? 1 : 2;
	return g1 >= g2 ? 1 : 2;
}
