-- ============================================================
-- PadelIndex — Prämien einlösen (einfachste Version)
-- ============================================================
-- Play -> Earn -> Redeem: token_transactions ("Earn") existiert schon
-- seit 0001 und wird seit dem Match-Flow korrekt befüllt. Was fehlt, ist
-- "Redeem". Bewusst als ZWEITE, eigene Tabelle statt negativer Zeilen in
-- token_transactions: dessen amount-Constraint (amount > 0) erzwingt,
-- dass das Gutschrift-Ledger ausschließlich additiv bleibt — "Niederlagen
-- kosten nie Tokens" gilt dann strukturell, nicht nur per Konvention.
-- Der Kontostand ist die Differenz aus beiden Tabellen.
--
-- Prämien pflegt vorerst niemand über eine App-UI — das kommt erst mit
-- dem Vereins-Admin (nächster Schritt). Bis dahin trägt ein Verein seine
-- 2-3 Prämien direkt hier oder im SQL Editor ein; der Pilotverein bekommt
-- unten drei Startprämien, damit auf /konto sofort etwas zum Einlösen da ist.

create table rewards (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  title       text not null,
  description text,
  cost        int not null check (cost > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index rewards_club_idx on rewards (club_id) where active;

-- cost UND title sind Schnappschüsse zum Einlösezeitpunkt, entkoppelt vom
-- Katalog: ein Preis, der sich später ändert, darf den historischen
-- Kontostand nicht rückwirkend verändern — und rewards_public_read zeigt
-- nur active=true, ein später deaktivierter Titel darf trotzdem lesbar
-- bleiben (sonst reißt der Join in der eigenen Historie klaffende Lücken).
create table reward_redemptions (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  reward_id     uuid not null references rewards(id) on delete restrict,
  club_id       uuid not null references clubs(id) on delete cascade,
  reward_title  text not null,
  cost          int not null check (cost > 0),
  created_at    timestamptz not null default now()
);

create index reward_redemptions_player_idx on reward_redemptions (player_id, created_at desc);

alter table rewards enable row level security;
alter table reward_redemptions enable row level security;

-- Prämienkatalog ist Vereins-öffentliche Info, wie clubs/club_memberships
-- (memberships_public_read in 0001) — nur aktive Prämien, Verein blendet
-- ausverkaufte/pausierte einfach über active=false aus.
create policy rewards_public_read on rewards
  for select using (active);

create policy reward_redemptions_self_read on reward_redemptions
  for select using (player_id = current_player_id());

grant select on table rewards, reward_redemptions to anon, authenticated;

-- ------------------------------------------------------------
-- Einlösen: atomar, gegen Race Conditions (Doppelklick, zwei Tabs)
-- über einen Advisory Lock pro Spieler abgesichert.
-- ------------------------------------------------------------
create or replace function redeem_reward(
  p_player_id uuid,
  p_reward_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id     uuid;
  v_title       text;
  v_cost        int;
  v_active      boolean;
  v_is_member   boolean;
  v_balance     int;
  v_redemption  uuid;
begin
  -- Pro Spieler serialisieren: zwei gleichzeitige Einlösungen dürfen sich
  -- nicht beide auf denselben (dann veralteten) Kontostand stützen.
  perform pg_advisory_xact_lock(hashtextextended(p_player_id::text, 0));

  select club_id, title, cost, active into v_club_id, v_title, v_cost, v_active
  from rewards
  where id = p_reward_id;

  if not found then
    raise exception 'Prämie % nicht gefunden', p_reward_id;
  end if;
  if not v_active then
    raise exception 'Diese Prämie ist nicht mehr verfügbar.';
  end if;

  select exists(
    select 1 from club_memberships
    where club_id = v_club_id and player_id = p_player_id
  ) into v_is_member;
  if not v_is_member then
    raise exception 'Diese Prämie gehört nicht zu deinem Verein.';
  end if;

  select
    coalesce((select sum(amount) from token_transactions where player_id = p_player_id), 0)
    - coalesce((select sum(cost) from reward_redemptions where player_id = p_player_id), 0)
  into v_balance;

  if v_balance < v_cost then
    raise exception 'Nicht genug Tokens (% von % benötigt).', v_balance, v_cost;
  end if;

  insert into reward_redemptions (player_id, reward_id, club_id, reward_title, cost)
  values (p_player_id, p_reward_id, v_club_id, v_title, v_cost)
  returning id into v_redemption;

  return v_redemption;
end;
$$;

revoke all on function redeem_reward(uuid, uuid) from public, anon, authenticated;
grant execute on function redeem_reward(uuid, uuid) to service_role;

-- ------------------------------------------------------------
-- Startprämien für den Pilotverein
-- ------------------------------------------------------------
insert into rewards (club_id, title, description, cost)
select id, 'Trainerstunde', 'Eine Stunde Training mit einem Trainer des Vereins.', 500
from clubs where slug = 'stc-oberland'
union all
select id, 'Dose Bälle', 'Eine Dose Padelbälle aus dem Vereinsshop.', 150
from clubs where slug = 'stc-oberland'
union all
select id, 'Startgebühr Vereinsturnier', 'Deckt die Startgebühr für ein internes Turnier.', 300
from clubs where slug = 'stc-oberland';
