// ============================================================
// PadelIndex — Format "box_americano_4": Rotation, Tabelle, Auf-/Abstieg
// ============================================================
// Reine Funktionen ohne DB-Zugriff, damit sie sich wie rating-core.ts
// direkt testen lassen. Alles, was hier drinsteht, gilt NUR für dieses
// eine Format — ein weiteres Liga-Format bekommt ein eigenes Modul
// daneben und teilt sich mit diesem nur die Tabellen aus
// 0016_league_module.sql.
//
// Ausdrücklich NICHT hier drin: das allgemeine Index-Rating. Die
// Liga-Tabelle (Matchpunkte -> Sätze -> Spiele, box-intern) und das
// OpenSkill-Rating sind zwei getrennte Systeme. Ein Liga-Match fließt
// über die normale matches-Zeile zusätzlich ins Index-Rating ein, aber
// keine der beiden Rechnungen kennt die andere.

/** Reihenfolge der Tiebreaker, konfigurierbar je Liga. */
export type Tiebreaker = 'match_points' | 'set_diff' | 'sets_won' | 'game_diff' | 'games_won';

export interface BoxLeagueConfig {
	boxSize: number;
	rounds: number;
	/** Bávaro zählt 1 Punkt pro Sieg (aus den echten Daten abgeleitet). */
	pointsPerWin: number;
	promote: number;
	relegate: number;
	/** Oberste Box: kein Aufstieg möglich, dafür mehr Absteiger. */
	relegateTopBox: number;
	/** Unterste Box: kein Abstieg möglich, dafür mehr Aufsteiger. */
	promoteBottomBox: number;
	tiebreakers: Tiebreaker[];
	/**
	 * Bávaro-Regelwerk: die ersten N Wochen eines Zyklus vereinbaren die
	 * Spieler ihre Termine selbst, danach vergibt der Admin die
	 * restlichen offenen Runden. Siehe cyclePhase().
	 */
	selfServiceWeeks: number;
}

export const BOX_AMERICANO_4_DEFAULTS: BoxLeagueConfig = {
	boxSize: 4,
	rounds: 3,
	pointsPerWin: 1,
	promote: 1,
	relegate: 1,
	relegateTopBox: 2,
	promoteBottomBox: 2,
	tiebreakers: ['match_points', 'set_diff', 'game_diff'],
	selfServiceWeeks: 3
};

// ------------------------------------------------------------
// Zyklus-Phase (Termin- & Platzverwaltung)
// ------------------------------------------------------------

export type CyclePhase = 'self_service' | 'admin_assignment';

/**
 * Woche 1-3 (Default, konfigurierbar): Spieler vereinbaren Termine
 * eigenständig. Ab Woche selfServiceWeeks+1: der Admin vergibt die
 * restlichen offenen Runden. Reine Datumsrechnung, kein Datenbankzugriff
 * — der Zyklus kennt sein eigenes Startdatum bereits (league_cycles).
 */
export function cyclePhase(
	cycleStartDate: string,
	selfServiceWeeks: number,
	today: Date = new Date()
): CyclePhase {
	const cutoff = new Date(cycleStartDate);
	cutoff.setUTCDate(cutoff.getUTCDate() + selfServiceWeeks * 7);
	return today.getTime() >= cutoff.getTime() ? 'admin_assignment' : 'self_service';
}

// ------------------------------------------------------------
// Ersatzspieler-Vorschlag (Warteliste)
// ------------------------------------------------------------

/**
 * Sortiert eine Liste (typischerweise die Warteliste) nach Nähe zu einer
 * Ziel-Spielstärke — der "automatische Modus" der Ersatzauswahl schlägt
 * so den Spieler vor, dessen Rating dem der ausfallenden Person am
 * nächsten kommt. Der manuelle Modus ist einfach dieselbe Liste ohne
 * diese Sortierung. Generisch statt an WaitlistEntry gebunden, damit
 * sowohl die Server-Seite (league-admin.ts) als auch die Svelte-UI
 * (client-seitiges Neusortieren beim Auswählen) dieselbe Funktion nutzen
 * können, ohne server-only Code ins Client-Bundle zu ziehen.
 */
