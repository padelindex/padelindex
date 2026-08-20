// ============================================================
// PadelIndex — Import der BÁVARO-Padel-League-Tabelle
// ============================================================
//
//   npm run import:bavaro
//
// Liest data/bavaro-zyklus5.json (nicht im Repo — enthält Klarnamen),
// rechnet die echten Matches durch den echten Rating-Kern und schreibt
// supabase/seed-bavaro.local.sql. Diese Datei ist ebenfalls gitignored
// und wird von Hand im Supabase SQL Editor ausgeführt.
//
// Idempotent: alle IDs sind deterministisch aus dem Namen abgeleitet,
// ein erneuter Lauf erzeugt exakt dieselben UUIDs.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeMatchRatings, toDisplayRating, PROVISIONAL_MATCHES } from '../src/lib/server/rating/rating';
import { seedFromLeagueRank, seedWithoutRank } from '../src/lib/server/rating/league-seed';
import { BOX_AMERICANO_4_DEFAULTS } from '../src/lib/league/box-americano';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IN = resolve(ROOT, 'data/bavaro-zyklus5.json');
const OUT = resolve(ROOT, 'supabase/seed-bavaro.local.sql');

// Fester Namensraum, damit UUIDs über Läufe hinweg stabil bleiben.
const NAMESPACE = '6f9619ff-8b86-d011-b42d-00c04fc964ff';

/** UUIDv5 (SHA-1) — deterministisch aus einem Schlüssel. */
function uuidv5(name, namespace = NAMESPACE) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')])).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // Version 5
  b[8] = (b[8] & 0x3f) | 0x80; // Variante RFC 4122
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Handles landen über die Leaderboard-API in der Öffentlichkeit. Für
 * importierte Profile darf daraus kein Klarname ableitbar sein, deshalb
 * ein stabiles Kürzel statt eines Namens-Slugs.
 */
function opaqueHandle(name) {
  return 'stc-' + createHash('sha256').update(`bavaro:${name}`).digest('hex').slice(0, 8);
}

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? 'null' : String(v));

// ---------- Daten laden ----------
const data = JSON.parse(readFileSync(IN, 'utf8'));
const playedAt = `${data.cycle_end}T18:00:00+01:00`;

const ranked = data.players.filter((p) => p.rank !== null);
const leagueSize = ranked.length;

// ---------- Spielerzustände aufbauen ----------
const players = new Map();
for (const p of data.players) {
  // Startwert aus der Position VOR diesem Zyklus (= Ergebnis der Zyklen 1-4)
  const seed =
    p.previous_rank !== null
      ? seedFromLeagueRank(p.previous_rank, leagueSize)
      : seedWithoutRank();

  players.set(p.name, {
    id: uuidv5(`player:${p.name}`),
    name: p.name,
    handle: opaqueHandle(p.name),
    rank: p.rank,
    previousRank: p.previous_rank,
    seedMu: seed.mu,
    seedSigma: seed.sigma,
    mu: seed.mu,
    sigma: seed.sigma,
    matchesPlayed: 0,
    currentStreak: 0,
    history: []
  });
}

// ---------- Echte Matches durch den echten Rating-Kern ----------
const matches = [];
for (const [i, m] of data.matches.entries()) {
  const team1 = m.team1.map((name) => players.get(name));
  const team2 = m.team2.map((name) => players.get(name));
  if (team1.includes(undefined) || team2.includes(undefined)) {
    throw new Error(`Match ${i}: unbekannter Spieler in ${JSON.stringify(m)}`);
  }

  const toState = (p) => ({
    playerId: p.id,
    mu: p.mu,
    sigma: p.sigma,
    matchesPlayed: p.matchesPlayed,
    currentStreak: p.currentStreak
  });

  const results = computeMatchRatings({
    team1: team1.map(toState),
    team2: team2.map(toState),
    sets: m.sets.map((s) => ({ team1Games: s.team1_games, team2Games: s.team2_games }))
  });

  const matchId = uuidv5(`match:${data.cycle}:${i}`);
  matches.push({ id: matchId, ...m, team1, team2, results });

  for (const r of results) {
    const p = [...team1, ...team2].find((x) => x.id === r.playerId);
    p.mu = r.muAfter;
    p.sigma = r.sigmaAfter;
    p.matchesPlayed += 1;
    p.currentStreak = r.factors.won
      ? Math.max(p.currentStreak, 0) + 1
      : Math.min(p.currentStreak, 0) - 1;
    p.history.push({ matchId, ...r });
  }
}

