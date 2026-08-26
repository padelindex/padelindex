-- ============================================================
-- PadelIndex — Doppeltes Melden desselben Matches verhindern
-- ============================================================
-- create_match_report() hatte bisher keinerlei Schutz gegen doppeltes
-- Einreichen (Doppelklick, langsames Netz + Retry, zweiter Tab): jeder
-- Aufruf legt bedingungslos eine neue matches-Zeile an, die unabhängig
-- bestätigt wird und ihr eigenes volles Rating anwendet — dasselbe reale
-- Match zählt dann zweimal. Der einzige bisherige Schutz war ein
-- client-seitiges busy-Flag im Formular (match/neu/+page.svelte), das
-- genau diese Fälle nicht abdeckt.
--
-- Schutz hier: dieselben vier Spieler (unabhängig von Team-Zuordnung)
-- am selben Kalendertag im selben Verein — unabhängig vom Status
-- (pending oder schon confirmed) des existierenden Matches. Tag statt
-- exaktem Timestamp, weil p_played_at ohne Datumsangabe im Formular auf
-- new Date() zurückfällt (siehe match/neu/+page.server.ts) — zwei Klicks
-- landen dann Millisekunden auseinander, nicht exakt gleich. Ein echtes
-- zweites Match derselben vier Personen am selben Tag ist im
-- Amateur-Kontext praktisch nie der Fall; falls doch, lässt es sich als
-- weiterer Satz im selben Match nachtragen oder am Folgetag melden.
--
-- Ein reiner "exists"-Check allein hätte noch dieselbe Race-Lücke wie
-- das Problem, das er beheben soll: zwei praktisch gleichzeitige Aufrufe
-- könnten beide "existiert nicht" sehen, bevor einer von beiden
-- committet. pg_advisory_xact_lock() serialisiert deshalb zuerst alle
-- Aufrufe mit demselben Verein+Tag+Spieler-Schlüssel (Lock fällt beim
-- Transaktionsende automatisch) — derselbe Grundgedanke wie die
-- aufgeschobene unique-Prüfung bei swap_league_box_seats (0022), nur
-- ohne dass sich "dieselben vier Spieler" über eine einzelne
-- Tabellenzeile als klassischer unique-Constraint ausdrücken ließe
-- (die Spieler stehen normalisiert in match_participants, nicht in
-- matches selbst).

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
  v_players      uuid[];
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

  v_players := (
    select array_agg(x order by x)
    from unnest(array[p_reporter_id, p_partner_id, p_opponent1_id, p_opponent2_id]) as x
  );

  -- Serialisiert konkurrierende Aufrufe mit demselben Schlüssel, damit der
  -- exists-Check direkt darunter nicht von zwei Transaktionen gleichzeitig
  -- mit "existiert nicht" beantwortet werden kann.
  perform pg_advisory_xact_lock(
    hashtextextended(p_club_id::text || ':' || date_trunc('day', p_played_at)::text || ':' || array_to_string(v_players, ','), 0)
  );

  if exists (
    select 1
    from (
      select mp.match_id, array_agg(mp.player_id order by mp.player_id) as players
      from match_participants mp
      join matches m on m.id = mp.match_id
      where m.club_id = p_club_id
        and date_trunc('day', m.played_at) = date_trunc('day', p_played_at)
      group by mp.match_id
    ) existing
    where existing.players = v_players
  ) then
    raise exception 'Dieses Match wurde für diese vier Spieler an diesem Tag bereits gemeldet.';
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
