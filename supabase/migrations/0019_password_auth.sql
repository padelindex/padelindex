-- ============================================================
-- PadelIndex — klassische Registrierung (E-Mail + Passwort)
-- ============================================================
-- Bisher ausschließlich Magic Link (Supabase Auth, siehe
-- 0005_claimable_profiles.sql / 0015_block2.sql). Das hier ist KEINE
-- zweite Auth-Lösung: signUp({email, password}) legt weiterhin nur eine
-- Zeile in auth.users an — derselbe Trigger handle_new_user() läuft
-- danach genau wie beim Magic-Link-Flow, dieselben Cookies/Sessions aus
-- hooks.server.ts gelten unverändert. Nur der "wie meldet man sich an"-
-- Teil bekommt eine zweite Tür (Passwort zusätzlich zu Magic Link),
-- keine zweite Tabelle für Identität.
--
-- Email-Bestätigung selbst braucht keinen neuen Code: Supabase Auth
-- verwaltet Bestätigungs-/Recovery-Tokens (gehasht, zeitlich begrenzt,
-- einmal verwendbar) bereits intern. Voraussetzung ist [auth.email]
-- enable_confirmations = true (siehe supabase/config.toml) UND im
-- Supabase-Dashboard des LIVE-Projekts dieselbe Einstellung (config.toml
-- gilt nur für die lokale CLI) — siehe README.

-- ------------------------------------------------------------
-- 1. Registrierungsfelder auf players
-- ------------------------------------------------------------
-- Alle drei nullable: Bestandszeilen (importierte/ältere Profile) haben
-- sie nicht, und sie werden AUSSCHLIESSLICH vom SECURITY DEFINER-Trigger
-- unten gesetzt (kein GRANT UPDATE an authenticated) — ein Spieler kann
-- sein eigenes Geburtsdatum später nicht mehr verändern. Das ist Absicht:
-- das Feld soll für Altersklassen/Rankings verlässlich bleiben.
alter table players
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists birth_date date,
  add column if not exists club_name  text;

-- Grobe Plausibilitätsgrenze, kein Ersatz für die Server-Validierung bei
-- der Registrierung (dort wird auf ein sinnvolles Mindestalter geprüft) —
-- nur ein Sicherheitsnetz gegen kaputte Werte, falls ein Bug den Trigger
-- je mit Unsinn füttert.
alter table players drop constraint if exists players_birth_date_range;
alter table players add constraint players_birth_date_range
  check (
    birth_date is null
    or (birth_date <= current_date - interval '5 years'
        and birth_date >= current_date - interval '120 years')
  );

-- players.birth_date ist rein privat (players_self_select aus 0005 lässt
-- ohnehin nur die eigene Zeile durch) — club_leaderboard (0014) selektiert
-- seine Spalten explizit und nimmt birth_date/first_name/last_name nicht
-- auf, taucht also nirgends öffentlich auf.

-- ------------------------------------------------------------
-- 2. handle_new_user(): Registrierungsfelder nur beim FRISCHEN Profil
-- ------------------------------------------------------------
-- Der Claim-Zweig (bestehendes, importiertes Profil wird durch einen
-- Claim-Link verknüpft) bleibt exakt wie in 0015_block2.sql — ein
-- Import-Profil hat schon einen display_name aus der Ligatabelle, den
-- soll niemand durch Registrierungsdaten überschreiben. Nur der
-- "kein offener Claim" -> neues Profil-Zweig bekommt die neuen Felder.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim_id    uuid;
  v_player_id   uuid;
  v_linked      int;
  v_name        text;
  v_first_name  text;
  v_last_name   text;
  v_birth_date  date;
  v_club_name   text;
begin
  -- 1. Offenen Claim für diese E-Mail suchen (unverändert aus 0015)
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
           claim_status = 'awaiting_review',
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

  -- 2. Kein Claim: frisches Profil.
  -- first_name/last_name kommen aus der klassischen Registrierung
  -- (raw_user_meta_data, von signUp({options:{data:{...}}}) gesetzt).
  -- Für Magic-Link-Signups ohne diese Felder (z.B. /anmelden mit
  -- shouldCreateUser, falls das je aktiviert würde) bleibt der bisherige
  -- Fallback auf E-Mail-Lokalteil/"Spieler" erhalten.
  v_first_name := nullif(trim(new.raw_user_meta_data->>'first_name'), '');
  v_last_name  := nullif(trim(new.raw_user_meta_data->>'last_name'), '');
  v_club_name  := nullif(trim(new.raw_user_meta_data->>'club_name'), '');

  begin
    v_birth_date := nullif(trim(new.raw_user_meta_data->>'birth_date'), '')::date;
  exception when others then
    v_birth_date := null;
  end;

  v_name := coalesce(
    nullif(trim(concat_ws(' ', v_first_name, v_last_name)), ''),
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1),
    'Spieler'
  );

  insert into players (
    user_id, display_name, handle, claim_status, origin,
    first_name, last_name, birth_date, club_name
  )
  values (
    new.id, v_name, generate_unique_handle(v_name), 'claimed', 'signup',
    v_first_name, v_last_name, v_birth_date, v_club_name
  );

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. Rate Limiting (Registrierung, Login, Passwort-Reset)
-- ------------------------------------------------------------
-- Zusätzlich zu Supabase Auths eigenen Limits (auth.rate_limit in
-- config.toml, gilt aufs ganze Projekt) eine eigene, feingranulare
-- Bremse pro Aktion+Schlüssel (IP oder E-Mail) — service_role-only,
-- gleiches Muster wie profile_claims/waitlist (RLS an, keine Policy).
create table if not exists auth_rate_limit_hits (
  id          bigint generated always as identity primary key,
  bucket      text not null,
  key         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists auth_rate_limit_hits_lookup_idx
  on auth_rate_limit_hits (bucket, key, created_at);

alter table auth_rate_limit_hits enable row level security;

-- Wird pro Registrierung/Login/Reset-Versand aufgerufen. true = erlaubt
-- (und der Versuch wurde gezählt), false = Limit erreicht (nicht
-- gezählt, ein weiterer Versuch im selben Fenster bleibt möglich, sobald
-- ältere Treffer aus dem Fenster fallen).
create or replace function check_rate_limit(
  p_bucket text,
  p_key    text,
  p_max    int,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from auth_rate_limit_hits
   where bucket = p_bucket and key = p_key and created_at < now() - p_window;

  select count(*) into v_count
    from auth_rate_limit_hits
   where bucket = p_bucket and key = p_key and created_at > now() - p_window;

  if v_count >= p_max then
    return false;
  end if;

  insert into auth_rate_limit_hits (bucket, key) values (p_bucket, p_key);
  return true;
end;
$$;

revoke all on function check_rate_limit(text, text, int, interval) from public, anon, authenticated;
grant execute on function check_rate_limit(text, text, int, interval) to service_role;

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop function if exists check_rate_limit(text, text, int, interval);
-- drop table if exists auth_rate_limit_hits;
-- (handle_new_user() müsste auf die 0015-Fassung zurückgebaut werden)
-- alter table players drop constraint if exists players_birth_date_range;
-- alter table players drop column if exists first_name, drop column if exists last_name,
--   drop column if exists birth_date, drop column if exists club_name;
-- ------------------------------------------------------------
