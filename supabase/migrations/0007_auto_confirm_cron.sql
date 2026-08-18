-- ============================================================
-- PadelIndex — 48h-Auto-Bestätigung: Voraussetzungen für pg_cron + pg_net
-- ============================================================
-- Cloudflare Cron Triggers lassen sich mit @sveltejs/adapter-cloudflare
-- nicht sauber verdrahten: der Adapter überschreibt bei jedem Build
-- unconditional die Datei, auf die wrangler.toml `main` zeigt, mit seinem
-- eigenen generierten Worker (nur fetch(), kein scheduled()) — ein
-- eigener Worker-Wrapper mit scheduled() wird also bei jedem Deploy
-- wieder platt gemacht.
--
-- Stattdessen übernimmt Supabase selbst den Zeitplan: pg_cron feuert
-- alle 15 Minuten einen asynchronen HTTP-POST (pg_net) auf
-- /api/cron/confirm-matches, das dieselbe runConfirmCron()-Logik aufruft
-- (siehe rating/confirm.ts), die auch für die manuelle Bestätigung durch
-- den Gegner läuft.
--
-- Nur die Extensions gehören in die versionierte Migration. Der eigentliche
-- cron.schedule()-Aufruf enthält den Bearer-Token für /api/cron/confirm-
-- matches im Klartext (cron.job.command) und wird deshalb NICHT hier
-- eingecheckt, sondern separat direkt im SQL Editor ausgeführt — gleiches
-- Muster wie das SMTP-Passwort, nie im Repo.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
