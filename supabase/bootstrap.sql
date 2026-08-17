-- PadelIndex bootstrap — einmal im Supabase SQL Editor ausführen
-- Dateien: 0001 + 0002 + 0003 + 0004

-- ========== 0001_schema.sql ==========
-- ============================================================
-- PadelIndex — Basisschema
-- Rekonstruiert aus Worker, RPC, Widget-Vertrag und Claims-SQL.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Clubs
-- ------------------------------------------------------------
create table clubs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  license_tier  text not null default 'free'
                  check (license_tier in ('free', 'basic', 'pro')),
  accent        text default '#0F6E5C',
  logo_path     text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Players (1:1 mit auth.users)
-- ------------------------------------------------------------
create table players (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null,
  handle              text not null unique,
  mu                  numeric not null default 25.0,
  sigma               numeric not null default (25.0 / 3.0),
  matches_played      int not null default 0,
  is_provisional      boolean not null default true,
  last_match_at       timestamptz,
  profile_public      boolean not null default true,
  self_assessed_level numeric check (self_assessed_level between 0 and 7),
  created_at          timestamptz not null default now(),
  rating              numeric generated always as (
                        greatest(
                          0::numeric,
                          least(
                            7::numeric,
                            round(((mu - 2 * sigma) * 7.0 / 50.0)::numeric, 2)
                          )
                        )
                      ) stored
);

create index players_rating_idx on players (rating desc);

