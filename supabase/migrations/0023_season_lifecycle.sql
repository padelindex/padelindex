-- ============================================================
-- PadelIndex — Liga-Modul: Saison-Lebenszyklus
-- ============================================================
-- Trennt Saison und Zyklus strikter, wie in 0016 angelegt, aber mit dem
-- Wortschatz, den der neue Saison-Assistent im Vereinsadmin-Dashboard
-- braucht:
--   * league_seasons.status: draft -> active -> archived (statt
--     planned/running/completed) — "draft" trifft die Setup-Phase des
--     Assistenten besser (Teilnehmer wählen, Boxen vorschlagen, noch
--     nichts Öffentliches), "archived" macht deutlicher als
--     "completed", dass die Daten bewusst aus dem aktiven Dashboard
--     verschwinden, aber für die Historie erhalten bleiben.
--   * league_seasons.planned_cycles: reiner Anzeige-/Planungswert
--     ("Zyklus 2 von 6"), erzwingt nichts — die tatsächliche Anzahl
--     Zyklen ergibt sich weiterhin aus den angelegten league_cycles.
--   * höchstens eine aktive Saison je Liga (partial unique index) —
--     der Assistent archiviert die alte Saison, BEVOR er die neue
--     anlegt (siehe league.ts createSeason()), aber die DB soll das
--     auch garantieren, falls doch mal zwei Wege gleichzeitig
--     schreiben.
--   * league_registrations.status bekommt 'paused' dazu — "pausiert
--     für die laufende Saison", ausdrücklich etwas anderes als 'left'
--     (das heißt: verlässt die Liga ganz, siehe departLeagueMember).
--
-- league_cycles.status (planned/running/completed) bleibt UNVERÄNDERT:
-- "planned" ist bereits genau der Zwischenzustand, den die neuen
-- Assistenten brauchen — Boxen existieren, sind aber noch nicht
-- öffentlich/aktuell (loadCurrentCycle() zeigt ohnehin nur running/
-- completed an, siehe league.ts), bis eine "Zyklus veröffentlichen"-
-- Aktion sie auf 'running' setzt.

-- ------------------------------------------------------------
-- 1. league_seasons: Status umbenennen + Planungsfeld
-- ------------------------------------------------------------
alter table league_seasons drop constraint if exists league_seasons_status_check;

update league_seasons set status = case status
  when 'planned' then 'draft'
  when 'running' then 'active'
  when 'completed' then 'archived'
  else status
end
where status in ('planned', 'running', 'completed');

alter table league_seasons
  alter column status set default 'draft',
  add constraint league_seasons_status_check
    check (status in ('draft', 'active', 'archived'));

alter table league_seasons
  add column if not exists planned_cycles smallint
    check (planned_cycles is null or planned_cycles >= 1);

-- In echten Daten können mehrere Saisons je Liga als 'running' (jetzt
-- 'active') dastehen: die alte "Neuen Zyklus anlegen"-Form legte bei
-- jedem neuen Saisonnamen sofort eine 'running'-Saison an, ohne die
-- vorige zu schließen — genau das Problem, das dieses Modul jetzt löst.
-- Vor dem Unique-Index deshalb je Liga alle "aktiven" Saisons bis auf
-- die zuletzt angelegte automatisch archivieren. Das ist ein Best-Guess
-- (zuletzt angelegt = wahrscheinlich die tatsächlich aktuelle) — nach
-- der Migration einmal per
--   select id, name, status from league_seasons where league_id = '…';
-- prüfen, ob wirklich die richtige Saison aktiv geblieben ist, und bei
-- Bedarf manuell mit einem update auf 'active'/'archived' korrigieren.
with ranked as (
  select id, league_id,
         row_number() over (partition by league_id order by created_at desc) as rn
  from league_seasons
  where status = 'active'
)
update league_seasons
set status = 'archived'
where id in (select id from ranked where rn > 1);

-- Höchstens eine aktive Saison je Liga.
create unique index if not exists league_seasons_one_active_idx
  on league_seasons (league_id) where status = 'active';

-- ------------------------------------------------------------
-- 2. league_registrations: 'paused' als eigener Status
-- ------------------------------------------------------------
alter table league_registrations drop constraint if exists league_registrations_status_check;
alter table league_registrations
  add constraint league_registrations_status_check
    check (status in ('active', 'waitlist', 'substitute', 'paused', 'left'));

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- alter table league_registrations drop constraint league_registrations_status_check;
-- update league_registrations set status = 'active' where status = 'paused';
-- alter table league_registrations add constraint league_registrations_status_check
--   check (status in ('active', 'waitlist', 'substitute', 'left'));
-- drop index if exists league_seasons_one_active_idx;
-- alter table league_seasons drop column if exists planned_cycles;
-- alter table league_seasons drop constraint league_seasons_status_check;
-- update league_seasons set status = case status
--   when 'draft' then 'planned' when 'active' then 'running'
--   when 'archived' then 'completed' else status end;
-- alter table league_seasons alter column status set default 'planned';
-- alter table league_seasons add constraint league_seasons_status_check
--   check (status in ('planned', 'running', 'completed'));
-- ------------------------------------------------------------
