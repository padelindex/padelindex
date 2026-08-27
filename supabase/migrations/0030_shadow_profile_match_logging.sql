-- ============================================================
-- PadelIndex — Shadow-Profile beim Match melden
-- ============================================================
-- Bisher konnte nur ein Vereins-Admin einen Platzhalter für einen Spieler
-- ohne Account anlegen (admin_add_unclaimed_member, siehe
-- 0012_club_member_admin.sql) — auf der Verwaltungsseite, nicht beim
-- Melden selbst. Für "wir haben spontan zu viert gespielt, einer hat noch
-- keinen Account" reicht das nicht: der Melder soll das Profil direkt beim
-- Match melden anlegen können, ohne erst einen Admin zu bitten.
--
-- Eigene Funktion statt admin_add_unclaimed_member() zu erweitern:
--   1. anderer Aufrufkontext (jedes Vereinsmitglied statt nur Admins)
--      verdient ein eigenes origin, um beide Quellen später auseinander-
--      halten zu können.
--   2. der Rückgabewert braucht hier zusätzlich den handle — für die
--      Einladungs-Mail direkt im Anschluss (siehe matches.ts,
--      resolveMatchPlayerSlot() ruft danach startProfileClaim() aus
--      claims.ts) reicht die reine id nicht.
-- admin_add_unclaimed_member() bleibt unverändert, um dessen bestehenden
-- Aufrufer (club-members.ts) nicht anzufassen.

alter table players drop constraint if exists players_origin_check;
alter table players add constraint players_origin_check
  check (origin in ('signup', 'league_import', 'match_report'));

create or replace function create_shadow_player(p_club_id uuid, p_display_name text)
returns table(id uuid, handle text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_name      text := trim(p_display_name);
  v_handle    text;
begin
  if v_name = '' then
    raise exception 'Name darf nicht leer sein.';
  end if;

  v_handle := generate_unique_handle(v_name);

  insert into players (display_name, handle, claim_status, origin)
  values (v_name, v_handle, 'unclaimed', 'match_report')
  returning players.id into v_player_id;

  insert into club_memberships (club_id, player_id) values (p_club_id, v_player_id);

  return query select v_player_id, v_handle;
end;
$$;

-- Wie admin_add_unclaimed_member(): die Autorisierung ("ist der Aufrufer
-- Mitglied GENAU dieses Vereins?") prüft der TS-Aufrufer vorher nicht extra
-- — sie ergibt sich hier daraus, dass create_match_report() (0006) das neue
-- Profil ohnehin ablehnt, sobald es nicht Mitglied von p_club_id ist. Die
-- eigentliche Zugriffskontrolle bleibt trotzdem service_role-only, damit
-- niemand per direktem RPC-Call beliebige Vereine mit Platzhaltern fluten
-- kann.
revoke all on function create_shadow_player(uuid, text) from public, anon, authenticated;
grant execute on function create_shadow_player(uuid, text) to service_role;
