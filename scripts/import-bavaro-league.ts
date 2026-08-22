// ============================================================
// PadelIndex — Liga-Modul: Startaufstellung aus Zyklus 5 übernehmen
// ============================================================
//
//   node scripts/run.mjs scripts/import-bavaro-league.ts
//
// Liest dieselbe data/bavaro-zyklus5.json wie import-bavaro.ts (nicht im
// Repo — enthält Klarnamen) und erzeugt supabase/seed-bavaro-league.local.sql.
// Diese Datei ist ebenfalls gitignored und wird von Hand im Supabase SQL
// Editor ausgeführt.
//
// WICHTIG — Verhältnis zu import-bavaro.ts:
// Dieses Skript fasst players/matches/match_participants/match_sets/
// rating_history NICHT an (das erledigt bereits import-bavaro.ts, siehe
// dessen seed-bavaro.local.sql — die Rating-Historie aus den echten
// Zyklus-5-Ergebnissen bleibt bewusst erhalten, das ist ein eigenes
// System, siehe Rückfrage vom 20.08.). Es legt ausschließlich die
// league_*-Tabellen an (0016_league_module.sql).
//
// ENTSCHEIDUNG (Rückfrage 20.08., beantwortet):
//   * Die Liga startet auf PadelIndex mit einem neuen, leeren Zyklus —
//     kein "Zyklus 6" (das würde eine echte offizielle Nummerierung
//     behaupten, die wir nicht kennen), sondern neutral benannt.
//   * Die 21 Box-Gruppen aus Zyklus 5 werden UNVERÄNDERT übernommen
//     (kein Auf-/Abstieg angewendet — wir wissen nicht, ob das in der
//     Realität schon anders passiert ist).
//   * Alle Runden starten als 'scheduled' (offen), keine der 54 echten
//     Zyklus-5-Ergebnisse wird mit den neuen Boxen verknüpft — die Liga-
//     Tabelle auf PadelIndex zeigt entsprechend 0 gespielte Runden.
//
// SPIELER-IDs: exakt dieselbe UUIDv5-Ableitung wie import-bavaro.ts
// (gleicher Namespace, gleicher Key player:${name}) — sonst würden hier
// andere IDs entstehen als die, die seed-bavaro.local.sql bereits
// angelegt hat, und die Foreign Keys liefen ins Leere.
//
// SAISON/ZYKLUS-DATEN: unten als Konstanten, bewusst nicht aus der JSON
// übernommen (die trägt "Zyklus 5"-Metadaten, die hier nicht gelten).
// Vor dem Ausführen prüfen, ob CYCLE_START/CYCLE_END passen.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IN = resolve(ROOT, 'data/bavaro-zyklus5.json');
const OUT = resolve(ROOT, 'supabase/seed-bavaro-league.local.sql');

