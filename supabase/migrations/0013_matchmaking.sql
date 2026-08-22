-- ============================================================
-- PadelIndex — Matchmaking, Spielanfragen, Challenges
-- ============================================================
-- Vier neue Bereiche, die aufeinander aufbauen:
--   1. player_availabilities — wann/wo/wie will jemand spielen
--   2. play_requests         — konkrete Anfrage an einen Mitspieler
--   3. challenges            — Herausforderung höher platzierter Spieler
--   4. notifications         — In-App-Benachrichtigungen (E-Mail läuft
--      weiterhin über lib/server/email.ts, siehe 2d3287c)
--
-- ANNAHME 1 — "Rangliste" = Verein.
-- Die einzige Rangliste der App ist club_leaderboard (0005), sortiert nach
-- rating desc. challenges.club_id ist deshalb die "leaderboardId" aus der
-- Anforderung; ein Rang existiert nur INNERHALB eines Vereins.
--
-- ANNAHME 2 — Ränge werden nicht gespeichert, sondern abgeleitet.
-- rating ist eine generated column (0001); der Rang ist reine Sortierung.
-- challenger_rank_at_creation/challenged_rank_at_creation sind bewusst nur
-- Schnappschüsse fürs Protokoll ("war damals erlaubt"), nie die Wahrheit.
--
-- ANNAHME 3 — Challenge != automatischer Match.
-- Padel ist Doppel; create_match_report() (0006/0011) braucht vier Spieler.
-- Eine angenommene Challenge erzeugt deshalb KEINEN Match, sondern nur die
-- Verabredung. Gespielt wird normal als Doppel mit
-- match_type='padelindex_challenge' (existiert seit 0011), danach wird der
-- Match über challenges.result_match_id zurückverknüpft. Das Rating bleibt
-- damit vollständig in der bestehenden Logik (apply_match_rating, 0002) —
-- eine Challenge verschafft nur Zugang zu stärkeren Gegnern, sie tauscht
-- niemals Plätze.

-- ------------------------------------------------------------
-- 0. Geodaten für Entfernungs-Matching
-- ------------------------------------------------------------
-- Bisher gibt es NIRGENDS Koordinaten (players.city ist Freitext). Die
-- Spalten werden hier angelegt, bleiben aber vorerst leer — das Scoring in
-- lib/matchmaking.ts fällt deshalb sauber auf Club-Zugehörigkeit zurück,
-- statt eine Genauigkeit vorzutäuschen, die es nicht gibt.
alter table clubs
  add column latitude  numeric check (latitude between -90 and 90),
  add column longitude numeric check (longitude between -180 and 180);

