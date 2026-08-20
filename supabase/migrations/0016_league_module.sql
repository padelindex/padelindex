-- ============================================================
-- PadelIndex — Liga-Modul (formatunabhängiges Grundgerüst)
-- ============================================================
-- Erstes konkretes Format: die Box-/Americano-Liga nach dem Regelwerk der
-- BÁVARO PADEL LEAGUE (4er-Boxen, 3 Runden mit rotierenden Partnern,
-- Auf-/Abstieg zwischen benachbarten Boxen). Bewusst NICHT nach dieser
-- einen Liga benannt: weitere Formate (andere Boxgrößen, K.o.-Bäume,
-- andere Zählweisen) sollen dieselbe Liga-/Saison-/Zyklus-/Anmelde-
-- Struktur mitbenutzen und sich nur in der Spiel- und Tabellenlogik
-- unterscheiden. Das Unterscheidungsmerkmal ist leagues.format, nicht
-- ein Tabellenpräfix.
--
-- ENTSCHEIDUNGEN (mit dem Auftraggeber abgestimmt, 20.08.):
--   * Namensraum league_* mit Format-Diskriminator statt bavaro_*
--   * Flache Leiter: Boxen haben eine Position 1..N (1 = stärkste),
--     Auf-/Abstieg immer zwischen benachbarten Positionen. "Liga 1-4"
--     sind reine Anzeige-Labels über Positionsbereiche und stehen
--     deshalb in leagues.config, nicht als eigene Ebenen-Tabelle.
--
-- WAS DIESE MIGRATION NICHT TUT:
--   * Sie fasst das Rating-Modell nicht an. Ein Liga-Match ist eine ganz
--     normale Zeile in matches (source='club_league',
--     match_type='vereinsliga'); league_box_matches.match_id zeigt nur
--     darauf. Das Index-Rating läuft damit über dieselbe
--     apply_match_rating()-RPC wie jedes andere Match. Eine eigene
--     Tabelle für Rating-Updates braucht es nicht — rating_history hat
--     bereits genau diese Form (player_id, match_id, factors, reason).
--   * Sie legt keine Playoff-/K.o.-Tabellen an. Ein Bracket ist
--     strukturell etwas anderes als eine Box und gehört zu dem Format,
--     das es einführt — leere Tabellen auf Vorrat wären genau die
--     Vorfestlegung, die dieses Modul vermeiden soll.
--   * Sie speichert keine Tabellenstände. Standings werden aus den
--     Matches berechnet (siehe src/lib/league/box-americano.ts).

