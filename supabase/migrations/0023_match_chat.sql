-- ============================================================
-- PadelIndex — Match-Chat (Liga, Spielersuche, freie Spiele)
-- ============================================================
-- Ein Chat-Thread gehört immer zu genau einem von vier bestehenden
-- "organisiertes Spiel"-Kontexten:
--   1. matches             — ein gemeldetes/bestätigtes freies Spiel
--   2. league_box_matches  — eine einzelne Ansetzung/Runde einer Liga-Box
--                            (existiert schon VOR dem ersten gespielten
--                            Satz — league_box_matches.scheduled_at/court
--                            werden laut league.ts bereits vereinbart,
--                            bevor überhaupt ein Ergebnis, also eine
--                            matches-Zeile, existiert; genau dann soll
--                            man schon chatten können)
--   3. league_boxes        — Gruppen-Chat der ganzen 4er-Box
--   4. play_requests       — Spielersuche/Lobby zwischen zwei Spielern
--                            (existiert schon im Status 'pending' — genau
--                            das ist die "mindestens 2 Spieler in der
--                            Lobby"-Bedingung, nicht erst die Annahme)
--
-- Deshalb vier nullable Fremdschlüssel statt eines einzigen match_id NOT
-- NULL, wie ursprünglich skizziert: ein Liga-Box-Match hat vor dem Melden
-- noch gar keine matches-Zeile (match_id bleibt dort bis zum Ergebnis
-- NULL, siehe league_box_matches in 0016_league_module), und sowohl der
-- Box-Gruppenchat als auch die Spielersuche haben nie eine — beides sind
-- reale Ziele dieser Migration, kein Sonderfall. thread_key fasst die
-- vier Spalten zu einer stabilen ID zusammen, mit der Realtime-Filter und
-- Unread-Logik arbeiten, ohne die vier Fälle unterscheiden zu müssen.
--
-- sender_id zeigt auf players(id), nicht wie ursprünglich skizziert auf
-- auth.users(id): players.id ist seit 0005_claimable_profiles die
-- App-weite Identität (auth.uid() wird über current_player_id()
-- aufgelöst) — match_participants.player_id und matches.reported_by
-- folgen demselben Muster, und nicht jeder Spieler hat überhaupt eine
-- auth.users-Zeile (importierte, unbeanspruchte Liga-Profile).

create table match_messages (
  id                  uuid primary key default gen_random_uuid(),
  match_id            uuid references matches(id) on delete cascade,
  league_box_match_id uuid references league_box_matches(id) on delete cascade,
  league_box_id       uuid references league_boxes(id) on delete cascade,
  play_request_id     uuid references play_requests(id) on delete cascade,
  thread_key          uuid generated always as (
                         coalesce(match_id, league_box_match_id, league_box_id, play_request_id)
                       ) stored,
  kind                text not null default 'user' check (kind in ('user', 'system')),
  sender_id           uuid references players(id) on delete set null,
  -- Schnappschuss von Name/Bild zum Sendezeitpunkt statt Live-Join gegen
  -- players: RLS auf players gibt nur die eigene Zeile frei (0005), ein
  -- Chatpartner könnte fremde Namen clientseitig sonst gar nicht auflösen.
  -- Gleiches Muster wie token_transactions.reason/reward_redemptions.reward_title
  -- (0008) — bewusst eingefroren statt live nachgeschlagen, siehe Trigger
  -- match_messages_fill_sender() unten.
  sender_name         text,
  sender_avatar_url   text,
  content             text not null,
  created_at          timestamptz not null default now(),

  constraint match_messages_one_context check (
    num_nonnulls(match_id, league_box_match_id, league_box_id, play_request_id) = 1
  ),
  constraint match_messages_kind_sender check (
    (kind = 'user' and sender_id is not null) or (kind = 'system' and sender_id is null)
  )
);

create index match_messages_thread_idx on match_messages (thread_key, created_at);

-- ------------------------------------------------------------
-- Name/Avatar zum Sendezeitpunkt einfrieren
-- ------------------------------------------------------------
create or replace function match_messages_fill_sender()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'system' then
    new.sender_name := coalesce(nullif(trim(new.sender_name), ''), 'System');
    new.sender_avatar_url := null;
    return new;
  end if;

  select public_display_name(p.display_name, p.claim_status, p.show_full_name), p.avatar_url
    into new.sender_name, new.sender_avatar_url
  from players p
  where p.id = new.sender_id;

  return new;
end;
$$;

create trigger match_messages_fill_sender_trg
  before insert on match_messages
  for each row execute function match_messages_fill_sender();

-- ------------------------------------------------------------
-- Zugriff: Teilnehmer ODER Vereins-Admin des jeweiligen Kontexts
-- ------------------------------------------------------------
-- Eine einzige Funktion für SELECT und INSERT (gleiches Muster wie
-- plays_in_match in 0005) statt vier Fälle zweimal als Policy-Ausdruck —
-- security definer, damit die Prüfung nicht an RLS auf den referenzierten
-- Tabellen scheitert (league_box_members/league_registrations haben
-- bewusst keine eigene Policy, siehe 0016).
create or replace function can_access_match_chat(
  p_match_id            uuid,
  p_league_box_match_id uuid,
  p_league_box_id       uuid,
  p_play_request_id     uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_match_id is not null then
      plays_in_match(p_match_id)
      or exists (
        select 1 from matches mt
        join club_admins ca on ca.club_id = mt.club_id
        where mt.id = p_match_id and ca.player_id = current_player_id()
      )
    when p_league_box_match_id is not null then
      exists (
        select 1 from league_box_matches lbm
        join league_box_members bm on bm.box_id = lbm.box_id
        where lbm.id = p_league_box_match_id and bm.player_id = current_player_id()
      )
      or exists (
        select 1 from league_box_matches lbm
        join league_boxes b    on b.id = lbm.box_id
        join league_cycles cy  on cy.id = b.cycle_id
        join league_seasons se on se.id = cy.season_id
        join leagues l         on l.id = se.league_id
        join club_admins ca    on ca.club_id = l.club_id
        where lbm.id = p_league_box_match_id and ca.player_id = current_player_id()
      )
    when p_league_box_id is not null then
      exists (
        select 1 from league_box_members bm
        where bm.box_id = p_league_box_id and bm.player_id = current_player_id()
      )
      or exists (
        select 1 from league_boxes b
        join league_cycles cy  on cy.id = b.cycle_id
        join league_seasons se on se.id = cy.season_id
        join leagues l         on l.id = se.league_id
        join club_admins ca    on ca.club_id = l.club_id
        where b.id = p_league_box_id and ca.player_id = current_player_id()
      )
    when p_play_request_id is not null then
      exists (
        select 1 from play_requests pr
        where pr.id = p_play_request_id
          and current_player_id() in (pr.sender_id, pr.receiver_id)
      )
      or exists (
        select 1 from play_requests pr
        join club_admins ca on ca.club_id = pr.club_id
        where pr.id = p_play_request_id and ca.player_id = current_player_id()
      )
    else false
  end
$$;

alter table match_messages enable row level security;

create policy match_messages_select on match_messages
  for select using (
    can_access_match_chat(match_id, league_box_match_id, league_box_id, play_request_id)
  );

-- kind='user' erzwungen: Systemnachrichten (kind='system') entstehen
-- ausschließlich über service_role (siehe lib/server/chat.ts), das RLS
-- ohnehin umgeht — diese Policy verhindert nur, dass sich ein Client über
-- den normalen Insert-Pfad als System ausgibt.
create policy match_messages_insert on match_messages
  for insert with check (
    kind = 'user'
    and sender_id = current_player_id()
    and can_access_match_chat(match_id, league_box_match_id, league_box_id, play_request_id)
  );

grant select, insert on match_messages to authenticated;

-- ------------------------------------------------------------
-- Gelesen-Marker fürs Unread-Badge
-- ------------------------------------------------------------
-- Ein Datum pro (Spieler, Thread) statt pro Nachricht — "seit dem letzten
-- Öffnen neue Nachrichten" ist die einzige Frage, die das Badge
-- beantworten muss.
create table match_message_reads (
  player_id     uuid not null references players(id) on delete cascade,
  thread_key    uuid not null,
  last_read_at  timestamptz not null default now(),
  primary key (player_id, thread_key)
);

alter table match_message_reads enable row level security;

create policy match_message_reads_own on match_message_reads
  for all using (player_id = current_player_id())
  with check (player_id = current_player_id());

grant select, insert, update on match_message_reads to authenticated;

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
-- supabase_realtime existiert als Plattform-Objekt schon vor den
-- Projekt-Migrationen — der Existenz-Check ist nur ein Sicherheitsnetz für
-- Umgebungen, in denen das (noch) nicht der Fall ist.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.match_messages';
  end if;
end $$;

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop trigger if exists match_messages_fill_sender_trg on match_messages;
-- drop function if exists match_messages_fill_sender();
-- drop function if exists can_access_match_chat(uuid, uuid, uuid, uuid);
-- drop table if exists match_message_reads;
-- drop table if exists match_messages;
-- ------------------------------------------------------------