// ---------- SQL schreiben ----------
const L = [];
L.push('-- ============================================================');
L.push(`-- ${data.league} — ${data.season}, Zyklus ${data.cycle}`);
L.push(`-- ${data.cycle_start} bis ${data.cycle_end} · Quelle: ${data.source}`);
L.push('--');
L.push('-- ERZEUGT von scripts/import-bavaro.ts — nicht von Hand bearbeiten.');
L.push('-- Enthält Klarnamen echter Personen: nicht committen, nicht teilen.');
L.push('--');
L.push(`-- ${data.players.length} Spieler (${leagueSize} mit Ligaposition), ${data.matches.length} Matches.`);
L.push('-- Profile werden unbeansprucht angelegt (user_id null, claim_status');
L.push('-- unclaimed) und sind öffentlich nur abgekürzt sichtbar.');
L.push('-- ============================================================');
L.push('');
L.push('begin;');
L.push('');
L.push('-- Verein muss existieren (aus 0001_schema.sql)');
L.push('do $$');
L.push('begin');
L.push(`  if not exists (select 1 from clubs where slug = ${q(data.club_slug)}) then`);
L.push(`    raise exception 'Verein % fehlt — 0001_schema.sql zuerst ausführen', ${q(data.club_slug)};`);
L.push('  end if;');
L.push('end $$;');
L.push('');

// -- Spieler
L.push('-- ---------- Spieler (unbeansprucht) ----------');
L.push(
  'insert into players (id, display_name, handle, mu, sigma, matches_played, is_provisional, last_match_at, claim_status, origin, self_assessed_level) values'
);
const playerRows = [...players.values()].map((p) => {
  const isProv = p.matchesPlayed < PROVISIONAL_MATCHES;
  const last = p.matchesPlayed > 0 ? q(playedAt) : 'null';
  return `  (${q(p.id)}, ${q(p.name)}, ${q(p.handle)}, ${n(p.mu)}, ${n(p.sigma)}, ${n(p.matchesPlayed)}, ${isProv}, ${last}, 'unclaimed', 'league_import', null)`;
});
L.push(playerRows.join(',\n'));
L.push('on conflict (id) do update set');
L.push('  display_name   = excluded.display_name,');
L.push('  handle         = excluded.handle,');
L.push('  mu             = excluded.mu,');
L.push('  sigma          = excluded.sigma,');
L.push('  matches_played = excluded.matches_played,');
L.push('  is_provisional = excluded.is_provisional,');
L.push('  last_match_at  = excluded.last_match_at;');
L.push('');

// -- Mitgliedschaften
L.push('-- ---------- Vereinszugehörigkeit ----------');
L.push('insert into club_memberships (club_id, player_id, role)');
L.push(`select c.id, v.player_id, 'member'`);
L.push('from clubs c, (values');
L.push([...players.values()].map((p) => `  (${q(p.id)}::uuid)`).join(',\n'));
L.push(') as v(player_id)');
L.push(`where c.slug = ${q(data.club_slug)}`);
L.push('on conflict (club_id, player_id) do nothing;');
L.push('');

// -- Matches
L.push('-- ---------- Matches ----------');
L.push(
  'insert into matches (id, club_id, status, rating_applied, source, format, played_at, confirmed_at, confirm_deadline)'
);
L.push("select v.id, c.id, 'confirmed', true, 'club_league', 'best_of_3', v.played_at, v.played_at, v.played_at");
L.push('from clubs c, (values');
L.push(matches.map((m) => `  (${q(m.id)}::uuid, ${q(playedAt)}::timestamptz)`).join(',\n'));
L.push(') as v(id, played_at)');
L.push(`where c.slug = ${q(data.club_slug)}`);
L.push('on conflict (id) do nothing;');
L.push('');

L.push('insert into match_participants (match_id, player_id, team, confirmed) values');
L.push(
  matches
    .flatMap((m) => [
      ...m.team1.map((p) => `  (${q(m.id)}, ${q(p.id)}, 1, true)`),
      ...m.team2.map((p) => `  (${q(m.id)}, ${q(p.id)}, 2, true)`)
    ])
    .join(',\n')
);
L.push('on conflict (match_id, player_id) do nothing;');
L.push('');

L.push('insert into match_sets (match_id, set_number, team1_games, team2_games) values');
L.push(
  matches
    .flatMap((m) =>
      m.sets.map((s, i) => `  (${q(m.id)}, ${i + 1}, ${s.team1_games}, ${s.team2_games})`)
    )
    .join(',\n')
);
L.push('on conflict (match_id, set_number) do nothing;');
L.push('');

