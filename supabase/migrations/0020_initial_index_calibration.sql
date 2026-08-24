-- ============================================================
-- PadelIndex — Admin-Kalibrierung: Skill-Einstufung für neue Spieler
-- ============================================================
-- Cold-Start-Problem: ein erfahrener Neuzugang startet sonst mit dem
-- MU/Sigma-Standardwert (players-Default aus 0001) und trifft in den
-- ersten Matches auf Anfänger, bevor genug Matches gespielt sind, um das
-- echte Niveau zu belegen. Ein Vereins-Admin, der den Spieler persönlich
-- kennt, darf deshalb VOR dessen erstem Match einen Startwert setzen.
--
-- Architektur folgt exakt 0012_club_member_admin.sql
-- (admin_add_unclaimed_member): eine SECURITY DEFINER-Funktion,
-- ausschließlich an service_role gegrantet. Die Autorisierung ("ist
-- diese Person Admin GENAU dieses Vereins UND ist der Spieler
-- Mitglied?") prüft wie überall der Aufrufer in TypeScript
-- (isClubAdmin() + isClubMember(), siehe club-admin.ts/club-members.ts)
-- VOR dem Call — nicht hier. Es gibt bewusst KEINE RLS-UPDATE-Policy auf
-- players für mu/sigma: dafür existiert nirgends ein GRANT UPDATE an
-- authenticated (siehe 0010_player_profile.sql), und das bleibt so —
-- der einzige Schreibweg bleibt dieser service_role-only RPC-Call.
--
-- Die "nur vor dem ersten Match"-Grenze ist KEIN neues Konzept: sie
-- existiert bereits als players.external_seed_locked (0003_external_
-- claims.sql) für die Nachweis-Seeds von anderen Plattformen — dieselbe
-- Sperre passt hier 1:1 ("0 Matches gespielt"), also wird sie geteilt
-- statt ein zweites, leicht abweichendes Flag einzuführen.
--
-- Was hier NEU an DB-seitiger Durchsetzung dazukommt (über die
-- TypeScript-Autorisierung hinaus):
--   1. admin_set_initial_index() verweigert den Call, sobald
--      external_seed_locked = true — unabhängig davon, ob der Aufrufer
--      das TS-seitig schon geprüft hat.
--   2. Ein Trigger auf players sperrt zusätzlich JEDE Änderung an mu,
--      sobald external_seed_locked = true UND sich matches_played dabei
--      NICHT mitändert (= kein echtes Match über apply_match_rating) —
--      als Netz für den Fall, dass künftiger Code versehentlich direkt
--      auf players schreibt, statt über apply_match_rating() zu gehen.

-- ------------------------------------------------------------
-- 1. Spalten + Konsistenz-Constraint
-- ------------------------------------------------------------
-- Rein deskriptiv (fürs Admin-Dashboard: "wurde kalibriert, auf welche
-- Stufe") — NICHT die Sperre selbst, die ist external_seed_locked.
alter table players
  add column if not exists initial_index_set  boolean not null default false,
  add column if not exists initial_index_tier text
    check (initial_index_tier in ('beginner', 'intermediate', 'advanced'));

alter table players drop constraint if exists players_initial_index_consistency;
alter table players add constraint players_initial_index_consistency
  check ((initial_index_tier is null) = (initial_index_set is false));

-- ------------------------------------------------------------
-- 2. Schutz-Trigger: mu nach Sperre nur noch über apply_match_rating()
--    (matches_played ändert sich im selben Update mit)
-- ------------------------------------------------------------
create or replace function guard_player_index_integrity()
returns trigger
language plpgsql
as $$
begin
  if new.mu is distinct from old.mu
     and old.external_seed_locked
     and new.matches_played = old.matches_played then
    raise exception
      'players.mu ist gesperrt (external_seed_locked) — nur apply_match_rating() darf es nach dem ersten Match noch ändern.';
  end if;
  return new;
end;
$$;

drop trigger if exists players_guard_index_integrity on players;
create trigger players_guard_index_integrity
  before update on players
  for each row execute function guard_player_index_integrity();

-- ------------------------------------------------------------
-- 3. admin_set_initial_index(): Skill-Stufe -> mu/sigma, atomar + Audit
-- ------------------------------------------------------------
-- Zielwerte MÜSSEN mit SKILL_TIER_TARGET_INDEX in rating-core.ts
-- übereinstimmen (dort auch seedRatingForTier() für TS-Seite + Tests).
-- Gleiches Muster wie apply_match_rating (0002): Zeile sperren,
-- Vorbedingung prüfen, Players + rating_history atomar in einer
-- Transaktion schreiben.
create or replace function admin_set_initial_index(
  p_player_id  uuid,
  p_skill_tier text,
  p_admin_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked         boolean;
  v_matches_played int;
  v_mu_before      numeric;
  v_sigma_before   numeric;
  v_rating_before  numeric;
  v_target         numeric;
  v_sigma_after    numeric := 25.0 / 3.0; -- BASE_SIGMA
  v_mu_after       numeric;
begin
  select external_seed_locked, matches_played, mu, sigma, rating
    into v_locked, v_matches_played, v_mu_before, v_sigma_before, v_rating_before
    from players
   where id = p_player_id
     for update;

  if not found then
    raise exception 'Spieler % nicht gefunden.', p_player_id;
  end if;

  if v_locked then
    raise exception
      'Spieler hat bereits ein Match gespielt (matches_played=%) — Kalibrierung nicht mehr möglich.',
      v_matches_played;
  end if;

  v_target := case p_skill_tier
    when 'beginner'     then 1.0
    when 'intermediate' then 3.0
    when 'advanced'     then 5.0
    else null
  end;

  if v_target is null then
    raise exception 'Unbekannte Skill-Stufe: %', p_skill_tier;
  end if;

  v_mu_after := v_target * 50.0 / 7.0 + 2 * v_sigma_after;

  update players
     set mu                 = v_mu_after,
         sigma               = v_sigma_after,
         initial_index_set   = true,
         initial_index_tier  = p_skill_tier
   where id = p_player_id;

  insert into rating_history (
    player_id, mu_before, sigma_before, mu_after, sigma_after,
    rating_before, rating_after, factors, reason
  ) values (
    p_player_id, v_mu_before, v_sigma_before, v_mu_after, v_sigma_after,
    v_rating_before, v_target,
    jsonb_build_object('skillTier', p_skill_tier, 'setByAdminId', p_admin_id),
    'manual_adjust'
  );
end;
$$;

revoke all on function admin_set_initial_index(uuid, text, uuid) from public, anon, authenticated;
grant execute on function admin_set_initial_index(uuid, text, uuid) to service_role;
