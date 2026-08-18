-- ============================================================
-- PadelIndex — Minimaler Vereins-Admin: wer darf Prämien pflegen?
-- ============================================================
-- Bisher trug jeden Prämien-Eintrag ich per SQL Editor ein. Diese
-- Migration fügt nur die Autorisierung hinzu ("ist Spieler X Admin von
-- Verein Y?") — die Schreibzugriffe selbst laufen wie überall in diesem
-- Schema über service_role aus SvelteKit, nicht über RLS-INSERT-Policies
-- (siehe rewards.ts: die Prüfung "ist wirklich Admin dieses Vereins"
-- gehört in TypeScript, nicht in eine Policy-Expression).
--
-- Bewusst an players statt an auth.users gehängt: ein Admin ist damit
-- automatisch ein ganz normaler Spieler-Login (bestehender Magic-Link-
-- Flow über /anmelden, kein separates Identitätssystem für "Leute ohne
-- Spielerprofil"). Für den Pilotverein macht das niemandem Probleme —
-- wer den Prämienkatalog pflegt, spielt in der Praxis auch mit.

create table club_admins (
  club_id     uuid not null references clubs(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (club_id, player_id)
);

alter table club_admins enable row level security;

-- Nur "bin ich selbst Admin von irgendeinem Verein" muss lesbar sein
-- (um den "Vereins-Admin"-Link auf /konto zu zeigen) — nicht, wer sonst
-- noch Admin ist.
create policy club_admins_self_read on club_admins
  for select using (player_id = current_player_id());

grant select on table club_admins to authenticated;