// -- Rating-Historie
L.push('-- ---------- Rating-Historie ----------');
L.push('-- Erst der Startwert aus der Ligaposition, dann jedes echte Match.');
L.push('delete from rating_history where player_id in (');
L.push([...players.values()].map((p) => `  ${q(p.id)}`).join(',\n'));
L.push(');');
L.push('');
L.push(
  'insert into rating_history (id, player_id, match_id, mu_before, sigma_before, mu_after, sigma_after, rating_before, rating_after, factors, reason, created_at) values'
);

const histRows = [];
for (const p of players.values()) {
  histRows.push(
    `  (${q(uuidv5(`seed:${p.name}`))}, ${q(p.id)}, null, ${n(p.seedMu)}, ${n(p.seedSigma)}, ${n(p.seedMu)}, ${n(p.seedSigma)}, 0, ${n(
      toDisplayRating(p.seedMu, p.seedSigma)
    )}, ${q(
      JSON.stringify({
        source: 'league_import',
        league: data.league,
        season: data.season,
        league_rank: p.previousRank,
        league_size: leagueSize
      })
    )}::jsonb, 'seed', ${q(`${data.cycle_start}T12:00:00+01:00`)})`
  );
}
for (const m of matches) {
  for (const r of m.results) {
    const p = [...players.values()].find((x) => x.id === r.playerId);
    histRows.push(
      `  (${q(uuidv5(`hist:${m.id}:${p.name}`))}, ${q(r.playerId)}, ${q(m.id)}, ${n(r.muBefore)}, ${n(r.sigmaBefore)}, ${n(r.muAfter)}, ${n(r.sigmaAfter)}, ${n(r.ratingBefore)}, ${n(r.ratingAfter)}, ${q(JSON.stringify(r.factors))}::jsonb, 'match', ${q(playedAt)})`
    );
  }
}
L.push(histRows.join(',\n') + ';');
L.push('');

// ---------- Liga-Boxen (Zyklus data.cycle) ----------
// Läuft in derselben Transaktion wie Spieler/Matches oben: league_boxes
// braucht players.id und, für gespielte Runden, matches.id — beides muss
// schon existieren. Match-IDs werden NICHT neu vergeben, sondern über
// dieselbe uuidv5('match:...')-Ableitung wiederverwendet wie oben, sonst
// gäbe es dieselben Ergebnisse doppelt (einmal frei, einmal an eine Box
// gehängt) und das Rating würde ein zweites Mal angewendet.
//
// Alle 54 erfassten Matches — auch das bei 7:5, 0:3 abgebrochene in
// Gruppe 19 — laufen als status='played': genau das hat
// verify-bavaro-standings.ts bereits gegen die offizielle PDF-Tabelle
// geprüft (0 Abweichungen), ein eigener 'abandoned'-Status hier würde
// von der schon verifizierten Berechnung abweichen.
const byGroup = new Map();
for (const p of data.players) {
  if (p.group === null) continue;
  const list = byGroup.get(p.group) ?? [];
  list.push(players.get(p.name));
  byGroup.set(p.group, list);
}
const matchesByGroup = new Map();
for (const m of matches) {
  const list = matchesByGroup.get(m.group) ?? [];
  list.push(m);
  matchesByGroup.set(m.group, list);
}

const seasonId = uuidv5(`season:${data.league}:${data.season}`);
const cycleId = uuidv5(`cycle:${data.league}:${data.cycle}`);
// Das Enddatum liegt in der Vergangenheit -> ehrlich als abgeschlossen
// markieren statt "läuft" zu behaupten.
const cycleStatus = new Date(`${data.cycle_end}T00:00:00Z`) < new Date() ? 'completed' : 'running';

L.push(`-- ---------- Liga-Boxen (Zyklus ${data.cycle}) ----------`);
L.push('do $$');
L.push('declare');
L.push('  v_league_id uuid;');
L.push('begin');
L.push(`  select id into v_league_id from leagues where club_id = (select id from clubs where slug = ${q(data.club_slug)});`);
L.push('  if v_league_id is null then');
L.push(`    raise exception 'Keine Liga für Verein % — 0016_league_module.sql zuerst ausführen', ${q(data.club_slug)};`);
L.push('  end if;');
L.push('');
L.push(`  insert into league_seasons (id, league_id, name, status) values (${q(seasonId)}, v_league_id, ${q(data.season)}, 'running')`);
L.push('  on conflict (id) do nothing;');
L.push('');
L.push(
  `  insert into league_cycles (id, season_id, ordinal, start_date, end_date, status) values (${q(cycleId)}, ${q(seasonId)}, ${n(data.cycle)}, ${q(data.cycle_start)}, ${q(data.cycle_end)}, ${q(cycleStatus)})`
);
L.push('  on conflict (id) do update set status = excluded.status;');
L.push('end $$;');
L.push('');

