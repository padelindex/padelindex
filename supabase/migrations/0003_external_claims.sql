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
