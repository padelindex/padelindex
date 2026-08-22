-- ============================================================
-- PadelIndex — beanspruchbare Profile
-- ============================================================
-- Bisher galt players.id = auth.users.id. Damit konnte ein Profil nur
-- existieren, wenn sich jemand registriert hat. Für importierte Ligadaten
-- brauchen wir das Gegenteil: Profile existieren zuerst, ein echter Spieler
-- beansprucht sie später und legt KEIN zweites Profil an.
--
-- Ab hier:
--   players.id       = eigene Identität, unabhängig von Auth
--   players.user_id  = null -> unbeansprucht, gesetzt -> beansprucht
--
-- Datenschutz: importierte Klarnamen sind nicht öffentlich lesbar.
-- anon sieht ausschließlich die View club_leaderboard, dort steht bei
-- unbeanspruchten Profilen nur "Vorname N." und ein anonymes Handle.

-- ------------------------------------------------------------
-- 1. players von auth.users entkoppeln
-- ------------------------------------------------------------
alter table players drop constraint if exists players_id_fkey;
alter table players alter column id set default gen_random_uuid();

alter table players add column if not exists user_id uuid unique references auth.users(id) on delete set null;

alter table players add column if not exists claim_status text not null default 'unclaimed'
  check (claim_status in ('unclaimed', 'pending', 'claimed'));

alter table players add column if not exists origin text not null default 'signup'
  check (origin in ('signup', 'league_import'));

alter table players add column if not exists claimed_at timestamptz;

-- Bestandszeilen (falls vorhanden) sind selbst registrierte Nutzer
update players set user_id = id, claim_status = 'claimed', origin = 'signup'
  where user_id is null and claim_status = 'unclaimed'
    and exists (select 1 from auth.users u where u.id = players.id);

create index if not exists players_claim_status_idx on players (claim_status);

-- ------------------------------------------------------------
-- 2. Auth-Identität -> Spielerzeile
-- ------------------------------------------------------------
-- Alle Policies vergleichen ab jetzt gegen diese Funktion statt gegen
-- auth.uid(), weil players.id nicht mehr die Auth-ID ist.
create or replace function current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from players where user_id = auth.uid()
$$;

-- ------------------------------------------------------------
-- 3. Öffentlicher Anzeigename
-- ------------------------------------------------------------
-- Unbeansprucht -> "Robin K.". Erst wenn ein echter Mensch das Profil
-- beansprucht hat, entscheidet er selbst über den vollen Namen.
create or replace function public_display_name(p_name text, p_claim_status text)
returns text
language sql
immutable
as $$
  select case
    when p_claim_status = 'claimed' then p_name
    when p_name is null or position(' ' in trim(p_name)) = 0 then p_name
    else split_part(trim(p_name), ' ', 1) || ' ' ||
         left(split_part(trim(p_name), ' ', 2), 1) || '.'
  end
$$;

-- ------------------------------------------------------------
-- 4. Claims: Profil beanspruchen
-- ------------------------------------------------------------
-- Ablauf: Spieler tippt seinen Namen + E-Mail -> Server findet das
-- unbeanspruchte Profil -> pending Claim -> Magic Link -> beim ersten
-- Login löst handle_new_user() den Claim ein und verknüpft das
-- BESTEHENDE Profil, statt ein neues anzulegen.
create table if not exists profile_claims (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references players(id) on delete cascade,
  email           text not null,
  requested_name  text not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '7 days'),
  resolved_at     timestamptz,
  constraint profile_claims_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Pro Profil nur ein offener Claim gleichzeitig
create unique index if not exists profile_claims_one_pending_idx
  on profile_claims (player_id) where status = 'pending';
create index if not exists profile_claims_email_idx on profile_claims (lower(email), status);

alter table profile_claims enable row level security;
-- Keine Policy für anon/authenticated: Claims laufen ausschließlich
-- serverseitig über service_role.

-- ------------------------------------------------------------
-- 5. Signup: Claim einlösen statt zweites Profil anlegen
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim_id   uuid;
  v_player_id  uuid;
  v_linked     int;
  v_name       text;
  v_handle     text;
