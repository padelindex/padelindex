-- ============================================================
-- PadelIndex — Vereins-Admin: Mitglieder pflegen
-- ============================================================
-- Bisher gab es KEINEN Weg, wie ein Spieler einem Verein beitritt außer
-- per manuellem SQL-Import — club_memberships.role (0001) wird nirgends
-- im Code gelesen, das war schon immer nur Deko. Das hier schließt die
-- Lücke: Vereins-Admins können bestehende, registrierte Spieler suchen
-- und hinzufügen, oder — wie beim ursprünglichen Liga-Import — einen
-- unbeanspruchten Platzhalter für jemanden anlegen, der sich noch nicht
-- selbst registriert hat.
--
-- generate_unique_handle() ist aus handle_new_user() (0001) herausgezogen,
-- damit beide Wege (Signup, Admin legt Mitglied an) exakt dieselbe
-- Slugify+Eindeutigkeits-Logik verwenden statt einer zweiten Kopie.

create or replace function generate_unique_handle(p_name text)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_handle text;
begin
  v_handle := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_handle := trim(both '-' from v_handle);
  if v_handle is null or v_handle = '' then
    v_handle := 'player';
  end if;
  if exists (select 1 from players where handle = v_handle) then
    v_handle := v_handle || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  end if;
  return v_handle;
end;
$$;

revoke all on function generate_unique_handle(text) from public, anon, authenticated;
-- Kein Grant an service_role nötig: wird nur intern von security-definer-
-- Funktionen aufgerufen, nie direkt per RPC.

-- Nur die Handle-Slugify-Zeilen sind hier ersetzt (jetzt
-- generate_unique_handle(v_name) statt Inline-Logik) — der Rest ist
-- unverändert die Claim-Verknüpfung aus 0005_claimable_profiles.sql.
-- Wichtig: NICHT auf die ursprüngliche 0001-Fassung zurückfallen, die
-- players.id direkt auf auth.users.id setzt statt user_id — das würde
-- die Entkopplung aus 0005 rückgängig machen.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim_id   uuid;
  v_player_id  uuid;
  v_linked     int;
  v_name       text;
begin
  -- 1. Offenen Claim für diese E-Mail suchen
  select pc.id, pc.player_id
    into v_claim_id, v_player_id
    from profile_claims pc
   where lower(pc.email) = lower(new.email)
     and pc.status = 'pending'
     and pc.expires_at > now()
   order by pc.created_at desc
   limit 1;

  if v_claim_id is not null then
    update players
       set user_id      = new.id,
           claim_status = 'claimed',
           claimed_at   = now()
     where id = v_player_id
       and user_id is null;

    get diagnostics v_linked = row_count;

    if v_linked = 1 then
      update profile_claims
         set status = 'approved', resolved_at = now()
       where id = v_claim_id;
      return new;
    end if;

    -- Profil war schon vergeben -> Claim entwerten, normal weitermachen
    update profile_claims
       set status = 'rejected', resolved_at = now()
     where id = v_claim_id;
  end if;

  -- 2. Kein Claim: frisches Profil wie bisher
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1),
    'Spieler'
  );

  insert into players (user_id, display_name, handle, claim_status, origin)
  values (new.id, v_name, generate_unique_handle(v_name), 'claimed', 'signup');

  return new;
end;
$$;

-- ------------------------------------------------------------
-- Unbeanspruchtes Mitglied anlegen (wie beim Liga-Import, nur durch
-- einen Vereins-Admin statt per SQL-Skript). Autorisierung ("ist diese
-- Person Admin GENAU dieses Vereins?") prüft wie überall der Aufrufer
-- in TypeScript (isClubAdmin) VOR diesem Call, nicht hier — service_role
-- ist der einzige Grantee.
-- ------------------------------------------------------------
create or replace function admin_add_unclaimed_member(p_club_id uuid, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_name text := trim(p_display_name);
begin
  if v_name = '' then
    raise exception 'Name darf nicht leer sein.';
  end if;

  insert into players (display_name, handle, claim_status, origin)
  values (v_name, generate_unique_handle(v_name), 'unclaimed', 'league_import')
  returning id into v_player_id;

  insert into club_memberships (club_id, player_id) values (p_club_id, v_player_id);

  return v_player_id;
end;
$$;

revoke all on function admin_add_unclaimed_member(uuid, text) from public, anon, authenticated;
grant execute on function admin_add_unclaimed_member(uuid, text) to service_role;
