-- ============================================================
-- PadelIndex — Dokumentation der status-Spalten im Liga-Modul
-- ============================================================
-- Auslöser: beim Start einer neuen Bávaro-Saison per Hand-SQL im Supabase
-- SQL Editor (so beschrieben oben in import-bavaro-league.ts) flog
-- "league_seasons" violates check constraint "league_seasons_status_check".
-- Ursache: leagues.status erlaubt ('draft', 'active', 'archived'),
-- league_seasons.status und league_cycles.status aber ('planned',
-- 'running', 'completed') — drei gleich benannte, benachbarte
-- status-Spalten mit UNTERSCHIEDLICHEM Vokabular. 'active' passt nur auf
-- leagues, nicht auf Saison/Zyklus, das verwechselt sich leicht.
--
-- Column comments statt eines Codefixes: der App-Code hat den Bug nicht
-- (createCycle() in league-admin.ts schreibt immer 'running', nie
-- nutzergesteuert) — der Fehler entsteht ausschließlich bei Hand-SQL
-- oder im Supabase Table Editor. Comments erscheinen dort als Tooltip
-- bzw. in psql \d+ und dokumentieren die erlaubten Werte genau dort, wo
-- der Fehler passiert.

comment on column leagues.status is
  'draft | active | archived — NICHT dasselbe Vokabular wie league_seasons.status / league_cycles.status.';

comment on column league_seasons.status is
  'planned | running | completed — nicht "active" (das ist leagues.status). '
  'Neue Saison/Zyklus anlegen: über die Admin-UI (/liga/[slug]/verwaltung/zyklen/neu) '
  'oder mit status = ''running'', nie ''active''.';

comment on column league_cycles.status is
  'planned | running | completed — nicht "active" (das ist leagues.status).';
