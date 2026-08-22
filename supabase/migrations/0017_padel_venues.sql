-- ============================================================
-- PadelIndex — Anlagen-Verzeichnis (Deutschlandkarte)
-- ============================================================
-- Ein Verzeichnis ALLER Padel-Anlagen in Deutschland, unabhängig davon,
-- ob sie PadelIndex nutzen. Grundlage für /karte.
--
-- WARUM EINE EIGENE TABELLE UND NICHT clubs:
-- An clubs hängen Mitgliedschaften, Ranglisten, /c/[slug]-Seiten, die
-- Sitemap, Matchmaking und seit 0016 die Ligen. Eine fremde Anlage dort
-- einzutragen würde in all diesen Abfragen als "Verein ohne Mitglieder"
-- auftauchen und z. B. leere öffentliche Vereinsseiten erzeugen.
-- padel_venues ist deshalb ein reines Adressverzeichnis; clubs bleibt
-- der zahlende/aktive Mandant.
--
-- PARTNER-STATUS IST ABGELEITET, KEIN FLAG:
-- Eine Anlage ist genau dann Partner, wenn club_id gesetzt ist. Ein
-- zusätzliches boolean könnte gegenüber der Verknüpfung driften — es
-- gäbe dann zwei Wahrheiten über denselben Sachverhalt.
--
-- KOORDINATEN SIND OPTIONAL:
-- Ein Import (OSM, CSV) liefert nicht für jede Anlage brauchbare
-- Koordinaten. Statt solche Zeilen zu verwerfen oder Koordinaten zu
-- schätzen, werden sie gespeichert und erscheinen nur nicht auf der
-- Karte — /karte weist die Zahl der nicht verorteten Anlagen offen aus,
-- statt eine Vollständigkeit vorzutäuschen.

create table if not exists padel_venues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  city         text,
  postal_code  text,
  address      text,
  website      text,
  latitude     numeric check (latitude between -90 and 90),
  longitude    numeric check (longitude between -180 and 180),

  -- Gesetzt = diese Anlage nutzt PadelIndex. on delete set null: wenn ein
  -- Verein die Plattform verlässt, bleibt die Anlage im Verzeichnis
  -- stehen und wird schlicht wieder als Nicht-Partner geführt.
  club_id      uuid references clubs(id) on delete set null,

  -- Herkunft, damit ein erneuter Import dieselbe Zeile trifft statt
  -- Dubletten anzulegen (siehe unique index unten).
  source       text not null default 'manual'
                 check (source in ('manual', 'osm', 'import')),
  source_ref   text,

  -- Von Hand gepflegte Einträge sollen ein Re-Import nicht überschreiben.
  locked       boolean not null default false,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Entweder beides oder keins — eine halbe Koordinate ist auf einer
  -- Karte schlimmer als gar keine.
  constraint padel_venues_coords_complete
    check ((latitude is null) = (longitude is null))
);

-- Idempotenter Import: (source, source_ref) ist eindeutig, sofern eine
-- Referenz vorliegt. Manuelle Einträge ohne Referenz bleiben davon
-- unberührt.
create unique index if not exists padel_venues_source_ref_idx
  on padel_venues (source, source_ref)
  where source_ref is not null;

create index if not exists padel_venues_city_idx on padel_venues (city);
create index if not exists padel_venues_club_idx on padel_venues (club_id)
  where club_id is not null;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
-- Öffentlich lesbar (das ist der Zweck), Schreibzugriff ausschließlich
-- über service_role aus SvelteKit bzw. das Import-Skript — gleiches
-- Muster wie clubs (0001) und die league_*-Tabellen (0016).
alter table padel_venues enable row level security;

drop policy if exists padel_venues_public_read on padel_venues;
create policy padel_venues_public_read on padel_venues
  for select using (true);

grant select on table padel_venues to anon, authenticated;

-- ------------------------------------------------------------
-- updated_at pflegen
-- ------------------------------------------------------------
create or replace function touch_padel_venues_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists padel_venues_touch_updated_at on padel_venues;
create trigger padel_venues_touch_updated_at
  before update on padel_venues
  for each row execute function touch_padel_venues_updated_at();

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop trigger if exists padel_venues_touch_updated_at on padel_venues;
-- drop function if exists touch_padel_venues_updated_at();
-- drop table if exists padel_venues;
-- (clubs bleibt unberührt — das Verzeichnis zeigt nur darauf.)
-- ------------------------------------------------------------