-- ------------------------------------------------------------
-- 1. Freie Spielzeiten
-- ------------------------------------------------------------
create table player_availabilities (
  id               uuid primary key default gen_random_uuid(),
  player_id        uuid not null references players(id) on delete cascade,
  -- Entweder wiederkehrend (weekday gesetzt) oder einmalig (specific_date
  -- gesetzt) — der CHECK unten erzwingt genau eines von beiden.
  weekday          smallint check (weekday between 0 and 6),
  specific_date    date,
  start_time       time not null,
  end_time         time not null,
  is_recurring     boolean not null default true,
  club_id          uuid references clubs(id) on delete set null,
  max_distance_km  int not null default 25 check (max_distance_km between 0 and 500),
  match_type       text not null default 'friendly'
                     check (match_type in ('friendly', 'competitive', 'training', 'tournament_prep')),
  preferred_format text not null default 'open'
                     check (preferred_format in ('doubles', 'mixed', 'open')),
  desired_level    text not null default 'any'
                     check (desired_level in ('similar', 'slightly_stronger', 'much_stronger', 'any')),
  status           text not null default 'active'
                     check (status in ('active', 'paused', 'deleted')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint availability_end_after_start check (end_time > start_time),
  -- Genau eine Zeitangabe: wiederkehrend braucht weekday, einmalig ein Datum.
  constraint availability_when_exactly_one check (
    (is_recurring and weekday is not null and specific_date is null)
    or (not is_recurring and specific_date is not null)
  )
);

-- Der Matchmaking-Query filtert immer auf status='active'; Teilindex hält
-- ihn klein, gelöschte/pausierte Zeilen liegen gar nicht erst drin.
create index availabilities_active_idx
  on player_availabilities (weekday, start_time) where status = 'active';
create index availabilities_player_idx on player_availabilities (player_id, status);
create index availabilities_club_idx on player_availabilities (club_id) where status = 'active';

-- ------------------------------------------------------------
-- 2. Spielanfragen
-- ------------------------------------------------------------
create table play_requests (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid not null references players(id) on delete cascade,
  receiver_id     uuid not null references players(id) on delete cascade,
  availability_id uuid references player_availabilities(id) on delete set null,
  proposed_date   date not null,
  proposed_start  time not null,
  proposed_end    time not null,
  club_id         uuid references clubs(id) on delete set null,
  location_text   text,
  match_type      text not null default 'friendly'
                    check (match_type in ('friendly', 'competitive', 'training', 'tournament_prep')),
  message         text,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  expires_at      timestamptz not null default (now() + interval '7 days'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint play_request_not_self check (sender_id <> receiver_id),
  constraint play_request_end_after_start check (proposed_end > proposed_start)
);

create index play_requests_receiver_idx on play_requests (receiver_id, status, created_at desc);
create index play_requests_sender_idx on play_requests (sender_id, status, created_at desc);
-- Für den Expiry-Lauf: nur offene Anfragen sind je Kandidat.
create index play_requests_expiry_idx on play_requests (expires_at) where status = 'pending';

-- Gegen Spam/Doppelklick: nur EINE offene Anfrage je Richtung und Paar.
create unique index play_requests_one_open_idx
  on play_requests (sender_id, receiver_id) where status = 'pending';

-- ------------------------------------------------------------
-- 3. Challenges
-- ------------------------------------------------------------
create table challenges (
  id                          uuid primary key default gen_random_uuid(),
  challenger_id               uuid not null references players(id) on delete cascade,
  challenged_player_id        uuid not null references players(id) on delete cascade,
  club_id                     uuid not null references clubs(id) on delete cascade,
  challenger_rank_at_creation int not null check (challenger_rank_at_creation > 0),
  challenged_rank_at_creation int not null check (challenged_rank_at_creation > 0),
  proposed_time_slots         jsonb not null default '[]'::jsonb,
  selected_time_slot          jsonb,
  message                     text,
  status                      text not null default 'pending'
                                check (status in ('pending', 'accepted', 'declined',
                                                  'cancelled', 'expired', 'completed')),
  expires_at                  timestamptz not null default (now() + interval '7 days'),
  result_match_id             uuid references matches(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint challenge_not_self check (challenger_id <> challenged_player_id),
  -- Herausgefordert wird immer nach OBEN: kleinerer Rang = besser platziert.
  constraint challenge_target_is_above check (challenged_rank_at_creation < challenger_rank_at_creation)
);

create index challenges_challenged_idx on challenges (challenged_player_id, status, created_at desc);
create index challenges_challenger_idx on challenges (challenger_id, status, created_at desc);
create index challenges_expiry_idx on challenges (expires_at) where status = 'pending';

-- "Nicht mehrfach denselben Gegner gleichzeitig herausfordern": pending UND
-- accepted zählen als offen — eine angenommene, aber noch nicht gespielte
-- Challenge darf nicht durch eine zweite überholt werden.
create unique index challenges_one_open_per_pair_idx
  on challenges (challenger_id, challenged_player_id)
  where status in ('pending', 'accepted');

-- ------------------------------------------------------------
-- 4. In-App-Benachrichtigungen
-- ------------------------------------------------------------
-- E-Mail gibt es schon (lib/server/email.ts). Hier geht es um den Verlauf
-- IN der App: was ist passiert, während ich weg war. Bewusst ohne eigenes
-- Templating in der DB — der Text wird beim Erzeugen fertig eingesetzt,
-- damit eine spätere Textänderung alte Einträge nicht rückwirkend umschreibt
-- (gleiche Überlegung wie reward_redemptions.reward_title in 0008).
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  kind       text not null
               check (kind in ('play_request_received', 'play_request_accepted',
                               'play_request_declined', 'challenge_received',
                               'challenge_accepted', 'challenge_declined',
                               'challenge_expiring', 'challenge_expired')),
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_player_idx on notifications (player_id, created_at desc);
create index notifications_unread_idx on notifications (player_id) where read_at is null;

-- ------------------------------------------------------------
-- 5. Ausgeblendete Vorschläge ("Nicht interessiert" / blockieren)
-- ------------------------------------------------------------
create table suggestion_dismissals (
  player_id           uuid not null references players(id) on delete cascade,
  dismissed_player_id uuid not null references players(id) on delete cascade,
  blocked             boolean not null default false,
  created_at          timestamptz not null default now(),
  primary key (player_id, dismissed_player_id),

  constraint dismissal_not_self check (player_id <> dismissed_player_id)
);

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
-- Lesen läuft überall über den Session-Client (RLS), Schreiben ausschließlich
-- über service_role nach Prüfung in TypeScript — dasselbe Muster wie bei
-- matches/rewards. Deshalb gibt es hier bewusst NUR select-Policies.
alter table player_availabilities enable row level security;
alter table play_requests         enable row level security;
alter table challenges            enable row level security;
alter table notifications         enable row level security;
alter table suggestion_dismissals enable row level security;

-- Die eigenen Spielzeiten sieht man vollständig (auch pausierte). Fremde
-- Verfügbarkeiten sind NICHT direkt lesbar — sie fließen nur aggregiert und
-- serverseitig gefiltert in Matchmaking-Vorschläge ein (siehe
-- lib/server/matchmaking.ts). Damit kann niemand die Wochenpläne anderer
-- Spieler abgrasen.
create policy availabilities_self_read on player_availabilities
  for select using (player_id = current_player_id());

-- Anfragen sieht, wer beteiligt ist — Absender wie Empfänger.
create policy play_requests_involved_read on play_requests
  for select using (
    sender_id = current_player_id() or receiver_id = current_player_id()
  );

create policy challenges_involved_read on challenges
  for select using (
    challenger_id = current_player_id() or challenged_player_id = current_player_id()
  );

create policy notifications_self_read on notifications
  for select using (player_id = current_player_id());

create policy dismissals_self_read on suggestion_dismissals
  for select using (player_id = current_player_id());

grant select on table player_availabilities, play_requests, challenges,
                      notifications, suggestion_dismissals
  to authenticated;

-- ------------------------------------------------------------
-- 7. Abgelaufene Anfragen/Challenges markieren
-- ------------------------------------------------------------
-- Läuft im bestehenden 15-Minuten-Cron mit (0007) — kein zweiter Zeitplan.
-- Gibt zurück, wie viele Zeilen jeweils betroffen waren, damit der
-- Cron-Endpoint etwas Nachvollziehbares loggen kann.
create or replace function expire_stale_requests_and_challenges()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requests   int;
  v_challenges int;
  v_expiring   jsonb;
begin
  update play_requests
     set status = 'expired', updated_at = now()
   where status = 'pending' and expires_at <= now();
  get diagnostics v_requests = row_count;

  update challenges
     set status = 'expired', updated_at = now()
   where status = 'pending' and expires_at <= now();
  get diagnostics v_challenges = row_count;

  -- Challenges, die in den nächsten 24h ablaufen und für die noch keine
  -- "läuft bald ab"-Benachrichtigung existiert. Der Aufrufer verschickt sie;
  -- die not-exists-Prüfung macht den Cron-Lauf idempotent (alle 15 Minuten!).
  select coalesce(jsonb_agg(jsonb_build_object(
           'challenge_id', c.id,
           'challenger_id', c.challenger_id,
           'challenged_player_id', c.challenged_player_id,
           'expires_at', c.expires_at
         )), '[]'::jsonb)
    into v_expiring
    from challenges c
   where c.status = 'pending'
     and c.expires_at > now()
     and c.expires_at <= now() + interval '24 hours'
     and not exists (
       select 1 from notifications n
        where n.player_id = c.challenged_player_id
          and n.kind = 'challenge_expiring'
          and n.link = '/challenges'
          and n.created_at > c.created_at
     );

  return jsonb_build_object(
    'expired_requests', v_requests,
    'expired_challenges', v_challenges,
    'expiring_soon', v_expiring
  );
end;
$$;

revoke all on function expire_stale_requests_and_challenges() from public, anon, authenticated;
grant execute on function expire_stale_requests_and_challenges() to service_role;
