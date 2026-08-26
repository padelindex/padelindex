-- ============================================================
-- PadelIndex — admin_report_league_box_result: Race mit dem 48h-Cron schließen
-- ============================================================
-- admin_report_league_box_result() sperrt die league_box_matches-Zeile
-- (for update of lbm), aber die anschließende Statusprüfung der
-- verknüpften matches-Zeile war ein ungesperrtes SELECT. Schmales, aber
-- reales Fenster: läuft der 48h-Cron (auto_confirm_due_matches ->
-- apply_match_rating, siehe 0002/0007) für genau dieses Match zwischen
-- diesem SELECT und dem darauffolgenden DELETE durch, sieht der Admin
-- noch status='pending', obwohl das Match currently oder gerade
-- bestätigt+gewertet wird — sein DELETE löscht dann ein Match, dessen
-- Rating bereits angewendet wurde oder wird, ohne dass sich das jemals
-- zurücknehmen ließe (apply_match_rating hat keine Umkehrfunktion).
--
-- Fix: dieselbe select-for-update-Sperre wie apply_match_rating selbst
-- auf dieser matches-Zeile (0002_apply_match_rating.sql) — beide Seiten
-- sperren dieselbe Zeile, Postgres serialisiert den Rest von selbst: wer
-- zuerst sperrt, gewinnt; die andere Transaktion wartet und liest danach
-- den inzwischen aktuellen Status.

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
    -- for update: dieselbe Zeile, dieselbe Sperre wie apply_match_rating
    -- (0002) — läuft der Cron gerade für dieses Match, wartet dieser
    -- Aufruf hier, bis der Cron committet hat, und sieht danach garantiert
    -- den aktuellen (dann 'confirmed') Status statt eines veralteten.
    select status into v_existing_match_status
    from matches where id = v_existing_match_id
    for update;
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
