import { describe, expect, it } from 'vitest';
import {
	BOX_AMERICANO_4_DEFAULTS,
	computeBoxStandings,
	cyclePhase,
	groupPromotionsIntoBoxes,
	isBoxComplete,
	proposePromotions,
	roundPairings,
	seedBoxesByRating,
	sortByRatingCloseness,
	winnerOfBoxMatch,
	type BoxMatchResult,
	type BoxOutcome
} from './box-americano';

// Kurzschreibweise: Sätze als [team1, team2]-Paare.
function match(
	roundNumber: number,
	team1: [number, number],
	team2: [number, number],
	sets: [number, number][],
	extra: Partial<BoxMatchResult> = {}
): BoxMatchResult {
	return {
		roundNumber,
		team1,
		team2,
		sets: sets.map(([a, b]) => ({ team1Games: a, team2Games: b })),
		status: 'played',
		...extra
	};
}

/** Die drei Runden einer 4er-Box, so wie roundPairings() sie vorgibt. */
function fullBox(results: [number, number][][]): BoxMatchResult[] {
	return roundPairings(4).map((p, i) => match(p.roundNumber, p.team1, p.team2, results[i]));
}

describe('roundPairings', () => {
	it('lässt jeden mit jedem genau einmal zusammenspielen', () => {
		const pairs = roundPairings(4).flatMap((r) => [r.team1, r.team2]);
		const keys = pairs.map((p) => [...p].sort((a, b) => a - b).join('+'));
		expect(new Set(keys).size).toBe(6);
	});

	it('lässt jeden gegen jeden gleich oft spielen (zweimal)', () => {
		// Anders als "einmal Partner" ist "einmal Gegner" in einer 4er-Box
		// gar nicht möglich: 3 Runden x 4 Gegnerpaare = 12 Begegnungen auf
		// 6 Paare. Jedes Paar trifft also zwangsläufig zweimal aufeinander.
		// Entscheidend ist, dass es für alle gleich oft ist.
		const opponentCount = new Map<string, number>();
		for (const r of roundPairings(4)) {
			for (const a of r.team1) {
				for (const b of r.team2) {
					const key = [a, b].sort((x, y) => x - y).join('vs');
					opponentCount.set(key, (opponentCount.get(key) ?? 0) + 1);
				}
			}
		}
		expect(opponentCount.size).toBe(6);
		expect([...opponentCount.values()].every((n) => n === 2)).toBe(true);
	});

	it('setzt jeden Sitz in jeder Runde genau einmal ein', () => {
		for (const r of roundPairings(4)) {
			expect([...r.team1, ...r.team2].sort()).toEqual([1, 2, 3, 4]);
		}
	});

	it('weist andere Boxgrößen ab, statt eine falsche Rotation zu erfinden', () => {
		expect(() => roundPairings(6)).toThrow(/nur für 4er-Boxen/);
	});
});

describe('winnerOfBoxMatch', () => {
	it('entscheidet nach gewonnenen Sätzen', () => {
		expect(
			winnerOfBoxMatch(
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[6, 1],
						[6, 2]
					]
				)
			)
		).toBe(1);
		expect(
			winnerOfBoxMatch(
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[1, 6],
						[2, 6]
					]
				)
			)
		).toBe(2);
	});

	it('entscheidet bei Satzgleichstand über die Games', () => {
		// Echter Fall aus Zyklus 5: 7:5, 0:3 -> Sätze 1:1, Games 7:8.
		// Die offizielle Ligatabelle schreibt den Sieg Team 2 gut.
		expect(
			winnerOfBoxMatch(
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[7, 5],
						[0, 3]
					],
					{ status: 'abandoned' }
				)
			)
		).toBe(2);
	});

	it('lässt nur bei Gleichstand in Sätzen UND Games offen', () => {
		expect(
			winnerOfBoxMatch(
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[6, 3],
						[3, 6]
					]
				)
			)
		).toBeNull();
	});

	it('nimmt einen explizit gesetzten Sieger, auch ohne Sätze', () => {
		const wo = match(1, [1, 2], [3, 4], [], { status: 'walkover', winnerTeam: 2 });
		expect(winnerOfBoxMatch(wo)).toBe(2);
	});

	it('lässt den expliziten Sieger die Sätze überstimmen', () => {
		const m = match(
			1,
			[1, 2],
			[3, 4],
			[
				[6, 0],
				[6, 0]
			],
			{ status: 'abandoned', winnerTeam: 2 }
		);
		expect(winnerOfBoxMatch(m)).toBe(2);
	});
});