export function sortByRatingCloseness<T extends { rating: number }>(
	items: T[],
	targetRating: number
): T[] {
	return [...items].sort(
		(a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating)
	);
}

// ------------------------------------------------------------
// Rotation
// ------------------------------------------------------------

export interface RoundPairing {
	roundNumber: number;
	team1: [number, number];
	team2: [number, number];
}

/**
 * Partnerrotation einer Box: jeder spielt mit jedem anderen genau einmal
 * zusammen und einmal gegen ihn. Für vier Sitze gibt es dafür genau eine
 * Lösung (drei Runden).
 *
 * Bewusst nur für boxSize 4 implementiert statt mit einer scheinbar
 * allgemeinen Formel: "jeder mit jedem genau einmal Partner" ist nicht
 * für jede Boxgröße überhaupt lösbar. Ein Format mit anderer Boxgröße
 * bringt seine eigene Rotation mit.
 */
export function roundPairings(boxSize = 4): RoundPairing[] {
	if (boxSize !== 4) {
		throw new Error(
			`Rotation ist nur für 4er-Boxen definiert (angefragt: ${boxSize}). ` +
				'Andere Boxgrößen brauchen ein eigenes Format-Modul.'
		);
	}
	return [
		{ roundNumber: 1, team1: [1, 2], team2: [3, 4] },
		{ roundNumber: 2, team1: [1, 3], team2: [2, 4] },
		{ roundNumber: 3, team1: [1, 4], team2: [2, 3] }
	];
}

// ------------------------------------------------------------
// Tabelle
// ------------------------------------------------------------

export interface SetScore {
	team1Games: number;
	team2Games: number;
}

/** Status wie in league_box_matches.status. */
export type BoxMatchStatus = 'scheduled' | 'played' | 'abandoned' | 'walkover' | 'cancelled';

export interface BoxMatchResult {
	roundNumber: number;
	team1: [number, number];
	team2: [number, number];
	sets: SetScore[];
	status: BoxMatchStatus;
	/** Nur nötig, wenn sich aus den Sätzen kein Sieger ergibt. */
	winnerTeam?: 1 | 2 | null;
}

export interface BoxStanding {
	seat: number;
	rank: number;
	matchPoints: number;
	matchesWon: number;
	matchesLost: number;
	/** Gewertete Partien ohne Sieger (Abbruch bei Satzgleichstand). */
	matchesUndecided: number;
	setsWon: number;
	setsLost: number;
	gamesWon: number;
	gamesLost: number;
	played: number;
}

/**
 * Wer hat gewonnen? Ein explizit gesetzter Sieger gewinnt immer — den
 * trägt ein Admin ein, wenn es gar nichts abzuleiten gibt (kampfloser
 * Sieg ohne gespielte Sätze).
 *
 * Sonst entscheiden die Sätze und bei Satzgleichstand die Games. Diese
 * Reihenfolge ist nicht gewählt, sondern an den echten Daten geprüft:
 * im Zyklus 5 wurde eine Partie beim Stand 7:5, 0:3 abgebrochen (Sätze
 * 1:1) und in der offiziellen Ligatabelle dem Team mit 8:7 Games als
 * Sieg gutgeschrieben. Es ist außerdem dieselbe Regel, die winnerOf()
 * im Rating-Kern anwendet — Ligatabelle und Index-Rating kommen damit
 * beim selben Match nie zu unterschiedlichen Siegern.
 *
 * Nur wenn auch die Games gleich stehen, gibt es keinen Sieger.
 */
export function winnerOfBoxMatch(m: BoxMatchResult): 1 | 2 | null {
	if (m.winnerTeam === 1 || m.winnerTeam === 2) return m.winnerTeam;
	let s1 = 0;
	let s2 = 0;
	let g1 = 0;
	let g2 = 0;
	for (const s of m.sets) {
		g1 += s.team1Games;
		g2 += s.team2Games;
		if (s.team1Games > s.team2Games) s1++;
		else if (s.team2Games > s.team1Games) s2++;
	}
	if (s1 !== s2) return s1 > s2 ? 1 : 2;
	if (g1 !== g2) return g1 > g2 ? 1 : 2;
	return null;
}