const LEAGUE_SLUG = 'bavaro';
const SEASON_NAME = 'Start auf PadelIndex';
// Heute als Start, +6 Wochen als Ende — an der typischen Zykluslänge aus
// den echten Zyklus-5-Daten orientiert (09.12.–19.01. = 41 Tage). Vor dem
// Ausführen anpassen, falls ihr ein konkretes Datum festlegen wollt.
const CYCLE_START = new Date().toISOString().slice(0, 10);
const CYCLE_END = new Date(Date.now() + 41 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const CYCLE_ORDINAL = 1;
const ROUNDS_PER_BOX = 3;

// Identisch zu import-bavaro.ts — muss dieselben Spieler-UUIDs erzeugen.
const NAMESPACE = '6f9619ff-8b86-d011-b42d-00c04fc964ff';
function uuidv5(name: string, namespace = NAMESPACE): string {
	const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
	const hash = createHash('sha1')
		.update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')]))
		.digest();
	const b = Buffer.from(hash.subarray(0, 16));
	b[6] = (b[6] & 0x0f) | 0x50;
	b[8] = (b[8] & 0x3f) | 0x80;
	const h = b.toString('hex');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const q = (v: string | null) => (v === null ? 'null' : `'${v.replace(/'/g, "''")}'`);

type SrcPlayer = { name: string; group: number | null; waitlist?: boolean };
const data = JSON.parse(readFileSync(IN, 'utf8')) as { players: SrcPlayer[] };

const byGroup = new Map<number, SrcPlayer[]>();
for (const p of data.players) {
	if (p.group === null) continue;
	const list = byGroup.get(p.group) ?? [];
	list.push(p);
	byGroup.set(p.group, list);
}

// Für die Warteliste: Zyklus-5-Rohdaten markieren einzelne Spieler explizit
// (waitlist: true). Wer weder eine Box noch dieses Flag hat, ist in den
// Rohdaten schlicht nicht erfasst — für den legen wir keine Registrierung
// an, statt eine Vermutung zu erfinden.
const waitlisted = data.players.filter((p) => p.group === null && p.waitlist === true);

const groups = [...byGroup.keys()].sort((a, b) => a - b);
for (const g of groups) {
	const size = byGroup.get(g)!.length;
	if (size !== 4) {
		throw new Error(`Box ${g}: ${size} Spieler statt 4 — Datei prüfen, bevor SQL erzeugt wird.`);
	}
}

const L: string[] = [];
L.push('-- ============================================================');
L.push(`-- ${LEAGUE_SLUG} — Liga-Startaufstellung auf PadelIndex`);
L.push(`-- Box-Gruppen übernommen aus: ${data.players.length} Spielern, Zyklus-5-Rohdaten`);
L.push('--');
L.push('-- ERZEUGT von scripts/import-bavaro-league.ts — nicht von Hand bearbeiten.');
L.push('-- Enthält KEINE Klarnamen (nur UUIDs) — trotzdem lokal halten, nicht committen.');
L.push('--');
L.push(`-- Setzt voraus: 0016_league_module.sql UND seed-bavaro.local.sql sind bereits`);
L.push('-- gelaufen (players/matches müssen existieren, FKs sonst verletzt).');
L.push('-- ============================================================');
L.push('');
L.push('begin;');
L.push('');
L.push('do $$');
L.push('begin');
L.push(`  if not exists (select 1 from leagues where slug = ${q(LEAGUE_SLUG)}) then`);
L.push(`    raise exception 'Liga % fehlt — 0016_league_module.sql zuerst ausführen', ${q(LEAGUE_SLUG)};`);
L.push('  end if;');
L.push(`  if not exists (select 1 from players where id = ${q(uuidv5(`player:${data.players[0].name}`))}) then`);
L.push("    raise exception 'Spieler fehlen — seed-bavaro.local.sql zuerst ausführen';");
L.push('  end if;');
L.push('end $$;');
L.push('');

// Kein clientseitig geratenes UUID für Saison/Zyklus/Box: die Tabellen
// generieren ihre id per Default (gen_random_uuid()), jeder nachfolgende
// Schritt schlägt die tatsächlich gespeicherte Zeile über ihren ECHTEN
// Schlüssel nach (league_id+name, season_id+ordinal, cycle_id+ladder_
// position). Ein clientseitig berechnetes UUID, das nicht mit dem trifft,
// was schon in der DB steht (z. B. aus einem älteren Testlauf mit
// anderer Ableitung), hätte sonst still an der falschen Zeile
// vorbeigeschrieben — genau das ist im Testlauf vom 20.08. passiert.
L.push('-- ---------- Saison ----------');
L.push('insert into league_seasons (league_id, name, starts_on, status)');
L.push(`select l.id, ${q(SEASON_NAME)}, ${q(CYCLE_START)}, 'running'`);
L.push(`from leagues l where l.slug = ${q(LEAGUE_SLUG)}`);
L.push('on conflict (league_id, name) do nothing;');
L.push('');

L.push('-- ---------- Zyklus ----------');
L.push('insert into league_cycles (season_id, ordinal, start_date, end_date, status)');
L.push('select s.id, v.ordinal, v.start_date, v.end_date, v.status');
L.push('from league_seasons s');
L.push('join leagues l on l.id = s.league_id and l.slug = ' + q(LEAGUE_SLUG));
L.push(`join (values (${CYCLE_ORDINAL}, ${q(CYCLE_START)}::date, ${q(CYCLE_END)}::date, 'running'))`);
L.push('  as v(ordinal, start_date, end_date, status) on true');
L.push(`where s.name = ${q(SEASON_NAME)}`);
L.push('on conflict (season_id, ordinal) do nothing;');
L.push('');

L.push('-- ---------- Boxen ----------');
L.push('insert into league_boxes (cycle_id, ladder_position)');
L.push('select cy.id, v.ladder_position');
L.push('from league_cycles cy');
L.push('join league_seasons s on s.id = cy.season_id');
L.push('join leagues l on l.id = s.league_id and l.slug = ' + q(LEAGUE_SLUG));
L.push(`join (values ${groups.map((g) => `(${g})`).join(', ')}) as v(ladder_position) on true`);
L.push(`where s.name = ${q(SEASON_NAME)} and cy.ordinal = ${CYCLE_ORDINAL}`);
L.push('on conflict (cycle_id, ladder_position) do nothing;');
L.push('');

L.push('-- Boxen dieses Zyklus, für die folgenden Schritte einmal aufgelöst.');
L.push('-- with wird pro Statement neu ausgewertet (keine Temp-Tabelle nötig),');
L.push('-- das hält die Datei diff-freundlich und ohne Aufräumschritt am Ende.');
L.push('with this_cycle_boxes as (');
L.push('  select b.id as box_id, b.ladder_position');
L.push('  from league_boxes b');
L.push('  join league_cycles cy on cy.id = b.cycle_id');
L.push('  join league_seasons s on s.id = cy.season_id');
L.push('  join leagues l on l.id = s.league_id and l.slug = ' + q(LEAGUE_SLUG));
L.push(`  where s.name = ${q(SEASON_NAME)} and cy.ordinal = ${CYCLE_ORDINAL}`);
L.push(')');
L.push('insert into league_box_members (box_id, player_id, seat, role)');
L.push("select b.box_id, v.player_id, v.seat, 'regular'");
L.push('from this_cycle_boxes b');
L.push('join (values');
const memberRows: string[] = [];
for (const g of groups) {
	byGroup.get(g)!.forEach((p, i) => {
		const playerId = uuidv5(`player:${p.name}`);
		memberRows.push(`  (${g}, ${q(playerId)}::uuid, ${i + 1})`);
	});
}
L.push(memberRows.join(',\n'));
L.push(') as v(ladder_position, player_id, seat) on v.ladder_position = b.ladder_position');
L.push('on conflict (box_id, player_id) do nothing;');
L.push('');

L.push('-- ---------- Runden-Platzhalter (alle offen, nichts gespielt) ----------');
L.push('with this_cycle_boxes as (');
L.push('  select b.id as box_id, b.ladder_position');
L.push('  from league_boxes b');
L.push('  join league_cycles cy on cy.id = b.cycle_id');
L.push('  join league_seasons s on s.id = cy.season_id');
L.push('  join leagues l on l.id = s.league_id and l.slug = ' + q(LEAGUE_SLUG));
L.push(`  where s.name = ${q(SEASON_NAME)} and cy.ordinal = ${CYCLE_ORDINAL}`);
L.push(')');
L.push("insert into league_box_matches (box_id, round_number, status)");
L.push("select b.box_id, v.round_number, 'scheduled'");
L.push('from this_cycle_boxes b');
L.push(
	`join (values ${Array.from({ length: ROUNDS_PER_BOX }, (_, i) => `(${i + 1})`).join(', ')}) as v(round_number) on true`
);
L.push('on conflict (box_id, round_number) do nothing;');
L.push('');

L.push('-- ---------- Registrierungen ----------');
L.push('-- Wer gerade in einer Box sitzt, gilt als aktiv; die explizit als');
L.push("-- Warteliste markierten Spieler als 'waitlist'. Das ist die Grundlage");
L.push('-- für die Ersatz-Logik (nächster von der Warteliste rückt nach).');
L.push('insert into league_registrations (league_id, player_id, status)');
L.push('select l.id, v.player_id, v.status');
L.push('from leagues l');
L.push(`join (values`);
const registrationRows: string[] = [];
for (const g of groups) {
	byGroup.get(g)!.forEach((p) => {
		registrationRows.push(`  (${q(uuidv5(`player:${p.name}`))}::uuid, 'active')`);
	});
}
for (const p of waitlisted) {
	registrationRows.push(`  (${q(uuidv5(`player:${p.name}`))}::uuid, 'waitlist')`);
}
L.push(registrationRows.join(',\n'));
L.push(') as v(player_id, status) on true');
L.push(`where l.slug = ${q(LEAGUE_SLUG)}`);
L.push('on conflict (league_id, player_id) do nothing;');
L.push('');

L.push('commit;');
L.push('');

writeFileSync(OUT, L.join('\n'), 'utf8');

console.log(`Geschrieben: ${OUT}`);
console.log(`Saison: "${SEASON_NAME}", Zyklus ${CYCLE_ORDINAL}, ${CYCLE_START} bis ${CYCLE_END}`);
console.log(`${groups.length} Boxen, ${memberRows.length} Aufstellungs-Zeilen, ${groups.length * ROUNDS_PER_BOX} offene Runden.`);
console.log(`${registrationRows.length} Registrierungen (${memberRows.length} aktiv, ${waitlisted.length} Warteliste).`);
console.log('Vor dem Ausführen im SQL Editor: CYCLE_START/CYCLE_END im Skript prüfen, falls ihr ein festes Datum wollt.');