describe('computeBoxStandings', () => {
	it('gibt Partnern innerhalb einer Runde identische Werte', () => {
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			[
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[6, 1],
						[6, 2]
					]
				)
			]
		);
		const a = s.find((r) => r.seat === 1)!;
		const b = s.find((r) => r.seat === 2)!;
		expect({ ...a, seat: 0, rank: 0 }).toEqual({ ...b, seat: 0, rank: 0 });
	});

	it('zählt einen Punkt pro Sieg (Bávaro-Zählweise)', () => {
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			fullBox([
				[
					[6, 1],
					[6, 2]
				], // 1+2 schlagen 3+4
				[
					[6, 2],
					[6, 4]
				], // 1+3 schlagen 2+4
				[
					[4, 6],
					[6, 7]
				] // 2+3 schlagen 1+4
			])
		);
		const byseat = Object.fromEntries(s.map((r) => [r.seat, r.matchPoints]));
		expect(byseat).toEqual({ 1: 2, 2: 2, 3: 2, 4: 0 });
		// Jeder spielt genau 3 Partien
		expect(s.every((r) => r.played === 3)).toBe(true);
		// Siege und Niederlagen summieren sich über die Box auf
		expect(s.reduce((n, r) => n + r.matchesWon, 0)).toBe(6);
		expect(s.reduce((n, r) => n + r.matchesLost, 0)).toBe(6);
	});

	it('unterstützt eine 2:0-Zählweise über die Konfiguration', () => {
		const cfg = { ...BOX_AMERICANO_4_DEFAULTS, pointsPerWin: 2 };
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			[
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[6, 1],
						[6, 2]
					]
				)
			],
			cfg
		);
		expect(s.find((r) => r.seat === 1)!.matchPoints).toBe(2);
		expect(s.find((r) => r.seat === 3)!.matchPoints).toBe(0);
	});

	it('sortiert nach Matchpunkten, dann Sätzen, dann Spielen', () => {
		// Alle drei Sieger haben 2 Punkte und 4:2 Sätze -> Games entscheiden
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			fullBox([
				[
					[6, 1],
					[6, 2]
				],
				[
					[6, 2],
					[6, 4]
				],
				[
					[4, 6],
					[6, 7]
				]
			])
		);
		const diffs = s.map((r) => r.gamesWon - r.gamesLost);
		expect(diffs).toEqual([...diffs].sort((a, b) => b - a));
		expect(s[3].seat).toBe(4); // der punktlose Spieler steht hinten
	});

	it('wertet einen Abbruch wie die offizielle Tabelle über die Games', () => {
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			[
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[7, 5],
						[0, 3]
					],
					{ status: 'abandoned' }
				)
			]
		);
		const t1 = s.find((r) => r.seat === 1)!;
		const t3 = s.find((r) => r.seat === 3)!;
		expect(t1.matchPoints).toBe(0);
		expect(t3.matchPoints).toBe(1);
		expect([t1.setsWon, t1.setsLost]).toEqual([1, 1]);
		expect([t1.gamesWon, t1.gamesLost]).toEqual([7, 8]);
	});

	it('lässt eine in Sätzen und Games gleiche Partie für beide offen', () => {
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			[
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[6, 3],
						[3, 6]
					]
				)
			]
		);
		expect(s.every((r) => r.matchPoints === 0)).toBe(true);
		expect(s.every((r) => r.matchesUndecided === 1)).toBe(true);
	});

	it('ignoriert geplante und abgesagte Partien', () => {
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			[
				match(1, [1, 2], [3, 4], [], { status: 'scheduled' }),
				match(
					2,
					[1, 3],
					[2, 4],
					[
						[6, 0],
						[6, 0]
					],
					{ status: 'cancelled' }
				)
			]
		);
		expect(s.every((r) => r.played === 0)).toBe(true);
	});

	it('vergibt bei völligem Gleichstand geteilte Ränge', () => {
		// Beide Teams gewinnen je einmal mit identischen Zahlen
		const s = computeBoxStandings(
			[1, 2, 3, 4],
			[
				match(
					1,
					[1, 2],
					[3, 4],
					[
						[6, 3],
						[6, 3]
					]
				),
				match(
					2,
					[3, 4],
					[1, 2],
					[
						[6, 3],
						[6, 3]
					]
				)
			]
		);
		expect(s.map((r) => r.rank)).toEqual([1, 1, 1, 1]);
	});

	it('lässt eine Box ohne Ergebnisse leer statt zu rechnen', () => {
		const s = computeBoxStandings([1, 2, 3, 4], []);
		expect(s).toHaveLength(4);
		expect(s.every((r) => r.played === 0 && r.matchPoints === 0)).toBe(true);
	});
});

