-- ============================================================
-- PadelIndex — Öffentliches Spielerprofil: Grunddaten + Badges
-- ============================================================
-- Neue, freiwillige Selbstauskunft-Felder. Ausschließlich vom Spieler
-- selbst gepflegt (Session-Client, siehe rewards-ähnliches Muster: RLS
-- allein reicht hier NICHT — players_self_update aus 0005_claimable_
-- profiles.sql existiert zwar schon, aber ohne GRANT UPDATE lief sie
-- bislang komplett ins Leere; 0001 hat nur SELECT gegrantet). Die
-- Spaltenliste im GRANT ist bewusst eng: ein Spieler darf über diesen
-- Weg niemals mu/sigma/matches_played/handle/claim_status verändern.
--
-- self_assessed_level existiert schon seit 0001 (für ein Onboarding, das
-- nie gebaut wurde — seedRating() in rating-core.ts hängt seither in der
-- Luft). Wird hier NICHT ans Rating angeschlossen: „Belegt, nicht
-- behauptet" gilt weiter, die Selbsteinschätzung ist reine Profil-Info,
-- keine Eingabe in die Rating-Berechnung.

alter table players
  add column city           text,
  add column playing_hand   text check (playing_hand in ('rechts', 'links')),
  add column preferred_side text check (preferred_side in ('rechts', 'links')),
  add column gender         text check (gender in ('maennlich', 'weiblich', 'divers'));

grant update (city, playing_hand, preferred_side, gender, self_assessed_level)
  on table players to authenticated;

-- ------------------------------------------------------------
-- "Most Improved Player": größter Rating-Zuwachs im Verein seit p_since.
-- ------------------------------------------------------------
-- Gleiches Muster wie player_current_streak (0002): service_role-only,
-- liest aus rating_history. Erster/letzter Wert je Spieler im Fenster
-- über row_number(), nicht über min()/max() auf rating direkt — das
-- Rating ist nicht monoton, nur die Zeit ist es.
create or replace function club_most_improved(p_club_id uuid, p_since timestamptz)
returns uuid
language sql
stable
as $$
  with windowed as (
    select
      rh.player_id,
      rh.rating_before,
      rh.rating_after,
      row_number() over (partition by rh.player_id order by rh.created_at asc)  as rn_first,
      row_number() over (partition by rh.player_id order by rh.created_at desc) as rn_last
    from rating_history rh
    join club_memberships cm
      on cm.player_id = rh.player_id and cm.club_id = p_club_id
    where rh.reason = 'match' and rh.created_at >= p_since
  ),
  deltas as (
    select
      first_row.player_id,
      last_row.rating_after - first_row.rating_before as delta
    from (select player_id, rating_before from windowed where rn_first = 1) first_row
    join (select player_id, rating_after from windowed where rn_last = 1) last_row
      using (player_id)
  )
  select player_id from deltas order by delta desc limit 1;
$$;

revoke all on function club_most_improved(uuid, timestamptz) from public, anon, authenticated;
grant execute on function club_most_improved(uuid, timestamptz) to service_role;