/** Zählt eine Partie überhaupt für die Tabelle? */
export function countsForStandings(status: BoxMatchStatus): boolean {
	return status === 'played' || status === 'abandoned' || status === 'walkover';
}

function compareBy(a: BoxStanding, b: BoxStanding, key: Tiebreaker): number {
	switch (key) {
		case 'match_points':
			return b.matchPoints - a.matchPoints;
		case 'sets_won':
			return b.setsWon - a.setsWon;
		case 'set_diff':
			return b.setsWon - b.setsLost - (a.setsWon - a.setsLost);
		case 'games_won':
			return b.gamesWon - a.gamesWon;
		case 'game_diff':
			return b.gamesWon - b.gamesLost - (a.gamesWon - a.gamesLost);
	}
}

/**
 * Box-interne Tabelle. Standings werden NIE zwischen Boxen verglichen —
 * die Funktion bekommt deshalb bewusst nur die Partien einer einzigen
 * Box und kennt gar keine anderen.
 *
 * Bleiben zwei Spieler nach allen Tiebreakern gleich, teilen sie sich
 * den Rang (1,2,2,4), statt willkürlich sortiert zu werden. Der
 * Auf-/Abstiegsvorschlag muss das dann als offen kennzeichnen.
 */
export function computeBoxStandings(
	seats: number[],
	matches: BoxMatchResult[],
	config: BoxLeagueConfig = BOX_AMERICANO_4_DEFAULTS
): BoxStanding[] {
	const table = new Map<number, BoxStanding>();
	for (const seat of seats) {
		table.set(seat, {
			seat,
			rank: 0,
			matchPoints: 0,
			matchesWon: 0,
			matchesLost: 0,
			matchesUndecided: 0,
			setsWon: 0,
			setsLost: 0,
			gamesWon: 0,
			gamesLost: 0,
			played: 0
		});
	}

	for (const m of matches) {
		if (!countsForStandings(m.status)) continue;
		const winner = winnerOfBoxMatch(m);

		let s1 = 0;
		let s2 = 0;
		let g1 = 0;
		let g2 = 0;
		for (const s of m.sets) {
			g1 += s.team1Games;
			g2 += s.team2Games;
			if (s.team1Games > s.team2Games) s1++;
			else if (s.team2Games > s.team1Games) s2++;
		}

		// Partner teilen sich innerhalb einer Runde identische Werte.
		const apply = (seat: number, team: 1 | 2) => {
			const row = table.get(seat);
			if (!row) return; // Sitz gehört nicht zu dieser Box -> ignorieren
			row.played += 1;
			row.setsWon += team === 1 ? s1 : s2;
			row.setsLost += team === 1 ? s2 : s1;
			row.gamesWon += team === 1 ? g1 : g2;
			row.gamesLost += team === 1 ? g2 : g1;
			if (winner === null) {
				row.matchesUndecided += 1;
			} else if (winner === team) {
				row.matchesWon += 1;
				row.matchPoints += config.pointsPerWin;
			} else {
				row.matchesLost += 1;
			}
		};

		for (const seat of m.team1) apply(seat, 1);
		for (const seat of m.team2) apply(seat, 2);
	}

	const rows = [...table.values()].sort((a, b) => {
		for (const key of config.tiebreakers) {
			const d = compareBy(a, b, key);
			if (d !== 0) return d;
		}
		return a.seat - b.seat; // stabile Ausgabe, kein Rangunterschied
	});

	// Gleichstand nach allen Tiebreakern -> geteilter Rang
	let lastRank = 0;
	rows.forEach((row, i) => {
		const prev = rows[i - 1];
		const tied =
			prev !== undefined && config.tiebreakers.every((k) => compareBy(prev, row, k) === 0);
		row.rank = tied ? lastRank : i + 1;
		lastRank = row.rank;
	});

	return rows;
}

