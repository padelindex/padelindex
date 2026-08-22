-- ============================================================
-- PadelIndex — Match melden (atomar)
-- ============================================================
-- Gleiches Muster wie apply_match_rating() in 0002: mehrere INSERTs
-- über den Supabase-JS-Client sind nicht transaktional. Ohne Transaktion
-- riskiert ein Teilfehler ein Match ohne Teilnehmer/Sätze. Ablauf: eine
-- SQL-Funktion, ein einziger rpc()-Call.
--
-- Validierung doppelt (TS + hier): validateMatchReport() in
-- match-report.ts prüft zuerst für gute Fehlermeldungen im UI, diese
-- Funktion erzwingt die Kerninvarianten nochmal auf DB-Ebene — falls
-- match-report.ts je falsch aufgerufen wird, bricht das hier trotzdem
-- sauber ab statt Daten zu verfälschen.
--
-- Team 1 = Melder + Partner, Team 2 = die beiden Gegner. Der Melder
-- gilt als sofort bestätigt (er bürgt fürs Ergebnis); die Gegenseite
-- bestätigt separat (siehe confirm.ts — genügt EIN Spieler des
-- Gegnerteams).

create or replace function create_match_report(
  p_club_id      uuid,
  p_reporter_id  uuid,
  p_partner_id   uuid,
  p_opponent1_id uuid,
  p_opponent2_id uuid,
  p_played_at    timestamptz,
  p_sets         jsonb -- [{"team1_games": int, "team2_games": int}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id     uuid;
  v_member_count int;
  v_set_count    int;
  s              jsonb;
  i              int := 0;
begin
  if p_reporter_id is null or p_partner_id is null or p_opponent1_id is null or p_opponent2_id is null then
    raise exception 'Alle vier Spieler müssen angegeben sein.';
  end if;

  if p_reporter_id = p_partner_id or p_reporter_id = p_opponent1_id or p_reporter_id = p_opponent2_id
     or p_partner_id = p_opponent1_id or p_partner_id = p_opponent2_id
     or p_opponent1_id = p_opponent2_id then
    raise exception 'Alle vier Spieler müssen unterschiedlich sein.';
  end if;

  select count(*) into v_member_count
  from club_memberships
  where club_id = p_club_id
    and player_id in (p_reporter_id, p_partner_id, p_opponent1_id, p_opponent2_id);

  if v_member_count <> 4 then
    raise exception 'Alle vier Spieler müssen Mitglied dieses Vereins sein.';
  end if;

  select count(*) into v_set_count from jsonb_array_elements(p_sets);
  if v_set_count < 1 or v_set_count > 5 then
    raise exception 'Zwischen einem und fünf Sätzen angeben.';
  end if;

  insert into matches (club_id, source, format, played_at, reported_by)
  values (p_club_id, 'manual', 'best_of_3', p_played_at, p_reporter_id)
  returning id into v_match_id;

  insert into match_participants (match_id, player_id, team, confirmed) values
    (v_match_id, p_reporter_id,  1, true),
    (v_match_id, p_partner_id,   1, false),
    (v_match_id, p_opponent1_id, 2, false),
    (v_match_id, p_opponent2_id, 2, false);

  for s in select * from jsonb_array_elements(p_sets)
  loop
    i := i + 1;
    insert into match_sets (match_id, set_number, team1_games, team2_games)
    values (v_match_id, i, (s->>'team1_games')::smallint, (s->>'team2_games')::smallint);
  end loop;

  return v_match_id;
end;
$$;

revoke all on function create_match_report(uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function create_match_report(uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb)
  to service_role;
