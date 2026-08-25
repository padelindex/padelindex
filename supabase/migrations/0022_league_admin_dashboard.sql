-- ============================================================
-- PadelIndex — Liga-Modul: Vereinsadmin-Dashboard
-- ============================================================
-- Ergänzt 0016_league_module.sql um das, was die bestehende
-- /liga/[slug]/verwaltung/*-Verwaltung noch nicht abdeckt. Nichts davon
-- ersetzt bestehende Tabellen/Funktionen — reportBoxResult() und
-- create_league_box_result() (Selbst-Melden durch Spieler) bleiben
-- unverändert, das hier kommt on top.
--
-- Drei Themen in einer Datei, weil sie zusammen das Dashboard ergeben:
--   1. Termin- & Platzverwaltung je Runde (bisher nur ein scheduled_at/
--      court je BOX, einmalig bei Anlage — reicht nicht für "Woche 1-3
--      eigenständig, Woche 4-6 Admin-Vergabe" mit Nachverfolgung, wer
--      wann was eingetragen hat).
--   2. Admin-Ergebniskorrektur, Walkover, Abbruch — bisher kann nur ein
--      Box-Mitglied selbst ein reguläres Ergebnis melden.
--   3. Rating auf der öffentlichen Aufstellung, fürs Warteliste/Ersatz-
--      Matching nach Spielstärke.

-- ------------------------------------------------------------
-- 1. Rating in league_box_lineup
-- ------------------------------------------------------------
-- players.rating ist ohnehin schon indirekt öffentlich (Leaderboard,
-- Matchmaking) — hier nur für die Box-Aufstellung mit ausgeliefert, damit
-- die Verwaltung Ersatzspieler nach Spielstärke vorschlagen kann, ohne
-- eine zweite Abfrage gegen players zu brauchen.
create or replace view league_box_lineup
with (security_invoker = false) as
select
  bm.box_id,
  b.cycle_id,
  b.ladder_position,
  bm.seat,
  bm.role,
  p.id as player_id,
  case when p.profile_public then p.handle end as handle,
  case
    when p.profile_public
      then public_display_name(p.display_name, p.claim_status, p.show_full_name)
    else 'Nicht gelistet'
  end as name,
  (p.profile_public and p.claim_status = 'claimed') as claimed,
  p.rating
from league_box_members bm
join league_boxes b on b.id = bm.box_id
join players p on p.id = bm.player_id;

grant select on league_box_lineup to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Termine je Runde
-- ------------------------------------------------------------
-- league_boxes.scheduled_at/court (0016) bleiben als Vorschlag/Default
-- bestehen (z. B. "Boxabend ist normalerweise dienstags"). Diese Spalten
-- hier sind der TATSÄCHLICHE Termin je Runde, weil die drei Runden einer
-- Box nicht zwangsläufig alle am selben Tag stattfinden — genau das
-- Problem, das die 6-Wochen-Regel lösen soll (Woche 1-3 einigen sich die
-- Spieler pro Runde selbst, Woche 4-6 vergibt der Admin die restlichen).
--
-- match_assigned_by_admin unterscheidet "von wem kommt der Termin":
-- true = Admin hat vergeben, false + scheduled_at gesetzt = Spieler haben
-- sich selbst geeinigt, false + scheduled_at null = noch offen.
--
-- previous_scheduled_at/previous_court: wenn ein Spieler einen eigenen
-- Termin einträgt und dadurch einen bereits vom Admin vergebenen Slot
-- verdrängt, landet der alte Slot hier — nicht einfach überschrieben —
-- damit das Dashboard "Slot X wird frei" anzeigen und der Admin die
-- Court-Buchung bestätigen oder stornieren kann (siehe league.ts
-- resolveFreedSlot). Bleibt null, solange nichts verdrängt wurde.
alter table league_box_matches
  add column if not exists scheduled_at            timestamptz,
  add column if not exists court                    text,
  add column if not exists match_assigned_by_admin  boolean not null default false,
  add column if not exists scheduled_by             uuid references players(id) on delete set null,
  add column if not exists is_replacement            boolean not null default false,
  add column if not exists previous_scheduled_at     timestamptz,
  add column if not exists previous_court            text;

-- ------------------------------------------------------------
-- 3. Admin-Ergebniskorrektur, Walkover, Abbruch
-- ------------------------------------------------------------
-- Drei eigene Funktionen statt Erweiterung von create_league_box_result:
-- der Selbst-Melde-Pfad der Spieler bleibt damit unangetastet und behält
-- seine eigene, striktere Prüfung (Melder muss Teilnehmer sein).
--
-- Alle drei sind wie create_league_box_result nur für service_role
-- ausführbar — die Autorisierung "ist diese Person Admin GENAU dieser
-- Liga?" prüft der Aufrufer VORHER über requireLeagueAdmin() in
-- TypeScript, nicht hier (gleiches Muster wie league-admin.ts insgesamt).
-- p_admin_id dient nur der Zuschreibung (reported_by), nicht der Prüfung.

-- 3a. Ergebnis eintragen ODER korrigieren (status 'played'/'abandoned').
-- Ein bereits GEWERTETES Ergebnis (matches.status='confirmed', Rating
-- schon angewendet) lässt sich hier bewusst NICHT mehr ändern — das
-- würde die Index-Rating-Historie verfälschen, ohne dass es einen Weg
-- gäbe, das shon angewendete Rating wieder rückgängig zu machen. Solange
-- noch nicht bestätigt (status='pending'), wird das alte matches/-sets/
-- -participants-Tripel gelöscht und sauber neu angelegt.
create or replace function admin_report_league_box_result(
  p_box_match_id uuid,
  p_admin_id     uuid,
  p_team1        uuid[],
  p_team2        uuid[],
  p_sets         jsonb,
  p_status       text default 'played',
  p_winner_team  smallint default null,
  p_note         text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box_id                uuid;
  v_round_status           text;
  v_existing_match_id      uuid;
  v_existing_match_status  text;
  v_club_id                uuid;
  v_played_at              timestamptz;
  v_match_id               uuid;
  v_all                    uuid[];
  v_member_cnt             int;
  v_set_count              int;
  v_is_replacement         boolean;
  s                        jsonb;
  i                        int := 0;
begin
  if p_status not in ('played', 'abandoned') then
    raise exception 'Status muss "played" oder "abandoned" sein.';
  end if;

  select lbm.box_id, lbm.status, lbm.match_id,
         l.club_id, coalesce(lbm.scheduled_at, b.scheduled_at, now())
    into v_box_id, v_round_status, v_existing_match_id, v_club_id, v_played_at
  from league_box_matches lbm
  join league_boxes b   on b.id = lbm.box_id
  join league_cycles cy on cy.id = b.cycle_id
  join league_seasons se on se.id = cy.season_id
  join leagues l        on l.id = se.league_id
  where lbm.id = p_box_match_id
  for update of lbm;

  if not found then
    raise exception 'Runde % nicht gefunden', p_box_match_id;
  end if;

  if v_round_status = 'cancelled' then
    raise exception 'Runde ist storniert.';
  end if;

  if array_length(p_team1, 1) <> 2 or array_length(p_team2, 1) <> 2 then
    raise exception 'Beide Teams brauchen genau zwei Spieler.';
  end if;

  v_all := p_team1 || p_team2;
  if (select count(distinct x) from unnest(v_all) x) <> 4 then
    raise exception 'Alle vier Spieler müssen unterschiedlich sein.';
  end if;

  select count(*) into v_member_cnt
  from league_box_members
  where box_id = v_box_id and player_id = any(v_all);

  if v_member_cnt <> 4 then
    raise exception 'Alle vier Spieler müssen zu dieser Box gehören.';
  end if;

  select count(*) into v_set_count from jsonb_array_elements(p_sets);
  if v_set_count < 1 or v_set_count > 5 then
    raise exception 'Zwischen einem und fünf Sätzen angeben.';
  end if;

  if v_existing_match_id is not null then
    select status into v_existing_match_status from matches where id = v_existing_match_id;
    if v_existing_match_status = 'confirmed' then
      raise exception 'Ergebnis ist bereits gewertet und lässt sich hier nicht mehr ändern.';
    end if;
    -- Erst auf 'scheduled' zurücksetzen, DANN löschen: sonst setzt die
    -- ON DELETE SET NULL-Aktion match_id für einen Moment auf null,
    -- während status hier noch 'played'/'abandoned' ist — das verletzt
    -- league_box_matches_played_needs_match, weil Postgres Check-
    -- Constraints sofort prüft, nicht erst am Transaktionsende.
    update league_box_matches set status = 'scheduled' where id = p_box_match_id;
    delete from matches where id = v_existing_match_id;
  end if;

  insert into matches (club_id, source, format, played_at, reported_by, match_type)
  values (v_club_id, 'club_league', 'best_of_3', v_played_at, p_admin_id, 'vereinsliga')
  returning id into v_match_id;

  -- Admin meldet für beide Teams zugleich, deshalb gelten beide sofort
  -- als bestätigt — niemand muss hier noch zustimmen. matches.status
  -- bleibt trotzdem 'pending' (Tabellendefault): die bestehende 48h-Frist
  -- (confirm_deadline) und der Cron bestätigen es und wenden das Rating
  -- an, genau wie bei jedem anderen Match. Das ist beabsichtigt, siehe
  -- adminReportBoxResult() in league.ts — solange die Frist läuft, ist
  -- das Ergebnis noch korrigierbar.
  insert into match_participants (match_id, player_id, team, confirmed)
  select v_match_id, x, 1, true from unnest(p_team1) x
  union all
  select v_match_id, x, 2, true from unnest(p_team2) x;

  for s in select * from jsonb_array_elements(p_sets)
  loop
    i := i + 1;
    insert into match_sets (match_id, set_number, team1_games, team2_games)
    values (v_match_id, i, (s->>'team1_games')::smallint, (s->>'team2_games')::smallint);
  end loop;

  select exists(
    select 1 from league_box_members
    where box_id = v_box_id and player_id = any(v_all) and role = 'substitute'
  ) into v_is_replacement;

  update league_box_matches
     set match_id       = v_match_id,
         status         = p_status,
         winner_team    = p_winner_team,
         note           = p_note,
         is_replacement = v_is_replacement
   where id = p_box_match_id;

  return v_match_id;
end;
$$;

revoke all on function admin_report_league_box_result(uuid, uuid, uuid[], uuid[], jsonb, text, smallint, text)
  from public, anon, authenticated;
grant execute on function admin_report_league_box_result(uuid, uuid, uuid[], uuid[], jsonb, text, smallint, text)
  to service_role;

-- 3b. Walkover: rein ein Box-Tabellen-Ereignis, KEIN matches-Eintrag —
-- genau wie im ursprünglichen Schema-Kommentar zu winner_team vorgesehen
-- ("kampfloser Sieg ohne gespielte Sätze"). Fließt deshalb bewusst nicht
-- ins Index-Rating: es wurde schlicht nicht gespielt.
create or replace function admin_set_league_box_walkover(
  p_box_match_id uuid,
  p_admin_id     uuid,
  p_winner_team  smallint,
  p_note         text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status   text;
  v_existing uuid;
begin
  if p_winner_team not in (1, 2) then
    raise exception 'Sieger-Team muss 1 oder 2 sein.';
  end if;

  select status, match_id into v_status, v_existing
  from league_box_matches
  where id = p_box_match_id
  for update;

  if not found then
    raise exception 'Runde % nicht gefunden', p_box_match_id;
  end if;

  if v_existing is not null then
    raise exception 'Für diese Runde ist schon ein Ergebnis erfasst — erst zurücksetzen.';
  end if;

  if v_status <> 'scheduled' then
    raise exception 'Runde ist nicht offen (status=%).', v_status;
  end if;

  update league_box_matches
     set status      = 'walkover',
         winner_team = p_winner_team,
         note        = p_note
   where id = p_box_match_id;
end;
$$;

revoke all on function admin_set_league_box_walkover(uuid, uuid, smallint, text)
  from public, anon, authenticated;
grant execute on function admin_set_league_box_walkover(uuid, uuid, smallint, text)
  to service_role;

-- 3c. Zurücksetzen: macht eine Walkover-/Abbruch-/Ergebnis-Eintragung
-- rückgängig, solange sie noch nicht gewertet (rating-angewendet) ist —
-- das "Korrektur"-Werkzeug für "aus Versehen falsch eingetragen".
create or replace function admin_reset_league_box_match(
  p_box_match_id uuid,
  p_admin_id     uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_match_id     uuid;
  v_existing_match_status text;
begin
  select match_id into v_existing_match_id
  from league_box_matches
  where id = p_box_match_id
  for update;

  if not found then
    raise exception 'Runde % nicht gefunden', p_box_match_id;
  end if;

  if v_existing_match_id is not null then
    select status into v_existing_match_status from matches where id = v_existing_match_id;
    if v_existing_match_status = 'confirmed' then
      raise exception 'Ergebnis ist bereits gewertet und lässt sich nicht mehr zurücksetzen.';
    end if;
    -- Reihenfolge wie in admin_report_league_box_result: erst 'scheduled'
    -- setzen, dann löschen, sonst verletzt die ON DELETE SET NULL-Aktion
    -- kurzzeitig league_box_matches_played_needs_match.
    update league_box_matches set status = 'scheduled' where id = p_box_match_id;
    delete from matches where id = v_existing_match_id;
  end if;

  update league_box_matches
     set match_id       = null,
         status         = 'scheduled',
         winner_team    = null,
         note           = null,
         is_replacement = false
   where id = p_box_match_id;
end;
$$;

revoke all on function admin_reset_league_box_match(uuid, uuid)
  from public, anon, authenticated;
grant execute on function admin_reset_league_box_match(uuid, uuid)
  to service_role;

-- ------------------------------------------------------------
-- 4. Sitztausch innerhalb einer Box (Drag & Drop)
-- ------------------------------------------------------------
-- unique(box_id, seat) (0016) ist standardmäßig NICHT deferrable — zwei
-- sequenzielle UPDATEs ("A auf Bs Sitz, dann B auf As Sitz") verletzen
-- sie beim ERSTEN UPDATE, weil B zu dem Zeitpunkt noch auf dem Zielsitz
-- sitzt. Der Tausch braucht deshalb entweder eine dritte, garantiert
-- freie Sitznummer als Zwischenschritt (funktioniert nicht mehr, sobald
-- eine Box alle 8 erlaubten Sitze belegt) oder eine deferred-Prüfung
-- innerhalb EINER Transaktion. Zweiteres ist robust für jede Boxgröße.
alter table league_box_members
  drop constraint league_box_members_box_id_seat_key,
  add constraint league_box_members_box_id_seat_key
    unique (box_id, seat) deferrable initially immediate;

create or replace function swap_league_box_seats(
  p_box_id    uuid,
  p_player_a  uuid,
  p_player_b  uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seat_a smallint;
  v_seat_b smallint;
begin
  -- Nur für diese Transaktion: die Prüfung wandert ans Ende, damit der
  -- kurze Zwischenzustand (beide Sitzänderungen noch nicht beide
  -- angewendet) nicht schon beim ersten UPDATE fehlschlägt.
  set constraints league_box_members_box_id_seat_key deferred;

  select seat into v_seat_a from league_box_members
    where box_id = p_box_id and player_id = p_player_a
    for update;
  select seat into v_seat_b from league_box_members
    where box_id = p_box_id and player_id = p_player_b
    for update;

  if v_seat_a is null or v_seat_b is null then
    raise exception 'Beide Spieler müssen in dieser Box sitzen.';
  end if;

  if v_seat_a = v_seat_b then
    return;
  end if;

  update league_box_members set seat = v_seat_b where box_id = p_box_id and player_id = p_player_a;
  update league_box_members set seat = v_seat_a where box_id = p_box_id and player_id = p_player_b;
end;
$$;

revoke all on function swap_league_box_seats(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function swap_league_box_seats(uuid, uuid, uuid)
  to service_role;

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop function if exists swap_league_box_seats(uuid, uuid, uuid);
-- alter table league_box_members
--   drop constraint league_box_members_box_id_seat_key,
--   add constraint league_box_members_box_id_seat_key unique (box_id, seat);
-- drop function if exists admin_reset_league_box_match(uuid, uuid);
-- drop function if exists admin_set_league_box_walkover(uuid, uuid, smallint, text);
-- drop function if exists admin_report_league_box_result(uuid, uuid, uuid[], uuid[], jsonb, text, smallint, text);
-- alter table league_box_matches
--   drop column if exists previous_court,
--   drop column if exists previous_scheduled_at,
--   drop column if exists is_replacement,
--   drop column if exists scheduled_by,
--   drop column if exists match_assigned_by_admin,
--   drop column if exists court,
--   drop column if exists scheduled_at;
-- (league_box_lineup fällt zurück auf die Version aus 0016, wenn dort
--  erneut "create or replace view" ohne rating ausgeführt wird.)
-- ------------------------------------------------------------
