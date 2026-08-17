-- ============================================================
-- PadelIndex — atomare Anwendung eines Rating-Ergebnisses
-- ============================================================
-- Warum eine SQL-Funktion und nicht mehrere Supabase-Client-Calls:
-- der Supabase-JS-Client kennt keine Transaktionen. Ohne Transaktion
-- riskierst du halb angewandte Matches (Rating geschrieben, Tokens nicht).
-- Ablauf: TS berechnet -> ein einziger rpc()-Call schreibt alles atomar.
--
-- Aufruf aus SvelteKit (service_role, NIE mit anon key):
--   await supabaseAdmin.rpc('apply_match_rating', {
--     p_match_id: matchId,
--     p_results: results,   -- JSONB-Array aus computeMatchRatings()
--     p_grants:  grants     -- JSONB-Array aus computeTokenGrants()
--   });

create or replace function apply_match_rating(
  p_match_id uuid,
  p_results  jsonb,
  p_grants   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status         text;
  v_rating_applied boolean;
  v_club_id        uuid;
  r                jsonb;
  g                jsonb;
begin
  -- 1. Match sperren und Vorbedingungen prüfen (Idempotenz!)
  select status, rating_applied, club_id
    into v_status, v_rating_applied, v_club_id
  from matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match % nicht gefunden', p_match_id;
  end if;

  if v_status <> 'confirmed' then
    raise exception 'Match % ist nicht bestätigt (status=%)', p_match_id, v_status;
  end if;

  -- Doppelanwendung still abbrechen: Retry/Cron darf nichts kaputt machen
  if v_rating_applied then
    return;
  end if;

  -- 2. Rating pro Spieler schreiben + Historie
  for r in select * from jsonb_array_elements(p_results)
  loop
    insert into rating_history (
      player_id, match_id,
      mu_before, sigma_before, mu_after, sigma_after,
      rating_before, rating_after, factors, reason
    ) values (
      (r->>'playerId')::uuid, p_match_id,
      (r->>'muBefore')::numeric, (r->>'sigmaBefore')::numeric,
      (r->>'muAfter')::numeric,  (r->>'sigmaAfter')::numeric,
      (r->>'ratingBefore')::numeric, (r->>'ratingAfter')::numeric,
      r->'factors', 'match'
    );

    update players
       set mu             = (r->>'muAfter')::numeric,
           sigma          = (r->>'sigmaAfter')::numeric,
           matches_played = matches_played + 1,
           is_provisional = (matches_played + 1) < 12,
           last_match_at  = greatest(
                              coalesce(last_match_at, '-infinity'::timestamptz),
                              (select played_at from matches where id = p_match_id)
                            )
     where id = (r->>'playerId')::uuid;
  end loop;

  -- 3. Token-Gutschriften (nur positiv — Constraint im Schema erzwingt das)
  for g in select * from jsonb_array_elements(p_grants)
  loop
    insert into token_transactions (player_id, club_id, amount, reason, match_id)
    values (
      (g->>'playerId')::uuid,
      v_club_id,
      (g->>'amount')::int,
      g->>'reason',
      p_match_id
    );
  end loop;

  -- 4. Match als angewandt markieren
  update matches
     set rating_applied = true
   where id = p_match_id;
end;
$$;

revoke all on function apply_match_rating(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function apply_match_rating(uuid, jsonb, jsonb) to service_role;


-- ============================================================
-- Bestätigungs-Automatik: 48h-Fenster läuft ab
-- ============================================================
-- Setzt fällige Matches auf 'confirmed'. Die eigentliche
-- Rating-Berechnung holt sich danach der Worker (siehe unten).

create or replace function auto_confirm_due_matches()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  update matches
     set status = 'confirmed',
         confirmed_at = now()
   where status = 'pending'
     and confirm_deadline <= now()
  returning id;
$$;

grant execute on function auto_confirm_due_matches() to service_role;


-- ============================================================
-- Streak-Ermittlung (Input für die Rating-Berechnung)
-- ============================================================
-- Liefert die aktuelle Serie: positiv = Siege, negativ = Niederlagen.

create or replace function player_current_streak(p_player_id uuid)
returns int
language sql
stable
as $$
  with recent as (
    select (rh.factors->>'won')::boolean as won,
           row_number() over (order by rh.created_at desc) as rn
    from rating_history rh
    where rh.player_id = p_player_id
      and rh.reason = 'match'
    order by rh.created_at desc
    limit 30
  ),
  first_val as (select won from recent where rn = 1),
  run as (
    select count(*) as len
    from recent r
    where r.rn <= coalesce(
      (select min(rn) from recent x
        where x.won is distinct from (select won from first_val)), 999
    ) - 1
  )
  select case
           when (select won from first_val) is null then 0
           when (select won from first_val) then (select len from run)::int
           else -(select len from run)::int
         end;
$$;


-- ============================================================
-- Inaktivitäts-Decay (Cron, z.B. wöchentlich via pg_cron)
-- ============================================================
create or replace function apply_inactivity_decay()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_base_sigma numeric := 25.0/3.0;
  p record;
  v_weeks int;
  v_steps int;
  v_new_sigma numeric;
begin
  for p in
    select id, sigma, mu, last_match_at
    from players
    where last_match_at is not null
      and last_match_at < now() - interval '6 weeks'
      and sigma < v_base_sigma
  loop
    v_weeks := floor(extract(epoch from (now() - p.last_match_at)) / 604800)::int;
    v_steps := floor((v_weeks - 6) / 4.0)::int + 1;
    v_new_sigma := least(p.sigma * (1 + 0.08 * v_steps), v_base_sigma);

    if v_new_sigma > p.sigma then
      insert into rating_history (
        player_id, mu_before, sigma_before, mu_after, sigma_after,
        rating_before, rating_after, factors, reason
      ) values (
        p.id, p.mu, p.sigma, p.mu, v_new_sigma,
        greatest(0, least(7, (p.mu - 2*p.sigma) * 7.0/50.0)),
        greatest(0, least(7, (p.mu - 2*v_new_sigma) * 7.0/50.0)),
        jsonb_build_object('weeksInactive', v_weeks, 'steps', v_steps),
        'inactivity_decay'
      );

      update players set sigma = v_new_sigma where id = p.id;
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

grant execute on function apply_inactivity_decay() to service_role;


-- ============================================================
-- Cron-Einrichtung (Supabase: pg_cron)
-- ============================================================
-- select cron.schedule('inactivity-decay', '0 4 * * 1',
--   $$select apply_inactivity_decay()$$);
--
-- Die 48h-Bestätigung braucht danach noch die Rating-Berechnung in TS,
-- deshalb läuft sie besser als Cloudflare Cron Trigger, der
-- auto_confirm_due_matches() aufruft und für jede zurückgegebene ID
-- den Rating-Worker (siehe confirm-worker.ts) ausführt.
