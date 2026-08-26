-- ============================================================
-- PadelIndex — Werbe- & Sponsoring-System: campaigns
-- ============================================================
-- Schreiben läuft ausschließlich über service_role (Super-Admin-UI unter
-- /admin/advertising, siehe lib/server/advertising.ts) — es gibt bewusst
-- keine INSERT/UPDATE/DELETE-Policies für anon/authenticated, gleiches
-- Muster wie clubs/club_admins in 0001_schema.sql/platform-admin.ts.
--
-- Lesen ist dagegen für jeden offen, ABER nur für Kampagnen, die gerade
-- WIRKLICH laufen (is_active + im Datumsfenster) — <AdBanner> fragt direkt
-- mit dem anon-Key vom Browser aus ab (siehe lib/components/AdBanner.svelte),
-- ein Server-Roundtrip würde hier nichts zusätzlich absichern. Damit sind
-- Entwürfe, pausierte und ausgelaufene Kampagnen für die Öffentlichkeit
-- unsichtbar, ohne dass die Abfrage selbst is_active/Datum extra filtern
-- müsste (RLS übernimmt das).
--
-- Klick-/Impressions-Zählung läuft NICHT über UPDATE-Rechte auf die
-- Tabelle (die anon/authenticated nie bekommen), sondern ausschließlich
-- über increment_campaign_stat() — eine SECURITY DEFINER-Funktion, die nur
-- genau "impressions+1" oder "clicks+1" auf eine aktuell laufende Kampagne
-- erlaubt und sonst nichts.

create table if not exists campaigns (
  id             uuid primary key default gen_random_uuid(),
  sponsor_name   text not null,
  logo_url       text,
  banner_url     text not null,
  target_url     text not null,
  campaign_name  text not null,
  start_date     timestamptz not null,
  end_date       timestamptz not null,
  position       text not null
                   check (position in ('desktop_leaderboard', 'content_ad', 'mobile_banner')),
  target_region  text,
  impressions    int not null default 0 check (impressions >= 0),
  clicks         int not null default 0 check (clicks >= 0),
  is_active      boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint campaigns_end_after_start check (end_date > start_date)
);

-- Trägt die Abfrage aus AdBanner.svelte (position + is_active + Datumsfenster).
create index if not exists campaigns_serving_idx
  on campaigns (position, is_active, start_date, end_date);

alter table campaigns enable row level security;

create policy campaigns_public_read_running on campaigns
  for select
  using (
    is_active = true
    and start_date <= now()
    and end_date >= now()
  );

grant select on table campaigns to anon, authenticated;

-- ------------------------------------------------------------
-- Klick-/Impressions-Zählung: sichere RPC statt UPDATE-Rechten
-- ------------------------------------------------------------
-- p_metric statt zweier Funktionen, damit AdBanner.svelte eine einzige,
-- kleine Aufruf-Helper-Funktion braucht (siehe incrementCampaignStat() in
-- lib/advertising.ts). Nur 'impression'/'click' sind gültig; alles andere
-- wirft eine Exception. Die WHERE-Klausel spiegelt exakt die Public-Read-
-- Policy oben — eine bereits abgelaufene oder pausierte Kampagne lässt sich
-- so nicht mehr "nachträglich" hochzählen, selbst wenn ein Client die ID
-- noch aus einer früheren, damals aktiven Abfrage kennt.
create or replace function increment_campaign_stat(
  p_campaign_id uuid,
  p_metric      text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_metric not in ('impression', 'click') then
    raise exception 'Ungültige Metrik: %', p_metric;
  end if;

  update campaigns
     set impressions = impressions + case when p_metric = 'impression' then 1 else 0 end,
         clicks      = clicks      + case when p_metric = 'click'      then 1 else 0 end
   where id = p_campaign_id
     and is_active = true
     and start_date <= now()
     and end_date >= now();
end;
$$;

revoke all on function increment_campaign_stat(uuid, text) from public, anon, authenticated;
grant execute on function increment_campaign_stat(uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- drop function if exists increment_campaign_stat(uuid, text);
-- drop table if exists campaigns;
-- ------------------------------------------------------------
