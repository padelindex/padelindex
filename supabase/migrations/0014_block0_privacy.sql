-- ============================================================
-- PadelIndex — Block 0 (Website-Audit): Widerruf ohne Login,
-- ausdrückliche Zustimmung zum vollen Namen
-- ============================================================

-- ------------------------------------------------------------
-- 1. Widerruf ohne Login (0.3)
-- ------------------------------------------------------------
-- Jedes öffentliche Profil braucht einen Weg, sich ohne Konto und ohne
-- Umweg aus der Rangliste zu nehmen. Unbeanspruchte, importierte Profile
-- haben keine hinterlegte E-Mail-Adresse — ein Abgleich "gehört diese
-- Adresse wirklich zu diesem Profil" ist technisch nicht möglich. Die
-- Hürde ist bewusst der Klick auf den Bestätigungslink, kein
-- Identitätsnachweis (siehe Auftrag: "kein Login, kein Umweg").
-- Wie profile_claims: max. eine offene Anfrage pro Profil gleichzeitig,
-- kein Direktzugriff für anon/authenticated.

create table if not exists delisting_requests (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  email         text not null,
  token_hash    text not null unique,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '48 hours'),
  confirmed_at  timestamptz,
  constraint delisting_requests_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create unique index if not exists delisting_requests_one_pending_idx
  on delisting_requests (player_id) where confirmed_at is null;
create index if not exists delisting_requests_token_idx on delisting_requests (token_hash);

alter table delisting_requests enable row level security;
-- Keine Policy für anon/authenticated: läuft ausschließlich über
-- service_role, wie profile_claims.

-- ------------------------------------------------------------
-- 2. Ausdrückliche Zustimmung zum vollen Namen (0.5)
-- ------------------------------------------------------------
-- Bisher: beanspruchtes Profil -> voller Name automatisch. Jetzt: voller
-- Name nur, wenn zusätzlich aktiv zugestimmt wurde. Option A (Entscheidung
-- vom 19.08.): alle starten bei false, auch bereits beanspruchte Profile
-- fallen erstmal auf Initialen zurück, bis sie aktiv zustimmen.

alter table players add column if not exists show_full_name boolean not null default false;

-- players_self_update (0005) erlaubt per RLS bereits das Ändern der
-- eigenen Zeile — column-level GRANTs (siehe 0010_player_profile.sql)
-- schränken das zusätzlich auf einzelne Spalten ein, show_full_name muss
-- deshalb hier separat freigegeben werden.
grant update (show_full_name) on table players to authenticated;

create or replace function public_display_name(p_name text, p_claim_status text, p_show_full_name boolean)
returns text
language sql
immutable
as $$
  select case
    when p_claim_status = 'claimed' and p_show_full_name then p_name
    when p_name is null or position(' ' in trim(p_name)) = 0 then p_name
    else split_part(trim(p_name), ' ', 1) || ' ' ||
         left(split_part(trim(p_name), ' ', 2), 1) || '.'
  end
$$;

create or replace view club_leaderboard
with (security_invoker = false) as
select
  c.id           as club_id,
  c.slug         as club_slug,
  c.name         as club_name,
  c.license_tier,
  c.accent,
  p.id           as player_id,
  p.handle,
  public_display_name(p.display_name, p.claim_status, p.show_full_name) as name,
  (p.claim_status = 'claimed')                        as claimed,
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

-- Alte 2-Parameter-Signatur ist jetzt tot (CREATE OR REPLACE legt bei
-- geänderter Signatur eine zusätzliche Funktion an, ersetzt die alte
-- nicht) — jetzt, nachdem die View umgehängt ist, gefahrlos aufräumbar.
drop function if exists public_display_name(text, text);

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop table if exists delisting_requests;
-- alter table players drop column if exists show_full_name;
-- (public_display_name/club_leaderboard müssten dann auf die alte
--  2-Parameter-Form zurückgebaut werden)
-- ------------------------------------------------------------