/** Sind alle Runden dieser Box gewertet? */
export function isBoxComplete(
	matches: BoxMatchResult[],
	config: BoxLeagueConfig = BOX_AMERICANO_4_DEFAULTS
): boolean {
	const counted = matches.filter((m) => countsForStandings(m.status));
	const rounds = new Set(counted.map((m) => m.roundNumber));
	return rounds.size >= config.rounds;
}

// ------------------------------------------------------------
// Auf- und Abstieg
// ------------------------------------------------------------

export interface BoxOutcome {
	boxId: string;
	ladderPosition: number;
	/** Reihenfolge egal — wird nach rank sortiert. */
	standings: { playerId: string; rank: number }[];
	complete: boolean;
}

export type PromotionDirection = 'up' | 'down' | 'stay';

export interface PromotionProposal {
	playerId: string;
	fromBoxId: string;
	fromLadderPosition: number;
	fromRank: number;
	toLadderPosition: number;
	direction: PromotionDirection;
	/** Gesetzt, wenn der Vorschlag menschliche Prüfung braucht. */
	warning?: string;
}

/**
 * Rechnet den Auf-/Abstieg für einen abgeschlossenen Zyklus aus. Ergebnis
 * ist ausdrücklich ein VORSCHLAG: nichts hiervon wird angewendet, bevor
 * ein Admin ihn bestätigt (league_promotions.status).
 *
 * Zwei Fälle bekommen eine Warnung statt einer stillen Annahme:
 *   * Box unvollständig (in den echten Daten hatten 3 von 21 Boxen eines
 *     Zyklus gar nicht gespielt) -> niemand bewegt sich, Admin entscheidet.
 *   * Geteilter Rang genau an der Auf-/Abstiegsgrenze -> die Tabelle gibt
 *     die Reihenfolge nicht her, das muss ein Mensch klären.
 */
export function proposePromotions(
	boxes: BoxOutcome[],
	config: BoxLeagueConfig = BOX_AMERICANO_4_DEFAULTS
): PromotionProposal[] {
	if (boxes.length === 0) return [];

	const ordered = [...boxes].sort((a, b) => a.ladderPosition - b.ladderPosition);
	const topPosition = ordered[0].ladderPosition;
	const bottomPosition = ordered[ordered.length - 1].ladderPosition;

	const proposals: PromotionProposal[] = [];

	for (const box of ordered) {
		const isTop = box.ladderPosition === topPosition;
		const isBottom = box.ladderPosition === bottomPosition;

		const upCount = isTop ? 0 : isBottom ? config.promoteBottomBox : config.promote;
		const downCount = isBottom ? 0 : isTop ? config.relegateTopBox : config.relegate;

		const rows = [...box.standings].sort((a, b) => a.rank - b.rank);

		// Ein geteilter Rang ist nur dann ein Problem, wenn er die Grenze
		// kreuzt — innerhalb der Mittelfeldplätze bewegt sich ohnehin niemand.
		const boundaryTied = (index: number): boolean => {
			const here = rows[index];
			const next = rows[index + 1];
			return here !== undefined && next !== undefined && here.rank === next.rank;
		};

		rows.forEach((row, i) => {
			const fromBottom = rows.length - 1 - i;
			let direction: PromotionDirection = 'stay';
			let to = box.ladderPosition;

			if (i < upCount) {
				direction = 'up';
				to = box.ladderPosition - 1;
			} else if (fromBottom < downCount) {
				direction = 'down';
				to = box.ladderPosition + 1;
			}

			let warning: string | undefined;
			if (!box.complete) {
				direction = 'stay';
				to = box.ladderPosition;
				warning = 'Box hat nicht alle Runden gespielt — kein automatischer Auf-/Abstieg.';
			} else if (
				(i === upCount - 1 && boundaryTied(i)) ||
				(fromBottom === downCount && boundaryTied(i))
			) {
				warning = 'Punktgleich an der Auf-/Abstiegsgrenze — Reihenfolge muss entschieden werden.';
			}

			proposals.push({
				playerId: row.playerId,
				fromBoxId: box.boxId,
				fromLadderPosition: box.ladderPosition,
				fromRank: row.rank,
				toLadderPosition: to,
				direction,
				...(warning ? { warning } : {})
			});
		});
	}

	return proposals;
}