-- ------------------------------------------------------------
-- Mitgliedschaften
-- ------------------------------------------------------------
create table club_memberships (
  club_id     uuid not null references clubs(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now(),
  primary key (club_id, player_id)
);

create index club_memberships_player_idx on club_memberships (player_id);

-- ------------------------------------------------------------
-- Matches
-- ------------------------------------------------------------
create table matches (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid references clubs(id) on delete set null,
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  rating_applied    boolean not null default false,
  source            text not null default 'manual'
                      check (source in ('manual', 'club_league', 'tournament', 'import')),
  format            text not null default 'best_of_3',
  played_at         timestamptz not null default now(),
  reported_by       uuid references players(id) on delete set null,
  confirm_deadline  timestamptz not null default (now() + interval '48 hours'),
  confirmed_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index matches_status_deadline_idx on matches (status, confirm_deadline);
create index matches_club_idx on matches (club_id, played_at desc);

create table match_participants (
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  team        smallint not null check (team in (1, 2)),
  confirmed   boolean not null default false,
  primary key (match_id, player_id)
);

create index match_participants_player_idx on match_participants (player_id);

create table match_sets (
  match_id      uuid not null references matches(id) on delete cascade,
  set_number    smallint not null check (set_number between 1 and 5),
  team1_games   smallint not null check (team1_games between 0 and 99),
  team2_games   smallint not null check (team2_games between 0 and 99),
  primary key (match_id, set_number)
);

-- ------------------------------------------------------------
-- Rating-Historie + Tokens
-- ------------------------------------------------------------
create table rating_history (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references players(id) on delete cascade,
  match_id        uuid references matches(id) on delete set null,
  mu_before       numeric not null,
  sigma_before    numeric not null,
  mu_after        numeric not null,
  sigma_after     numeric not null,
  rating_before   numeric not null,
  rating_after    numeric not null,
  factors         jsonb not null default '{}'::jsonb,
  reason          text not null
                    check (reason in ('match', 'inactivity_decay', 'seed', 'manual_adjust')),
  created_at      timestamptz not null default now()
);

create index rating_history_player_idx on rating_history (player_id, created_at desc);

create table token_transactions (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  club_id     uuid references clubs(id) on delete set null,
  amount      int not null check (amount > 0),
  reason      text not null,
  match_id    uuid references matches(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index token_transactions_player_idx on token_transactions (player_id, created_at desc);

-- ------------------------------------------------------------
-- Waitlist (Landing)
-- ------------------------------------------------------------
create table waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  created_at  timestamptz not null default now(),
  constraint waitlist_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create unique index waitlist_email_lower_idx on waitlist (lower(email));

-- ------------------------------------------------------------
-- Öffentliches Leaderboard (nie mu/sigma nach außen)
-- ------------------------------------------------------------
create or replace view club_leaderboard
with (security_invoker = true) as
select
  c.id as club_id,
  c.slug as club_slug,
  c.name as club_name,
  c.license_tier,
  c.accent,
  p.id as player_id,
  p.handle,
  p.display_name as name,
  p.rating,
  round(
    greatest(0::numeric, least(1::numeric, 1 - (p.sigma / (25.0 / 3.0))))::numeric,
    4
  ) as confidence,
  p.matches_played as matches,
  p.is_provisional as provisional,
  coalesce((
    select rh.rating_after - rh.rating_before
    from rating_history rh
    where rh.player_id = p.id
      and rh.reason = 'match'
    order by rh.created_at desc
    limit 1
  ), 0) as trend,
  p.last_match_at
from clubs c
join club_memberships cm on cm.club_id = c.id
join players p on p.id = cm.player_id
where p.profile_public = true;

grant select on club_leaderboard to anon, authenticated;

-- ------------------------------------------------------------
-- Auth: neuer User -> Spielerzeile
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_handle text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1),
    'Spieler'
  );
  v_handle := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_handle := trim(both '-' from v_handle);
  if v_handle is null or v_handle = '' then
    v_handle := 'player';
  end if;
  if exists (select 1 from players where handle = v_handle) then
    v_handle := v_handle || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into players (id, display_name, handle)
  values (new.id, v_name, v_handle);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table clubs enable row level security;
alter table players enable row level security;
alter table club_memberships enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;
alter table match_sets enable row level security;
alter table rating_history enable row level security;
alter table token_transactions enable row level security;
alter table waitlist enable row level security;

create policy clubs_public_read on clubs
  for select using (true);

create policy players_public_read on players
  for select using (profile_public = true);

create policy players_self_select on players
  for select using (id = auth.uid());

create policy players_self_update on players
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy memberships_public_read on club_memberships
  for select using (true);

create policy matches_participant_read on matches
  for select using (
    exists (
      select 1 from match_participants mp
      where mp.match_id = matches.id and mp.player_id = auth.uid()
    )
  );

create policy match_participants_self_read on match_participants
  for select using (
    player_id = auth.uid()
    or exists (
      select 1 from match_participants mp
      where mp.match_id = match_participants.match_id and mp.player_id = auth.uid()
    )
  );

create policy match_sets_participant_read on match_sets
  for select using (
    exists (
      select 1 from match_participants mp
      where mp.match_id = match_sets.match_id and mp.player_id = auth.uid()
    )
  );

create policy rating_history_public_or_self on rating_history
  for select using (
    player_id = auth.uid()
    or exists (
      select 1 from players p
      where p.id = rating_history.player_id and p.profile_public = true
    )
  );

create policy token_transactions_self_read on token_transactions
  for select using (player_id = auth.uid());

-- waitlist: nur service_role (keine Policies für anon/authenticated)

grant select on table clubs, players, club_memberships, rating_history to anon, authenticated;

-- ------------------------------------------------------------
-- Pilotverein
-- ------------------------------------------------------------
insert into clubs (name, slug, license_tier, accent)
values ('STC Oberland', 'stc-oberland', 'basic', '#0F6E5C')
on conflict (slug) do nothing;

-- ========== 0002_apply_match_rating.sql ==========
-- ============================================================
-- PadelIndex — atomare Anwendung eines Rating-Ergebnisses
-- ============================================================
-- Warum eine SQL-Funktion und nicht mehrere Supabase-Client-Calls:
-- der Supabase-JS-Client kennt keine Transaktionen. Ohne Transaktion
-- riskierst du halb angewandte Matches (Rating geschrieben, Tokens nicht).
-- Ablauf: TS berechnet -> ein einziger rpc()-Call schreibt alles atomar.
--
-- Aufruf aus SvelteKit (service_role, NIE mit anon key):
--   await supabaseAdmin.rpc('apply_match_rating', {
--     p_match_id: matchId,
--     p_results: results,   -- JSONB-Array aus computeMatchRatings()
--     p_grants:  grants     -- JSONB-Array aus computeTokenGrants()
--   });

create or replace function apply_match_rating(
  p_match_id uuid,
  p_results  jsonb,
  p_grants   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status         text;
  v_rating_applied boolean;
  v_club_id        uuid;
  r                jsonb;
  g                jsonb;
begin
  -- 1. Match sperren und Vorbedingungen prüfen (Idempotenz!)
  select status, rating_applied, club_id
    into v_status, v_rating_applied, v_club_id
  from matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match % nicht gefunden', p_match_id;
  end if;

  if v_status <> 'confirmed' then
    raise exception 'Match % ist nicht bestätigt (status=%)', p_match_id, v_status;
  end if;

  -- Doppelanwendung still abbrechen: Retry/Cron darf nichts kaputt machen
  if v_rating_applied then
    return;
  end if;

  -- 2. Rating pro Spieler schreiben + Historie
  for r in select * from jsonb_array_elements(p_results)
  loop
    insert into rating_history (
      player_id, match_id,
      mu_before, sigma_before, mu_after, sigma_after,
      rating_before, rating_after, factors, reason
    ) values (
      (r->>'playerId')::uuid, p_match_id,
      (r->>'muBefore')::numeric, (r->>'sigmaBefore')::numeric,
      (r->>'muAfter')::numeric,  (r->>'sigmaAfter')::numeric,
      (r->>'ratingBefore')::numeric, (r->>'ratingAfter')::numeric,
      r->'factors', 'match'
    );

    update players
       set mu             = (r->>'muAfter')::numeric,
           sigma          = (r->>'sigmaAfter')::numeric,
           matches_played = matches_played + 1,
           is_provisional = (matches_played + 1) < 12,
           last_match_at  = greatest(
                              coalesce(last_match_at, '-infinity'::timestamptz),
                              (select played_at from matches where id = p_match_id)
                            )
     where id = (r->>'playerId')::uuid;
  end loop;

  -- 3. Token-Gutschriften (nur positiv — Constraint im Schema erzwingt das)
  for g in select * from jsonb_array_elements(p_grants)
  loop
    insert into token_transactions (player_id, club_id, amount, reason, match_id)
    values (
      (g->>'playerId')::uuid,
      v_club_id,
      (g->>'amount')::int,
      g->>'reason',
      p_match_id
    );
  end loop;

  -- 4. Match als angewandt markieren
  update matches
     set rating_applied = true
   where id = p_match_id;
end;
$$;

revoke all on function apply_match_rating(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function apply_match_rating(uuid, jsonb, jsonb) to service_role;


-- ============================================================
-- Bestätigungs-Automatik: 48h-Fenster läuft ab
-- ============================================================
-- Setzt fällige Matches auf 'confirmed'. Die eigentliche
-- Rating-Berechnung holt sich danach der Worker (siehe unten).

create or replace function auto_confirm_due_matches()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  update matches
     set status = 'confirmed',
         confirmed_at = now()
   where status = 'pending'
     and confirm_deadline <= now()
  returning id;
$$;

grant execute on function auto_confirm_due_matches() to service_role;


-- ============================================================
-- Streak-Ermittlung (Input für die Rating-Berechnung)
-- ============================================================
-- Liefert die aktuelle Serie: positiv = Siege, negativ = Niederlagen.

create or replace function player_current_streak(p_player_id uuid)
returns int
language sql
stable
as $$
  with recent as (
    select (rh.factors->>'won')::boolean as won,
           row_number() over (order by rh.created_at desc) as rn
    from rating_history rh
    where rh.player_id = p_player_id
      and rh.reason = 'match'
    order by rh.created_at desc
    limit 30
  ),
  first_val as (select won from recent where rn = 1),
  run as (
    select count(*) as len
    from recent r
    where r.rn <= coalesce(
      (select min(rn) from recent x
        where x.won is distinct from (select won from first_val)), 999
    ) - 1
  )
  select case
           when (select won from first_val) is null then 0
           when (select won from first_val) then (select len from run)::int
           else -(select len from run)::int
         end;
$$;


-- ============================================================
-- Inaktivitäts-Decay (Cron, z.B. wöchentlich via pg_cron)
-- ============================================================
create or replace function apply_inactivity_decay()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_base_sigma numeric := 25.0/3.0;
  p record;
  v_weeks int;
  v_steps int;
  v_new_sigma numeric;
begin
  for p in
    select id, sigma, mu, last_match_at
    from players
    where last_match_at is not null
      and last_match_at < now() - interval '6 weeks'
      and sigma < v_base_sigma
  loop
    v_weeks := floor(extract(epoch from (now() - p.last_match_at)) / 604800)::int;
    v_steps := floor((v_weeks - 6) / 4.0)::int + 1;
    v_new_sigma := least(p.sigma * (1 + 0.08 * v_steps), v_base_sigma);

    if v_new_sigma > p.sigma then
      insert into rating_history (
        player_id, mu_before, sigma_before, mu_after, sigma_after,
        rating_before, rating_after, factors, reason
      ) values (
        p.id, p.mu, p.sigma, p.mu, v_new_sigma,
        greatest(0, least(7, (p.mu - 2*p.sigma) * 7.0/50.0)),
        greatest(0, least(7, (p.mu - 2*v_new_sigma) * 7.0/50.0)),
        jsonb_build_object('weeksInactive', v_weeks, 'steps', v_steps),
        'inactivity_decay'
      );

      update players set sigma = v_new_sigma where id = p.id;
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

grant execute on function apply_inactivity_decay() to service_role;
grant execute on function player_current_streak(uuid) to service_role;


-- ============================================================
-- Cron-Einrichtung (Supabase: pg_cron)
-- ============================================================
-- select cron.schedule('inactivity-decay', '0 4 * * 1',
--   $$select apply_inactivity_decay()$$);
--
-- Die 48h-Bestätigung braucht danach noch die Rating-Berechnung in TS,
-- deshalb läuft sie besser als Cloudflare Cron Trigger, der
-- auto_confirm_due_matches() aufruft und für jede zurückgegebene ID
-- den Rating-Worker (siehe confirm-worker.ts) ausführt.

-- ========== 0003_external_claims.sql ==========
-- ============================================================
-- PadelIndex — Erweiterung: externe Ranking-Nachweise
-- Ergänzt padelindex_schema.sql, keine Änderung an bestehenden Tabellen
-- außer einem neuen Feld an players für die Anti-Manipulations-Grenze.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Plattform-Skalen: Vertrauensgewicht + Umrechnungstyp
-- ------------------------------------------------------------
create table platform_scale_map (
  platform          text primary key
                     check (platform in
                       ('playtomic','rankedin','padel_bundesliga','club_league','other')),
  scale_type        text not null
                     check (scale_type in
                       ('level_0_7','points_relative','division_tier','elo_like','unknown')),
  -- Wie sehr vertrauen wir dieser Plattform grundsätzlich (0-1),
  -- bevor überhaupt eine einzelne Extraktion bewertet wird
  base_trust_weight numeric(3,2) not null default 0.50,
  notes             text
);

insert into platform_scale_map (platform, scale_type, base_trust_weight, notes) values
  ('playtomic',        'level_0_7',       0.55,
    'Direkt auf 0-7 übertragbar, aber laut Nutzerberichten oft ungenau kalibriert'),
  ('rankedin',          'points_relative', 0.35,
    'Turnierpunkte, kein direktes Skill-Level -> nur grobe Bandzuordnung'),
  ('padel_bundesliga',  'division_tier',   0.60,
    'Liga-Stufe ist ein starkes, aber grob gerastertes Signal'),
  ('club_league',       'elo_like',        0.50,
    'Sehr heterogen, abhängig davon was der Screenshot zeigt'),
  ('other',             'unknown',         0.20, null);

-- ------------------------------------------------------------
-- 2. Externe Ranking-Nachweise (Screenshot + Extraktion + Review)
-- ------------------------------------------------------------
create table external_ranking_claims (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid not null references players(id) on delete cascade,
  platform              text not null references platform_scale_map(platform),
  screenshot_path        text not null,              -- Supabase Storage Pfad, nicht öffentlich
  screenshot_hash        text not null,               -- für Duplikat-Erkennung über Accounts hinweg
  claimed_handle          text not null,               -- vom Spieler selbst eingetippt, vor der Extraktion

  -- Von der Vision-Extraktion befüllt (siehe verification-pipeline.md)
  extracted              jsonb,
  extraction_model       text,                        -- z.B. 'claude-sonnet-5-vision'
  extraction_confidence  numeric(4,3) check (extraction_confidence between 0 and 1),

  -- Von den deterministischen Plausibilitätsregeln befüllt
  plausibility_score     numeric(4,3) check (plausibility_score between 0 and 1),
  plausibility_flags     jsonb default '[]'::jsonb,    -- welche Regeln angeschlagen haben

  status                 text not null default 'pending'
                         check (status in
                           ('pending','auto_verified','needs_review','verified','rejected')),
  reviewed_by            uuid references players(id) on delete set null,
  review_note            text,

  -- Wurde dieser Nachweis tatsächlich in eine Seed-Berechnung einbezogen?
  applied_to_seed        boolean not null default false,

  created_at             timestamptz not null default now(),
  reviewed_at            timestamptz
);

create index on external_ranking_claims (player_id, status);
create index on external_ranking_claims (screenshot_hash);

-- ------------------------------------------------------------
-- 3. Anti-Manipulations-Grenze: Nachweise nur vor echtem Spielbeginn
-- ------------------------------------------------------------
-- players.matches_played existiert bereits im Basisschema.
-- Zusätzliches Flag: sobald ein erster eigener Match-Rating-Vorgang
-- gelaufen ist, werden externe Nachweise für diesen Spieler gesperrt,
-- unabhängig vom exakten matches_played-Wert (robuster als reiner
-- Zahlenvergleich, falls z.B. Korrekturen den Zähler beeinflussen).
alter table players add column if not exists external_seed_locked boolean not null default false;

create or replace function lock_external_seed_after_first_match()
returns trigger
language plpgsql
as $$
begin
  if new.matches_played > 0 and old.matches_played = 0 then
    update players set external_seed_locked = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_external_seed on players;
create trigger trg_lock_external_seed
  after update of matches_played on players
  for each row
  execute function lock_external_seed_after_first_match();

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
alter table external_ranking_claims enable row level security;

-- Eigene Nachweise einsehbar
create policy claims_self_read on external_ranking_claims
  for select using (player_id = auth.uid());

-- Einreichen darf nur der Spieler selbst, nur für sich, nur solange
-- der Seed nicht gesperrt ist (Anwendungslogik prüft das zusätzlich,
-- hier zur Sicherheit auch auf DB-Ebene über eine Check-Funktion)
create policy claims_self_insert on external_ranking_claims
  for insert with check (
    player_id = auth.uid()
    and not exists (
      select 1 from players p where p.id = auth.uid() and p.external_seed_locked
    )
  );

-- Extraktion, Plausibilitätsbewertung und Statuswechsel laufen
-- ausschließlich serverseitig (service_role) — keine Update-Policy
-- für authenticated Nutzer.

-- Vereins-Admins dürfen needs_review-Fälle ihrer Mitglieder sehen und entscheiden
create policy claims_club_admin_review on external_ranking_claims
  for select using (
    exists (
      select 1
      from club_memberships admin_m
      join club_memberships player_m on player_m.club_id = admin_m.club_id
      where admin_m.player_id = auth.uid()
        and admin_m.role = 'admin'
        and player_m.player_id = external_ranking_claims.player_id
    )
  );

-- ========== 0004_waitlist_anon_insert.sql ==========
-- Waitlist: Insert über die Publishable/Anon-Key, ohne service_role.
-- Kein SELECT für anon — Duplikate laufen als unique-violation ins API.

create policy waitlist_anon_insert on waitlist
  for insert
  to anon
  with check (true);

grant insert on table waitlist to anon;
