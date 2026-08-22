// ============================================================
// Gegenprobe: Tabellenlogik gegen die echte Ligatabelle
// ============================================================
//
//   node scripts/run.mjs scripts/verify-bavaro-standings.ts
//
// Rechnet die 18 gespielten Boxen aus data/bavaro-zyklus5.json (nicht im
// Repo, enthält Klarnamen) durch computeBoxStandings() und vergleicht das
// Ergebnis mit den Aggregaten aus der offiziellen PDF-Tabelle
// (match_points, sets, games je Spieler).
//
// Gibt nur Zahlen aus, keine Namen — die Ausgabe darf im Chat landen.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	BOX_AMERICANO_4_DEFAULTS,
	computeBoxStandings,
	type BoxMatchResult
} from '../src/lib/league/box-americano';

type SrcPlayer = {
	name: string;
	group: number | null;
	match_points: [number, number];
	sets: [number, number];
	games: [number, number];
};
type SrcMatch = {
	group: number;
	team1: [string, string];
	team2: [string, string];
	sets: { team1_games: number; team2_games: number }[];
};

const data = JSON.parse(
	readFileSync(resolve(process.cwd(), 'data/bavaro-zyklus5.json'), 'utf8')
) as { players: SrcPlayer[]; matches: SrcMatch[] };

const byGroup = new Map<number, SrcPlayer[]>();
for (const p of data.players) {
	if (p.group === null) continue;
	const list = byGroup.get(p.group) ?? [];
	list.push(p);
	byGroup.set(p.group, list);
}

const matchesByGroup = new Map<number, SrcMatch[]>();
for (const m of data.matches) {
	const list = matchesByGroup.get(m.group) ?? [];
	list.push(m);
	matchesByGroup.set(m.group, list);
}

let checked = 0;
let mismatches = 0;

for (const [group, members] of [...byGroup.entries()].sort((a, b) => a[0] - b[0])) {
	const srcMatches = matchesByGroup.get(group) ?? [];
	if (srcMatches.length === 0) continue; // ungespielte Box

	// Sitze in Listenreihenfolge vergeben; die Rotation steckt in den Daten.
	const seatOf = new Map(members.map((p, i) => [p.name, i + 1]));
	const seats = members.map((_, i) => i + 1);

	const matches: BoxMatchResult[] = srcMatches.map((m, i) => ({
		roundNumber: i + 1,
		team1: m.team1.map((n) => seatOf.get(n)!) as [number, number],
		team2: m.team2.map((n) => seatOf.get(n)!) as [number, number],
		sets: m.sets.map((s) => ({ team1Games: s.team1_games, team2Games: s.team2_games })),
		status: 'played'
	}));

	const standings = computeBoxStandings(seats, matches, BOX_AMERICANO_4_DEFAULTS);

	for (const p of members) {
		const seat = seatOf.get(p.name)!;
		const row = standings.find((r) => r.seat === seat)!;
		const got = {
			mp: row.matchPoints,
			sw: row.setsWon,
			sl: row.setsLost,
			gw: row.gamesWon,
			gl: row.gamesLost
		};
		const want = {
			mp: p.match_points[0],
			sw: p.sets[0],
			sl: p.sets[1],
			gw: p.games[0],
			gl: p.games[1]
		};
		checked++;
		const keys = Object.keys(want) as (keyof typeof want)[];
		const bad = keys.filter((k) => got[k] !== want[k]);
		if (bad.length > 0) {
			mismatches++;
			console.log(
				`  Box ${group}, Sitz ${seat}: abweichend in ${bad.join(',')} — ` +
					`berechnet ${JSON.stringify(got)} vs. Tabelle ${JSON.stringify(want)}`
			);
		}
	}
}

console.log('');
console.log(`Geprüfte Spielerzeilen: ${checked}`);
console.log(`Abweichungen:           ${mismatches}`);
console.log(mismatches === 0 ? '=> Tabellenlogik deckt sich mit der offiziellen Ligatabelle.' : '=> ABWEICHUNGEN.');