describe('isBoxComplete', () => {
	it('erkennt eine vollständig gespielte Box', () => {
		expect(isBoxComplete(fullBox([[[6, 1]], [[6, 2]], [[6, 3]]]))).toBe(true);
	});

	it('erkennt eine Box, in der noch nicht gespielt wurde', () => {
		// 3 von 21 Boxen im echten Zyklus 5
		expect(isBoxComplete([])).toBe(false);
	});

	it('zählt einen Abbruch als gespielte Runde', () => {
		const ms = fullBox([
			[[6, 1]],
			[[6, 2]],
			[
				[7, 5],
				[0, 3]
			]
		]);
		ms[2].status = 'abandoned';
		expect(isBoxComplete(ms)).toBe(true);
	});
});

describe('proposePromotions', () => {
	const box = (id: string, pos: number, order: string[], complete = true): BoxOutcome => ({
		boxId: id,
		ladderPosition: pos,
		standings: order.map((playerId, i) => ({ playerId, rank: i + 1 })),
		complete
	});

	const ladder = [
		box('b1', 1, ['a1', 'a2', 'a3', 'a4']),
		box('b2', 2, ['b1p', 'b2p', 'b3p', 'b4p']),
		box('b3', 3, ['c1', 'c2', 'c3', 'c4'])
	];

	it('lässt aus der obersten Box niemanden aufsteigen, dafür zwei absteigen', () => {
		const p = proposePromotions(ladder);
		const top = p.filter((x) => x.fromBoxId === 'b1');
		expect(top.filter((x) => x.direction === 'up')).toHaveLength(0);
		expect(top.filter((x) => x.direction === 'down').map((x) => x.playerId)).toEqual(['a3', 'a4']);
	});

	it('lässt aus der untersten Box niemanden absteigen, dafür zwei aufsteigen', () => {
		const p = proposePromotions(ladder);
		const bottom = p.filter((x) => x.fromBoxId === 'b3');
		expect(bottom.filter((x) => x.direction === 'down')).toHaveLength(0);
		expect(bottom.filter((x) => x.direction === 'up').map((x) => x.playerId)).toEqual(['c1', 'c2']);
	});

	it('bewegt in einer mittleren Box genau den Ersten hoch und den Letzten runter', () => {
		const p = proposePromotions(ladder).filter((x) => x.fromBoxId === 'b2');
		expect(p.find((x) => x.playerId === 'b1p')).toMatchObject({
			direction: 'up',
			toLadderPosition: 1
		});
		expect(p.find((x) => x.playerId === 'b4p')).toMatchObject({
			direction: 'down',
			toLadderPosition: 3
		});
		expect(p.filter((x) => x.direction === 'stay').map((x) => x.playerId)).toEqual(['b2p', 'b3p']);
	});

	it('deckt jeden Spieler genau einmal ab', () => {
		const p = proposePromotions(ladder);
		expect(p).toHaveLength(12);
		expect(new Set(p.map((x) => x.playerId)).size).toBe(12);
	});

	it('friert eine unvollständige Box ein und warnt, statt zu raten', () => {
		const withGap = [ladder[0], box('b2', 2, ['b1p', 'b2p', 'b3p', 'b4p'], false), ladder[2]];
		const p = proposePromotions(withGap).filter((x) => x.fromBoxId === 'b2');
		expect(p.every((x) => x.direction === 'stay')).toBe(true);
		expect(p.every((x) => x.warning?.includes('nicht alle Runden'))).toBe(true);
	});

	it('warnt bei Punktgleichheit genau an der Aufstiegsgrenze', () => {
		const tied: BoxOutcome = {
			boxId: 'b2',
			ladderPosition: 2,
			standings: [
				{ playerId: 'x1', rank: 1 },
				{ playerId: 'x2', rank: 1 },
				{ playerId: 'x3', rank: 3 },
				{ playerId: 'x4', rank: 4 }
			],
			complete: true
		};
		const p = proposePromotions([ladder[0], tied, ladder[2]]);
		expect(p.find((x) => x.playerId === 'x1')?.warning).toMatch(/Punktgleich/);
		// Nicht betroffene Plätze bekommen keine Warnung
		expect(p.find((x) => x.playerId === 'x3')?.warning).toBeUndefined();
	});

	it('respektiert eine abweichende Konfiguration der Auf-/Absteigerzahl', () => {
		const cfg = { ...BOX_AMERICANO_4_DEFAULTS, promote: 2, relegate: 2 };
		const p = proposePromotions(ladder, cfg).filter((x) => x.fromBoxId === 'b2');
		expect(p.filter((x) => x.direction === 'up')).toHaveLength(2);
		expect(p.filter((x) => x.direction === 'down')).toHaveLength(2);
	});

	it('behandelt eine Leiter aus einer einzigen Box als oben und unten zugleich', () => {
		const p = proposePromotions([box('only', 1, ['s1', 's2', 's3', 's4'])]);
		expect(p.every((x) => x.direction === 'stay')).toBe(true);
	});

	it('bleibt bei leerer Eingabe leer', () => {
		expect(proposePromotions([])).toEqual([]);
	});
});