// ------------------------------------------------------------
// Boxen-Einteilung: neue Saison seeden, nächsten Zyklus aus Auf-/Abstieg bauen
// ------------------------------------------------------------

export interface SeedCandidate {
	playerId: string;
	rating: number;
}

export interface SeedSeat {
	playerId: string;
	seat: number;
	role: 'regular' | 'substitute';
}

/**
 * Nummeriert eine nach Stärke sortierte Gruppe zu Sitzen durch: die
 * ersten boxSize bekommen reguläre Sitze, alles darüber hinaus (eine zu
 * groß geratene Box, siehe groupPromotionsIntoBoxes) role='substitute'
 * mit fortlaufender Sitznummer — die Rotation kennt ohnehin nur die
 * ersten boxSize Sitze, ein Admin muss so eine Box vor dem Spielbeginn
 * per Drag & Drop ausgleichen.
 */
function assignSeats(group: SeedCandidate[], boxSize: number): SeedSeat[] {
	return group.map((c, i) => ({
		playerId: c.playerId,
		seat: i + 1,
		role: i < boxSize ? 'regular' : 'substitute'
	}));
}

/**
 * Vorschlag für die Boxen einer neuen Saison (Zyklus 1): nach Rating
 * absteigend sortiert, in Gruppen von boxSize eingeteilt — Box 1 die
 * stärksten, die letzte Box die schwächsten. Geht die Spielerzahl nicht
 * glatt durch boxSize auf, bekommt die VORLETZTE Box die übrig
 * gebliebenen Personen zusätzlich als Ersatz statt eine eigene
 * Rumpf-Box mit zu wenigen Spielern zu eröffnen, die mit sich selbst
 * keine Runde spielen könnte. Reiner Vorschlag — der Admin korrigiert
 * das Ergebnis vor dem Start per Drag & Drop.
 */
export function seedBoxesByRating(candidates: SeedCandidate[], boxSize: number): SeedSeat[][] {
	const sorted = [...candidates].sort((a, b) => b.rating - a.rating);
	const groups: SeedCandidate[][] = [];
	for (let i = 0; i < sorted.length; i += boxSize) {
		groups.push(sorted.slice(i, i + boxSize));
	}

	if (groups.length > 1 && groups[groups.length - 1].length < boxSize) {
		const leftover = groups.pop()!;
		groups[groups.length - 1].push(...leftover);
	}

	return groups.map((g) => assignSeats(g, boxSize));
}

export interface FinalStanding {
	playerId: string;
	rating: number;
	toLadderPosition: number;
}

export interface GroupedBox {
	ladderPosition: number;
	members: SeedSeat[];
}

/**
 * Baut die Boxen des Folgezyklus aus dem bestätigten Auf-/Abstieg: alle
 * Spieler nach ihrer jeweiligen Ziel-Leiterposition gruppiert (siehe
 * proposePromotions — toLadderPosition gilt für JEDE Zeile, auch
 * "bleibt"). Kann bewusst Boxen mit weniger oder mehr als boxSize
 * Mitgliedern liefern — bei einer obersten/untersten Box mit
 * abweichender Auf-/Abstiegszahl (relegateTopBox/promoteBottomBox)
 * balanciert sich die Spielerzahl zwischen Nachbarboxen nicht von
 * selbst aus (siehe league-admin.ts). Das zeigt diese Funktion
 * ungefiltert an, damit der Admin es vor der Veröffentlichung per
 * Drag & Drop ausgleichen kann — sie korrigiert nichts automatisch.
 */
export function groupPromotionsIntoBoxes(
	standings: FinalStanding[],
	boxSize: number
): GroupedBox[] {
	const byPosition = new Map<number, FinalStanding[]>();
	for (const s of standings) {
		const list = byPosition.get(s.toLadderPosition) ?? [];
		list.push(s);
		byPosition.set(s.toLadderPosition, list);
	}

	return [...byPosition.entries()]
		.sort(([a], [b]) => a - b)
		.map(([ladderPosition, members]) => ({
			ladderPosition,
			members: assignSeats(
				[...members].sort((a, b) => b.rating - a.rating),
				boxSize
			)
		}));
}
