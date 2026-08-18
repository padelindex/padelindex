-- ============================================================
-- PadelIndex — Match-Typ (GPS / Turnier / Vereinsliga / PadelIndex
-- Challenge / Freizeit)
-- ============================================================
-- Rein beschreibend, für Anzeige und "Turnierergebnisse" auf dem
-- öffentlichen Profil — bewusst getrennt von matches.source (0001),
-- das die Token-Vergabe steuert (computeTokenGrants in rating-core.ts)
-- und nicht angetastet wird. GPS = vom Deutschen Padel Verband
-- organisierte Punktspiele.

alter table matches
  add column match_type text not null default 'freizeit'
    check (match_type in ('gps', 'turnier', 'vereinsliga', 'padelindex_challenge', 'freizeit'));

-- create_match_report() bekommt einen neuen Parameter — alte Signatur
-- (7 Argumente) wird ersetzt, nicht als Überladung stehen gelassen.
drop function if exists create_match_report(uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb);

create or replace function create_match_report(
  p_club_id      uuid,
  p_reporter_id  uuid,
  p_partner_id   uuid,
  p_opponent1_id uuid,
  p_opponent2_id uuid,
  p_played_at    timestamptz,
  p_sets         jsonb, -- [{"team1_games": int, "team2_games": int}, ...]
  p_match_type   text default 'freizeit'
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

  if p_match_type not in ('gps', 'turnier', 'vereinsliga', 'padelindex_challenge', 'freizeit') then
    raise exception 'Ungültiger Match-Typ.';
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

  insert into matches (club_id, source, format, played_at, reported_by, match_type)
  values (p_club_id, 'manual', 'best_of_3', p_played_at, p_reporter_id, p_match_type)
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

revoke all on function create_match_report(uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb, text)
  from public, anon, authenticated;
grant execute on function create_match_report(uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb, text)
  to service_role;
