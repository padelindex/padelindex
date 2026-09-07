-- ============================================================
-- PadelIndex — Registrierungsfelder einmalig nachtragen
-- ============================================================
-- 0019_password_auth.sql hat first_name/last_name/birth_date/club_name
-- bewusst OHNE GRANT UPDATE an authenticated eingeführt: ein Spieler soll
-- sein einmal gesetztes Geburtsdatum nicht mehr ändern können (Alters-
-- klassen/Rankings sollen verlässlich bleiben). Das trifft aber auch
-- Profile, die nie über die Registrierung entstanden sind (importierte
-- Vereins-Profile, per Magic Link beansprucht — siehe 0005) und diese
-- Felder deshalb schlicht nie gesetzt bekamen: für die gibt es aktuell
-- keinen Weg, sie überhaupt einmal einzutragen.
--
-- fill_own_registration_fields() schließt genau diese Lücke, ohne die
-- Sperre aufzuweichen: pro Feld greift coalesce(spalte, neuer_wert) —
-- ist die Spalte schon gesetzt (egal ob durch Registrierung oder einen
-- früheren Aufruf dieser Funktion), gewinnt IMMER der bestehende Wert,
-- der übergebene wird stillschweigend ignoriert. Kein Locking nötig:
-- coalesce() liest den aktuellen Spaltenwert innerhalb desselben
-- atomaren UPDATE.
--
-- SECURITY DEFINER, weil die Spalten weiterhin kein GRANT UPDATE an
-- authenticated haben (Absicht, s.o.) — die Funktion selbst ist die
-- einzige Schreibstelle, und sie beschränkt sich über auth.uid() strikt
-- auf die eigene Zeile.
create or replace function fill_own_registration_fields(
  p_first_name text default null,
  p_last_name  text default null,
  p_birth_date date default null,
  p_club_name  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  update players
     set first_name = coalesce(first_name, nullif(trim(p_first_name), '')),
         last_name  = coalesce(last_name, nullif(trim(p_last_name), '')),
         birth_date = coalesce(birth_date, p_birth_date),
         club_name  = coalesce(club_name, nullif(trim(p_club_name), ''))
   where user_id = v_uid;

  if not found then
    raise exception 'Kein Profil für diesen Account gefunden.';
  end if;
end;
$$;

revoke all on function fill_own_registration_fields(text, text, date, text) from public, anon;
grant execute on function fill_own_registration_fields(text, text, date, text) to authenticated;
