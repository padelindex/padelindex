-- ============================================================
-- PadelIndex — Head-to-Head & Teammate-Statistik (get_h2h_stats)
-- ============================================================
-- Zählt nur bestätigte, ratingwirksame Matches (status='confirmed' AND
-- rating_applied=true) — dieselbe Teilmenge, die auch die öffentliche
-- Matchhistorie zeigt (loadPublicMatchHistory liest über rating_history,
-- das erst nach apply_match_rating() Zeilen hat, siehe 0002).
--
-- Sieger-Logik ist 1:1 aus computeMatchRatings() (src/lib/rating-core.ts)
-- übernommen: gewonnene Sätze entscheiden, bei Gleichstand die Summe der
-- Games — kein zweiter Ort, an dem "wer hat gewonnen" anders definiert ist.
--
-- SECURITY INVOKER (kein DEFINER): die Funktion liest matches/
-- match_participants/match_sets über die RLS-Policies des aufrufenden
-- Sessions-Clients (matches_participant_read, match_participants_self_read,
-- match_sets_participant_read aus 0001) — die lassen nur Zeilen durch, an
-- denen auth.uid() selbst beteiligt ist. In der App ist player_a immer
-- locals.player.id (die eingeloggte Person), player_b das besuchte Profil;
-- ruft man mit zwei fremden IDs auf, kommen deshalb einfach 0 Zeilen
-- zurück statt fremder Matchdaten — kein zusätzlicher Autorisierungscode
-- in der Funktion nötig.

create or replace function get_h2h_stats(player_a uuid, player_b uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with shared_matches as (
    select
      m.id as match_id,
      pa.team as team_a,
      pb.team as team_b
    from matches m
    join match_participants pa
      on pa.match_id = m.id and pa.player_id = player_a
    join match_participants pb
      on pb.match_id = m.id and pb.player_id = player_b
    where m.status = 'confirmed'
      and m.rating_applied = true
      and player_a is distinct from player_b
  ),
  set_agg as (
    select
      ms.match_id,
      count(*) filter (where ms.team1_games > ms.team2_games) as team1_sets,
      count(*) filter (where ms.team2_games > ms.team1_games) as team2_sets,
      sum(ms.team1_games) as team1_games,
      sum(ms.team2_games) as team2_games
    from match_sets ms
    join shared_matches sm on sm.match_id = ms.match_id
    group by ms.match_id
  ),
  results as (
    select
      sm.team_a,
      sm.team_b,
      case
        when sa.team1_sets <> sa.team2_sets then sa.team1_sets > sa.team2_sets
        else sa.team1_games > sa.team2_games
      end as team1_won
    from shared_matches sm
    join set_agg sa on sa.match_id = sm.match_id
  )
  select jsonb_build_object(
    'as_opponents', count(*) filter (where team_a <> team_b),
    'wins_against', count(*) filter (
      where team_a <> team_b
        and ((team_a = 1 and team1_won) or (team_a = 2 and not team1_won))
    ),
    'losses_against', count(*) filter (
      where team_a <> team_b
        and ((team_a = 1 and not team1_won) or (team_a = 2 and team1_won))
    ),
    'as_teammates', count(*) filter (where team_a = team_b),
    'teammate_wins', count(*) filter (
      where team_a = team_b
        and ((team_a = 1 and team1_won) or (team_a = 2 and not team1_won))
    ),
    'teammate_losses', count(*) filter (
      where team_a = team_b
        and ((team_a = 1 and not team1_won) or (team_a = 2 and team1_won))
    )
  )
  from results;
$$;

-- Postgres grantet EXECUTE auf neue Funktionen standardmäßig an PUBLIC —
-- anon dürfte sie sonst stillschweigend mitaufrufen (harmlos, weil ohne
-- Session alle drei matches_*-Policies ohnehin leer sind und nur Nullen
-- zurückkämen, aber unnötig unklar). Explizit sperren, wie die anderen
-- Funktionen im Schema (0002, 0006, 0019, ...) es vormachen.
revoke all on function get_h2h_stats(uuid, uuid) from public;
grant execute on function get_h2h_stats(uuid, uuid) to authenticated;