L.push('-- ---------- Boxen ----------');
L.push('insert into league_boxes (id, cycle_id, ladder_position) values');
const boxRows = [...byGroup.keys()]
  .sort((a, b) => a - b)
  .map((g) => `  (${q(uuidv5(`box:${data.league}:${data.cycle}:${g}`))}, ${q(cycleId)}, ${n(g)})`);
L.push(boxRows.join(',\n'));
L.push('on conflict (id) do nothing;');
L.push('');

L.push('-- ---------- Aufstellung ----------');
L.push('-- Sitz = Position in der offiziellen Tabelle je Box; das legt die');
L.push('-- Rotation fest (roundPairings() in box-americano.ts).');
L.push('insert into league_box_members (box_id, player_id, seat, role) values');
const memberRows = [];
for (const g of [...byGroup.keys()].sort((a, b) => a - b)) {
  const boxId = uuidv5(`box:${data.league}:${data.cycle}:${g}`);
  byGroup.get(g).forEach((p, i) => {
    memberRows.push(`  (${q(boxId)}, ${q(p.id)}, ${n(i + 1)}, 'regular')`);
  });
}
L.push(memberRows.join(',\n'));
L.push('on conflict (box_id, player_id) do nothing;');
L.push('');

L.push('-- ---------- Runden ----------');
L.push('-- Gespielte Boxen verweisen auf die oben angelegten matches-Zeilen');
L.push('-- (dieselbe uuidv5-Ableitung, keine neuen Matches). Unbespielte');
L.push('-- Boxen (1, 13, 21 in Zyklus 5) bekommen offene Platzhalter, damit');
L.push('-- die Ergebniseingabe etwas zum Buchen hat.');
L.push('insert into league_box_matches (box_id, round_number, match_id, status) values');
const roundRows = [];
for (const g of [...byGroup.keys()].sort((a, b) => a - b)) {
  const boxId = uuidv5(`box:${data.league}:${data.cycle}:${g}`);
  const played = matchesByGroup.get(g) ?? [];
  if (played.length === 0) {
    for (let r = 1; r <= BOX_AMERICANO_4_DEFAULTS.rounds; r++) {
      roundRows.push(`  (${q(boxId)}, ${n(r)}, null, 'scheduled')`);
    }
  } else {
    played.forEach((m, i) => {
      roundRows.push(`  (${q(boxId)}, ${n(i + 1)}, ${q(m.id)}, 'played')`);
    });
  }
}
L.push(roundRows.join(',\n'));
L.push('on conflict (box_id, round_number) do update set match_id = excluded.match_id, status = excluded.status;');
L.push('');

L.push('commit;');
L.push('');

writeFileSync(OUT, L.join('\n'), 'utf8');

// ---------- Bericht ----------
const table = [...players.values()]
  .filter((p) => p.rank !== null)
  .sort((a, b) => b.mu - 2 * b.sigma - (a.mu - 2 * a.sigma));

console.log(`Spieler:   ${players.size} (${leagueSize} mit Ligaposition)`);
console.log(`Matches:   ${matches.length}`);
console.log(`Historie:  ${histRows.length} Einträge`);
console.log(`Geschrieben: ${OUT}`);
console.log('');
console.log('Top 12 nach berechnetem Rating:');
console.log('  PI-Rang  Liga  Rating  Matches  Spieler');
table.slice(0, 12).forEach((p, i) => {
  const r = toDisplayRating(p.mu, p.sigma).toFixed(2);
  console.log(
    `  ${String(i + 1).padStart(7)}  ${String(p.rank).padStart(4)}  ${r.padStart(6)}  ${String(p.matchesPlayed).padStart(7)}  ${p.name}`
  );
});

// Korrelation PadelIndex-Reihenfolge vs. offizielle Ligatabelle
const withMatches = table.filter((p) => p.matchesPlayed > 0);
const d2 = withMatches.reduce((acc, p, i) => {
  const ligaOrder = withMatches
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .findIndex((x) => x.id === p.id);
  return acc + (i - ligaOrder) ** 2;
}, 0);
const nn = withMatches.length;
const spearman = 1 - (6 * d2) / (nn * (nn * nn - 1));
console.log('');
console.log(`Spearman-Korrelation zur offiziellen Tabelle: ${spearman.toFixed(3)}`);