begin
  -- 1. Offenen Claim für diese E-Mail suchen
  select pc.id, pc.player_id
    into v_claim_id, v_player_id
    from profile_claims pc
   where lower(pc.email) = lower(new.email)
     and pc.status = 'pending'
     and pc.expires_at > now()
   order by pc.created_at desc
   limit 1;

  if v_claim_id is not null then
    update players
       set user_id      = new.id,
           claim_status = 'claimed',
           claimed_at   = now()
     where id = v_player_id
       and user_id is null;

    get diagnostics v_linked = row_count;

    if v_linked = 1 then
      update profile_claims
         set status = 'approved', resolved_at = now()
       where id = v_claim_id;
      return new;
    end if;

    -- Profil war schon vergeben -> Claim entwerten, normal weitermachen
    update profile_claims
       set status = 'rejected', resolved_at = now()
     where id = v_claim_id;
  end if;

  -- 2. Kein Claim: frisches Profil wie bisher
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1),
    'Spieler'
  );
  v_handle := trim(both '-' from lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')));
  if v_handle is null or v_handle = '' then
    v_handle := 'player';
  end if;
  if exists (select 1 from players where handle = v_handle) then
    v_handle := v_handle || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into players (user_id, display_name, handle, claim_status, origin)
  values (new.id, v_name, v_handle, 'claimed', 'signup');

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 6. RLS auf die neue Identität umstellen
-- ------------------------------------------------------------
drop policy if exists players_self_select on players;
create policy players_self_select on players
  for select using (user_id = auth.uid());

drop policy if exists players_self_update on players;
create policy players_self_update on players
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- players_public_read aus 0001 entfällt: sonst wären alle importierten
-- Klarnamen über die Tabelle direkt abfragbar.
drop policy if exists players_public_read on players;

-- Die Policies aus 0001 fragten match_participants aus einer Policy AUF
-- match_participants heraus ab — das ist Endlosrekursion, sobald die
-- Tabelle Zeilen hat (vorher nie aufgefallen, weil es keine Matches gab).
-- security definer umgeht RLS innerhalb der Prüfung und bricht den Zyklus.
create or replace function plays_in_match(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from match_participants mp
    where mp.match_id = p_match_id
      and mp.player_id = current_player_id()
  )
$$;

drop policy if exists matches_participant_read on matches;
create policy matches_participant_read on matches
  for select using (plays_in_match(id));

drop policy if exists match_participants_self_read on match_participants;
create policy match_participants_self_read on match_participants
  for select using (plays_in_match(match_id));

drop policy if exists match_sets_participant_read on match_sets;
create policy match_sets_participant_read on match_sets
  for select using (plays_in_match(match_id));

drop policy if exists rating_history_public_or_self on rating_history;
create policy rating_history_self_read on rating_history
  for select using (player_id = current_player_id());

drop policy if exists token_transactions_self_read on token_transactions;
create policy token_transactions_self_read on token_transactions
  for select using (player_id = current_player_id());

-- Claims aus 0003 hängen ebenfalls an der alten Identität
drop policy if exists claims_self_read on external_ranking_claims;
create policy claims_self_read on external_ranking_claims
  for select using (player_id = current_player_id());

drop policy if exists claims_self_insert on external_ranking_claims;
create policy claims_self_insert on external_ranking_claims
  for insert with check (
    player_id = current_player_id()
    and not exists (
      select 1 from players p where p.id = current_player_id() and p.external_seed_locked
    )
  );

drop policy if exists claims_club_admin_review on external_ranking_claims;
create policy claims_club_admin_review on external_ranking_claims
  for select using (
    exists (
      select 1
      from club_memberships admin_m
      join club_memberships player_m on player_m.club_id = admin_m.club_id
      where admin_m.player_id = current_player_id()
        and admin_m.role = 'admin'
        and player_m.player_id = external_ranking_claims.player_id
    )
  );

-- ------------------------------------------------------------
-- 7. Öffentliche Sicht: nur die kuratierte Projektion
-- ------------------------------------------------------------
-- anon verliert den Direktzugriff auf players. Die View läuft deshalb
-- bewusst als security definer (nicht invoker) und filtert selbst.
revoke select on table players from anon;

drop view if exists club_leaderboard;
create view club_leaderboard
with (security_invoker = false) as
select
  c.id           as club_id,
  c.slug         as club_slug,
  c.name         as club_name,
  c.license_tier,
  c.accent,
  p.id           as player_id,
  p.handle,
  public_display_name(p.display_name, p.claim_status) as name,
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
