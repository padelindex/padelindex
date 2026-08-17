-- Waitlist: Insert über die Publishable/Anon-Key, ohne service_role.
-- Kein SELECT für anon — Duplikate laufen als unique-violation ins API.

create policy waitlist_anon_insert on waitlist
  for insert
  to anon
  with check (true);

grant insert on table waitlist to anon;