describe('cyclePhase', () => {
	it('ist self_service innerhalb der ersten selfServiceWeeks Wochen', () => {
		const today = new Date('2026-01-15T12:00:00Z');
		expect(cyclePhase('2026-01-01', 3, today)).toBe('self_service');
	});

	it('wechselt am Tag der Grenze auf admin_assignment', () => {
		const cutoff = new Date('2026-01-22T00:00:00Z'); // 2026-01-01 + 3 Wochen
		expect(cyclePhase('2026-01-01', 3, cutoff)).toBe('admin_assignment');
	});

	it('bleibt kurz vor der Grenze bei self_service', () => {
		const justBefore = new Date('2026-01-21T23:59:59Z');
		expect(cyclePhase('2026-01-01', 3, justBefore)).toBe('self_service');
	});
});

describe('seedBoxesByRating', () => {
	function cand(id: string, rating: number) {
		return { playerId: id, rating };
	}

	it('teilt eine glatt aufgehende Spielerzahl in gleich große Boxen, stärkste zuerst', () => {
		const players = [
			cand('a', 5),
			cand('b', 4),
			cand('c', 6),
			cand('d', 3),
			cand('e', 2),
			cand('f', 1),
			cand('g', 3.5),
			cand('h', 4.5)
		];
		const boxes = seedBoxesByRating(players, 4);
		expect(boxes).toHaveLength(2);
		expect(boxes[0].map((s) => s.playerId)).toEqual(['c', 'a', 'h', 'b']);
		expect(boxes[1].map((s) => s.playerId)).toEqual(['g', 'd', 'e', 'f']);
		expect(boxes.flat().every((s) => s.role === 'regular')).toBe(true);
		expect(boxes[0].map((s) => s.seat)).toEqual([1, 2, 3, 4]);
	});

	it('hängt einen Rest an die vorletzte Box statt eine Rumpf-Box zu eröffnen', () => {
		const players = Array.from({ length: 9 }, (_, i) => cand(`p${i}`, 9 - i));
		const boxes = seedBoxesByRating(players, 4);
		expect(boxes).toHaveLength(2);
		expect(boxes[0]).toHaveLength(4);
		expect(boxes[1]).toHaveLength(5);
		expect(boxes[1].map((s) => s.role)).toEqual([
			'regular',
			'regular',
			'regular',
			'regular',
			'substitute'
		]);
		expect(boxes[1][4].seat).toBe(5);
	});

	it('lässt eine einzelne, zu kleine Box unangetastet', () => {
		const players = [cand('a', 5), cand('b', 3)];
		const boxes = seedBoxesByRating(players, 4);
		expect(boxes).toHaveLength(1);
		expect(boxes[0].every((s) => s.role === 'regular')).toBe(true);
	});

	it('bleibt bei leerer Eingabe leer', () => {
		expect(seedBoxesByRating([], 4)).toEqual([]);
	});
});

