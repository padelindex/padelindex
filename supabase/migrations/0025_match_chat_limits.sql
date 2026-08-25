-- ============================================================
-- PadelIndex — Match-Chat: Länge & Spam-Schutz auf DB-Ebene
-- ============================================================
-- match_messages wird direkt vom Client mit dessen eigenem JWT beschrieben
-- (RLS statt einer service_role-RPC, siehe 0023_match_chat.sql) — schnell
-- fürs Realtime-Gefühl, aber die einzige bisherige Kontrolle über Länge
-- und Leer-Nachrichten war cleanChatMessage() in lib/chat.ts, rein im
-- Browser. Ein direkter REST-Call mit demselben JWT (Browser-Konsole,
-- curl mit dem Access-Token) läuft daran vorbei — ohne DB-seitige Grenze
-- könnte er beliebig lange oder leere content-Werte einschleusen und in
-- Schleife beliebig viele Zeilen pro Sekunde erzeugen (Spam/Storage-
-- Missbrauch). Zwei Ergänzungen dagegen:
--
--  1. check-Constraint: dieselbe Obergrenze (2000 Zeichen) wie
--     MAX_MESSAGE_LENGTH in lib/chat.ts, plus "nicht nur Leerzeichen".
--  2. Rate-Limit über check_rate_limit() aus 0019_password_auth.sql,
--     aus dem BEFORE-INSERT-Trigger heraus aufgerufen — die Funktion ist
--     zwar service_role-only (revoke ... from authenticated), aber der
--     Trigger läuft SECURITY DEFINER wie match_messages_fill_sender()
--     nebenan, also mit den Rechten des Funktions-Eigentümers, nicht der
--     einfügenden Session. Bucket ist pro Absender, nicht pro Thread —
--     eine Person soll nicht einfach auf einen zweiten Thread ausweichen.

alter table match_messages
  add constraint match_messages_content_length
  check (char_length(content) <= 2000 and char_length(btrim(content)) > 0);

create or replace function match_messages_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'user' then
    if not check_rate_limit('chat:sender', new.sender_id::text, 20, interval '60 seconds') then
      raise exception 'Zu viele Nachrichten in kurzer Zeit — bitte kurz warten.';
    end if;
  end if;

  return new;
end;
$$;

-- Läuft VOR match_messages_fill_sender_trg (Trigger-Reihenfolge ist
-- alphabetisch nach Name: "enforce" < "fill") — unproblematisch, da diese
-- Funktion nur new.kind/new.sender_id liest, die vom Client selbst gesetzt
-- werden, nicht von fill_sender() erst noch befüllt werden müssen.
create trigger match_messages_enforce_rate_limit_trg
  before insert on match_messages
  for each row execute function match_messages_enforce_rate_limit();

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop trigger if exists match_messages_enforce_rate_limit_trg on match_messages;
-- drop function if exists match_messages_enforce_rate_limit();
-- alter table match_messages drop constraint if exists match_messages_content_length;
-- ------------------------------------------------------------
