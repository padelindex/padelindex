-- ============================================================
-- PadelIndex — Padel Roulette
-- ============================================================
-- Portiert von sportcenter-hahn.de: ein Verein legt feste Termine an
-- ("Slots"), Spieler committen sich mit einem Klick dazu — bei genau
-- vier Zusagen findet das Match statt. Auf PadelIndex mit echten
-- Konten statt Vorname+Kontakt, und ein vollgelaufener Slot wird zu
-- einem ganz normalen, gewerteten Match über den bestehenden
-- create_match_report()-Weg (siehe 0006) — kein eigener Rating-Pfad,
-- keine Änderung am Rating-Modell.
--
-- WARUM VEREINSMITGLIEDSCHAFT PFLICHT IST:
-- create_match_report() verlangt, dass alle vier Spieler Mitglied des
-- meldenden Vereins sind (0006, Kader aus loadClubRoster()). Ein Slot,
-- an dem ein Nicht-Mitglied teilnimmt, ließe sich später nie als Match
-- melden — deshalb prüft roulette_join() das schon beim Beitritt.
--
-- WARUM EINE SQL-FUNKTION FÜR DEN BEITRITT:
-- "Zähl aktuelle Zusagen, wenn <4 dann einfügen" ist über den
-- Supabase-JS-Client nicht atomar — zwei gleichzeitige Beitritte
-- könnten beide die Vier-Prüfung bestehen. Gleiches Muster wie
-- create_match_report() in 0006 und padel_beitreten() im
-- Schwester-Projekt.
--
-- WARUM KEINE PRIVATE KONTAKT-TABELLE (anders als das Original):
-- Dort war Vorname+Kontakt nötig, weil es keine Konten gab. Hier ist
-- jeder Teilnehmer ein echtes PadelIndex-Profil — Name/Handle/Rating
-- sind ohnehin schon über /p/[handle] öffentlich.

create table if not exists roulette_slots (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references clubs(id) on delete cascade,
  created_by   uuid references players(id) on delete set null,
  starts_at    timestamptz not null,
  duration_min smallint not null default 90 check (duration_min between 30 and 240),
  court        text check (char_length(court) <= 40),
  info         text check (char_length(info) <= 160),
  cancelled    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists roulette_slots_club_idx on roulette_slots (club_id, starts_at);

create table if not exists roulette_signups (
  id         uuid primary key default gen_random_uuid(),
  slot_id    uuid not null references roulette_slots(id) on delete cascade,
  player_id  uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (slot_id, player_id)
);

create index if not exists roulette_signups_slot_idx on roulette_signups (slot_id);
create index if not exists roulette_signups_player_idx on roulette_signups (player_id);

-- ------------------------------------------------------------
-- RLS: öffentlich lesbar (das ist der Zweck), Schreiben ausschließlich
-- über service_role aus SvelteKit — gleiches Muster wie matches.ts
-- ("Schreiben läuft bewusst über service_role statt über
-- RLS-INSERT-Policies").
-- ------------------------------------------------------------
alter table roulette_slots enable row level security;
alter table roulette_signups enable row level security;

drop policy if exists roulette_slots_read on roulette_slots;
create policy roulette_slots_read on roulette_slots for select using (true);

drop policy if exists roulette_signups_read on roulette_signups;
create policy roulette_signups_read on roulette_signups for select using (true);

grant select on table roulette_slots to anon, authenticated;
grant select on table roulette_signups to anon, authenticated;

-- ------------------------------------------------------------
-- Atomarer Beitritt
-- ------------------------------------------------------------
create or replace function roulette_join(p_slot uuid, p_player uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club  uuid;
  v_count int;
begin
  select club_id into v_club
    from roulette_slots
   where id = p_slot and cancelled = false and starts_at > now()
   for update;

  if v_club is null then
    raise exception 'WEG';
  end if;

  if not exists (
    select 1 from club_memberships where club_id = v_club and player_id = p_player
  ) then
    raise exception 'KEIN_MITGLIED';
  end if;

  -- Wer schon zugesagt hat, bekommt hier still Erfolg statt VOLL — sonst
  -- würde ein Doppelklick auf "Ich bin dabei" bei einem inzwischen vollen
  -- Slot der eigenen, längst gespeicherten Zusage widersprechen.
  if exists (select 1 from roulette_signups where slot_id = p_slot and player_id = p_player) then
    return;
  end if;

  select count(*) into v_count from roulette_signups where slot_id = p_slot;
  if v_count >= 4 then
    raise exception 'VOLL';
  end if;

  insert into roulette_signups (slot_id, player_id) values (p_slot, p_player);
end;
$$;

revoke all on function roulette_join(uuid, uuid) from public;
grant execute on function roulette_join(uuid, uuid) to service_role;

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop function if exists roulette_join(uuid, uuid);
-- drop table if exists roulette_signups;
-- drop table if exists roulette_slots;
-- ------------------------------------------------------------