describe('groupPromotionsIntoBoxes', () => {
	function standing(id: string, rating: number, to: number) {
		return { playerId: id, rating, toLadderPosition: to };
	}

	it('gruppiert nach Ziel-Leiterposition, aufsteigend sortiert', () => {
		const rows = [
			standing('a', 5, 2),
			standing('b', 4, 1),
			standing('c', 6, 1),
			standing('d', 3, 2)
		];
		const boxes = groupPromotionsIntoBoxes(rows, 4);
		expect(boxes.map((b) => b.ladderPosition)).toEqual([1, 2]);
		expect(boxes[0].members.map((m) => m.playerId)).toEqual(['c', 'b']);
	});

	it('markiert Sitze über boxSize als Ersatz, wenn eine Box zu groß wird', () => {
		const rows = [1, 2, 3, 4, 5].map((n) => standing(`p${n}`, 10 - n, 1));
		const boxes = groupPromotionsIntoBoxes(rows, 4);
		expect(boxes[0].members).toHaveLength(5);
		expect(boxes[0].members.map((m) => m.role)).toEqual([
			'regular',
			'regular',
			'regular',
			'regular',
			'substitute'
		]);
	});

	it('lässt eine unterbesetzte Box einfach kleiner', () => {
		const rows = [standing('a', 5, 3), standing('b', 4, 3)];
		const boxes = groupPromotionsIntoBoxes(rows, 4);
		expect(boxes[0].members).toHaveLength(2);
		expect(boxes[0].members.every((m) => m.role === 'regular')).toBe(true);
	});
});

describe('sortByRatingCloseness', () => {
	it('sortiert nach Abstand zur Zielspielstärke, nächster zuerst', () => {
		const items = [
			{ id: 'a', rating: 5.0 },
			{ id: 'b', rating: 3.2 },
			{ id: 'c', rating: 3.6 }
		];
		expect(sortByRatingCloseness(items, 3.5).map((x) => x.id)).toEqual(['c', 'b', 'a']);
	});

	it('verändert das Original-Array nicht', () => {
		const items = [
			{ id: 'a', rating: 1 },
			{ id: 'b', rating: 2 }
		];
		const copy = [...items];
		sortByRatingCloseness(items, 5);
		expect(items).toEqual(copy);
	});
});