-- ------------------------------------------------------------
-- 1. Liga
-- ------------------------------------------------------------
-- config trägt alle formatspezifischen Stellschrauben, damit ein zweites
-- Format keine Schemaänderung braucht. Für box_americano_4:
--   {
--     "box_size": 4,
--     "rounds": 3,
--     "points_per_win": 1,          -- Bávaro zählt Siege, nicht 2/0
--     "promote": 1,                 -- Aufsteiger je Box
--     "relegate": 1,                -- Absteiger je Box
--     "relegate_top_box": 2,        -- oberste Box: kein Aufstieg möglich
--     "promote_bottom_box": 2,      -- unterste Box: kein Abstieg möglich
--     "tiebreakers": ["match_points", "set_diff", "game_diff"],
--     "level_labels": [{"label": "Liga 1", "from": 1, "to": 5}, ...]
--   }
create table if not exists leagues (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid references clubs(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  format      text not null check (format in ('box_americano_4')),
  config      jsonb not null default '{}'::jsonb,
  status      text not null default 'active'
                check (status in ('draft', 'active', 'archived')),
  created_at  timestamptz not null default now(),
  constraint leagues_config_is_object check (jsonb_typeof(config) = 'object')
);

create index if not exists leagues_club_idx on leagues (club_id) where status = 'active';

-- ------------------------------------------------------------
-- 2. Saison und Zyklus
-- ------------------------------------------------------------
-- Die echte Liga führt beides getrennt ("V. (2024/25)", darin Zyklus 5),
-- deshalb hier auch. Ein Zyklus ist die Spielperiode, nach der auf- und
-- abgestiegen wird; eine Saison klammert die Zyklen und ist die Einheit,
-- an der später eine Playoff-Phase hängen würde.
create table if not exists league_seasons (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid not null references leagues(id) on delete cascade,
  name        text not null,
  starts_on   date,
  ends_on     date,
  status      text not null default 'planned'
                check (status in ('planned', 'running', 'completed')),
  created_at  timestamptz not null default now(),
  unique (league_id, name)
);

create table if not exists league_cycles (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references league_seasons(id) on delete cascade,
  ordinal     int not null check (ordinal >= 1),
  name        text,
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'planned'
                check (status in ('planned', 'running', 'completed')),
  created_at  timestamptz not null default now(),
  unique (season_id, ordinal),
  constraint league_cycles_dates check (end_date >= start_date)
);

-- ------------------------------------------------------------
-- 3. Boxen
-- ------------------------------------------------------------
-- ladder_position statt "position": 1 = stärkste Box. Auf-/Abstieg
-- rechnet ausschließlich mit dieser Zahl, damit keine Ebenen-Logik
-- nötig ist. Absichtlich nicht "position" genannt — das ist in SQL ein
-- Schlüsselwort (POSITION(x IN y)) und liest sich in Queries verwirrend.
create table if not exists league_boxes (
  id              uuid primary key default gen_random_uuid(),
  cycle_id        uuid not null references league_cycles(id) on delete cascade,
  ladder_position int not null check (ladder_position >= 1),
  label           text,
  scheduled_at    timestamptz,
  court           text,
  created_at      timestamptz not null default now(),
  unique (cycle_id, ladder_position)
);

-- seat bestimmt die Rotation (Sitz 1-4 -> Runde 1: 1+2 vs 3+4 usw.).
-- Bis 8 erlaubt, damit ein späteres Format mit größeren Boxen dieselbe
-- Tabelle nutzen kann, ohne das Constraint zu ändern.
create table if not exists league_box_members (
  box_id              uuid not null references league_boxes(id) on delete cascade,
  player_id           uuid not null references players(id) on delete cascade,
  seat                smallint not null check (seat between 1 and 8),
  role                text not null default 'regular'
                        check (role in ('regular', 'substitute')),
  replaces_player_id  uuid references players(id) on delete set null,
  created_at          timestamptz not null default now(),
  primary key (box_id, player_id),
  unique (box_id, seat)
);

create index if not exists league_box_members_player_idx on league_box_members (player_id);

-- ------------------------------------------------------------
-- 4. Partien einer Box
-- ------------------------------------------------------------
-- match_id ist die Brücke zum allgemeinen Index-Rating: die Ergebnisse
-- selbst (Sätze, Teams) stehen in match_sets/match_participants, nicht
-- hier. So gibt es keine zweite Wahrheit über dasselbe Spiel.
--
-- status trägt die Fälle, die in den echten Daten wirklich vorkommen:
-- im Zyklus 5 haben 3 von 21 Boxen gar nicht gespielt, und eine Partie
-- wurde beim Stand 7:5, 0:3 abgebrochen (Sätze 1:1). Ohne expliziten
-- Status würde die Tabellenlogik daraus einen regulären Sieger ableiten.
--
-- winner_team: normalerweise null (= wird aus den Sätzen abgeleitet).
-- Gesetzt nur, wenn es keinen ableitbaren Sieger gibt — Abbruch mit
-- Satzgleichstand oder kampfloser Sieg ohne gespielte Sätze.
create table if not exists league_box_matches (
  id            uuid primary key default gen_random_uuid(),
  box_id        uuid not null references league_boxes(id) on delete cascade,
  round_number  smallint not null check (round_number >= 1),
  match_id      uuid unique references matches(id) on delete set null,
  status        text not null default 'scheduled'
                  check (status in ('scheduled', 'played', 'abandoned', 'walkover', 'cancelled')),
  winner_team   smallint check (winner_team in (1, 2)),
  note          text,
  created_at    timestamptz not null default now(),
  unique (box_id, round_number),
  constraint league_box_matches_played_needs_match
    check (status <> 'played' or match_id is not null),
  constraint league_box_matches_walkover_needs_winner
    check (status <> 'walkover' or winner_team is not null)
);

create index if not exists league_box_matches_box_idx on league_box_matches (box_id, round_number);

-- ------------------------------------------------------------
-- 5. Anmeldung, Warteliste, Austritt
-- ------------------------------------------------------------
create table if not exists league_registrations (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid not null references leagues(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  status      text not null default 'waitlist'
                check (status in ('active', 'waitlist', 'substitute', 'left')),
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  note        text,
  unique (league_id, player_id)
);

create index if not exists league_registrations_status_idx
  on league_registrations (league_id, status);

-- ------------------------------------------------------------
-- 6. Auf-/Abstieg als Vorschlag
-- ------------------------------------------------------------
-- Zielangabe ist eine Leiterposition, keine Box-ID: die Boxen des
-- Folgezyklus existieren zum Zeitpunkt des Vorschlags noch nicht.
-- status='proposed' -> ein Admin bestätigt, erst dann 'applied'.
create table if not exists league_promotions (
  id                  uuid primary key default gen_random_uuid(),
  cycle_id            uuid not null references league_cycles(id) on delete cascade,
  player_id           uuid not null references players(id) on delete cascade,
  from_box_id         uuid references league_boxes(id) on delete set null,
  from_rank           smallint,
  to_ladder_position  int check (to_ladder_position >= 1),
  direction           text not null check (direction in ('up', 'down', 'stay')),
  status              text not null default 'proposed'
                        check (status in ('proposed', 'applied', 'rejected')),
  decided_by          uuid references players(id) on delete set null,
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  unique (cycle_id, player_id)
);

create index if not exists league_promotions_cycle_idx on league_promotions (cycle_id, status);

-- ------------------------------------------------------------
-- 7. RLS
-- ------------------------------------------------------------
-- Gleiches Muster wie im übrigen Schema: Strukturdaten sind öffentlich
-- lesbar, alles mit Personenbezug läuft über service_role aus SvelteKit
-- (siehe 0009_club_admin.sql). Schreibzugriffe haben grundsätzlich keine
-- Policy — die Autorisierung gehört in TypeScript, nicht in eine
-- Policy-Expression.
alter table leagues              enable row level security;
alter table league_seasons       enable row level security;
alter table league_cycles        enable row level security;
alter table league_boxes         enable row level security;
alter table league_box_matches   enable row level security;
alter table league_box_members   enable row level security;
alter table league_registrations enable row level security;
alter table league_promotions    enable row level security;

-- create policy kennt kein "if not exists" — vorher droppen, damit die
-- Migration wie die create-table-Blöcke oben wiederholbar bleibt.
drop policy if exists leagues_public_read on leagues;
create policy leagues_public_read on leagues
  for select using (status <> 'draft');

drop policy if exists league_seasons_public_read on league_seasons;
create policy league_seasons_public_read on league_seasons
  for select using (true);

drop policy if exists league_cycles_public_read on league_cycles;
create policy league_cycles_public_read on league_cycles
  for select using (true);

drop policy if exists league_boxes_public_read on league_boxes;
create policy league_boxes_public_read on league_boxes
  for select using (true);

drop policy if exists league_box_matches_public_read on league_box_matches;
create policy league_box_matches_public_read on league_box_matches
  for select using (true);

grant select on table leagues, league_seasons, league_cycles,
                      league_boxes, league_box_matches
  to anon, authenticated;

-- league_box_members, league_registrations und league_promotions
-- bekommen bewusst KEINE Policy: sie verknüpfen Personen mit Spielstärke
-- und sind nur über die anonymisierte View unten bzw. über service_role
-- erreichbar.

-- ------------------------------------------------------------
-- 8. Öffentliche Aufstellung einer Box (anonymisiert)
-- ------------------------------------------------------------
-- Dieselbe Namensregel wie club_leaderboard: unbeanspruchte Profile
-- erscheinen nur als "Vorname N.".
--
-- Wer sich nach Block 0 aus der öffentlichen Listung zurückgezogen hat
-- (profile_public = false), wird NICHT aus der Box entfernt — sonst
-- stünden in einer 4er-Box plötzlich drei Leute und die Tabelle ginge
-- nicht mehr auf. Stattdessen fällt der Name weg und es bleibt der
-- Platzhalter ohne Profil-Link.
create or replace view league_box_lineup
with (security_invoker = false) as
select
  bm.box_id,
  b.cycle_id,
  b.ladder_position,
  bm.seat,
  bm.role,
  p.id as player_id,
  case when p.profile_public then p.handle end as handle,
  case
    when p.profile_public
      then public_display_name(p.display_name, p.claim_status, p.show_full_name)
    else 'Nicht gelistet'
  end as name,
  (p.profile_public and p.claim_status = 'claimed') as claimed
from league_box_members bm
join league_boxes b on b.id = bm.box_id
join players p on p.id = bm.player_id;

grant select on league_box_lineup to anon, authenticated;

-- ------------------------------------------------------------
-- 9. Ergebnis einer Box-Runde melden
-- ------------------------------------------------------------
-- Eigene RPC statt create_match_report(): dort wird Vereinsmitgliedschaft
-- geprüft, hier muss es Box-Mitgliedschaft sein — wer im selben Verein
-- ist, darf trotzdem kein Ergebnis für eine fremde Box eintragen.
-- Das Bestehende bleibt dadurch unangetastet.
--
-- Die Partie entsteht als ganz normale matches-Zeile. Nur der Melder
-- bestätigt sofort, der Rest läuft über den bestehenden 48h-Flow
-- (confirmMatchAsPlayer -> applyRatingForMatch -> apply_match_rating).
-- Damit gilt für Liga-Ergebnisse dieselbe Zusage wie überall sonst:
-- ein Ergebnis zählt erst, wenn das Gegnerteam zustimmt.
--
-- Die Paarung der Runde bestimmt die Rotation in TypeScript
-- (roundPairings in lib/league/box-americano.ts) — SQL bekommt sie
-- fertig übergeben und prüft nur noch auf Plausibilität.
create or replace function create_league_box_result(
  p_box_match_id uuid,
  p_reporter_id  uuid,
  p_team1        uuid[],
  p_team2        uuid[],
  p_sets         jsonb  -- [{"team1_games": int, "team2_games": int}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box_id      uuid;
  v_status      text;
  v_existing    uuid;
  v_club_id     uuid;
  v_played_at   timestamptz;
  v_match_id    uuid;
  v_all         uuid[];
  v_member_cnt  int;
  v_set_count   int;
  s             jsonb;
  i             int := 0;
begin
  select lbm.box_id, lbm.status, lbm.match_id,
         l.club_id, coalesce(b.scheduled_at, now())
    into v_box_id, v_status, v_existing, v_club_id, v_played_at
  from league_box_matches lbm
  join league_boxes b   on b.id = lbm.box_id
  join league_cycles cy on cy.id = b.cycle_id
  join league_seasons se on se.id = cy.season_id
  join leagues l        on l.id = se.league_id
  where lbm.id = p_box_match_id
  for update of lbm;

  if not found then
    raise exception 'Runde % nicht gefunden', p_box_match_id;
  end if;

  if v_existing is not null then
    raise exception 'Für diese Runde ist bereits ein Ergebnis eingetragen.';
  end if;

  if v_status <> 'scheduled' then
    raise exception 'Runde ist nicht offen (status=%).', v_status;
  end if;

  if array_length(p_team1, 1) <> 2 or array_length(p_team2, 1) <> 2 then
    raise exception 'Beide Teams brauchen genau zwei Spieler.';
  end if;

  v_all := p_team1 || p_team2;
  if (select count(distinct x) from unnest(v_all) x) <> 4 then
    raise exception 'Alle vier Spieler müssen unterschiedlich sein.';
  end if;

  select count(*) into v_member_cnt
  from league_box_members
  where box_id = v_box_id and player_id = any(v_all);

  if v_member_cnt <> 4 then
    raise exception 'Alle vier Spieler müssen zu dieser Box gehören.';
  end if;

  if not (p_reporter_id = any(v_all)) then
    raise exception 'Nur wer in dieser Box spielt, darf das Ergebnis melden.';
  end if;

  select count(*) into v_set_count from jsonb_array_elements(p_sets);
  if v_set_count < 1 or v_set_count > 5 then
    raise exception 'Zwischen einem und fünf Sätzen angeben.';
  end if;

  insert into matches (club_id, source, format, played_at, reported_by, match_type)
  values (v_club_id, 'club_league', 'best_of_3', v_played_at, p_reporter_id, 'vereinsliga')
  returning id into v_match_id;

  insert into match_participants (match_id, player_id, team, confirmed)
  select v_match_id, x, 1, (x = p_reporter_id) from unnest(p_team1) x
  union all
  select v_match_id, x, 2, (x = p_reporter_id) from unnest(p_team2) x;

  for s in select * from jsonb_array_elements(p_sets)
  loop
    i := i + 1;
    insert into match_sets (match_id, set_number, team1_games, team2_games)
    values (v_match_id, i, (s->>'team1_games')::smallint, (s->>'team2_games')::smallint);
  end loop;

  update league_box_matches
     set match_id = v_match_id,
         status   = 'played'
   where id = p_box_match_id;

  return v_match_id;
end;
$$;

revoke all on function create_league_box_result(uuid, uuid, uuid[], uuid[], jsonb)
  from public, anon, authenticated;
grant execute on function create_league_box_result(uuid, uuid, uuid[], uuid[], jsonb)
  to service_role;

-- ------------------------------------------------------------
-- 10. Die Bávaro-Liga als Datenzeile
-- ------------------------------------------------------------
-- Nur die Liga-DEFINITION (Name, Format, Regelwerk) — keine Spieler,
-- keine Ergebnisse. Die enthalten Klarnamen und bleiben in dem
-- gitignorten Import (scripts/import-bavaro.ts).
--
-- points_per_win = 1: aus den echten Daten abgeleitet, dort summieren
-- sich die Matchpunkte je Spieler immer auf 3 bei 3 Runden — es wird
-- also pro Sieg ein Punkt gezählt, nicht zwei.
insert into leagues (club_id, name, slug, format, config, status)
select
  c.id,
  'BÁVARO PADEL LEAGUE',
  'bavaro',
  'box_americano_4',
  jsonb_build_object(
    'box_size', 4,
    'rounds', 3,
    'points_per_win', 1,
    'promote', 1,
    'relegate', 1,
    'relegate_top_box', 2,
    'promote_bottom_box', 2,
    'tiebreakers', jsonb_build_array('match_points', 'set_diff', 'game_diff')
  ),
  'active'
from clubs c
where c.slug = 'stc-oberland'
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop function if exists create_league_box_result(uuid, uuid, uuid[], uuid[], jsonb);
-- drop view if exists league_box_lineup;
-- drop table if exists league_promotions;
-- drop table if exists league_registrations;
-- drop table if exists league_box_matches;
-- drop table if exists league_box_members;
-- drop table if exists league_boxes;
-- drop table if exists league_cycles;
-- drop table if exists league_seasons;
-- drop table if exists leagues;
-- (matches/rating_history bleiben unberührt — das Liga-Modul zeigt nur
--  darauf, es besitzt keine Rating-Daten.)
-- ------------------------------------------------------------
