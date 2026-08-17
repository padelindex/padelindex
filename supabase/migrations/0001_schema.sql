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
