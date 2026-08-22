-- ============================================================
-- PadelIndex — Block 2 (Website-Audit): Beanspruchen-Verifizierung,
-- Warteliste Double-Opt-in + Vereinsfeld, Demo-Anfragen für Vereine
-- ============================================================

-- ------------------------------------------------------------
-- 1. Beanspruchen: manuelle Freigabe durch den Vereins-Admin
-- ------------------------------------------------------------
-- Bisher übernahm handle_new_user() ein Profil vollautomatisch, sobald der
-- Bestätigungslink geklickt wurde — es gab keinen Nachweis, dass die
-- E-Mail-Adresse wirklich der genannten Person gehört. Neuer
-- Zwischenschritt: nach dem Link-Klick steht das Profil auf
-- 'awaiting_review', erst der Vereins-Admin (kennt die Mitglieder
-- persönlich) schaltet es auf 'claimed' frei. Bis dahin verhält sich das
-- Profil überall wie unbeansprucht (alle bestehenden Checks vergleichen
-- exakt auf 'claimed', 'awaiting_review' fällt automatisch durch — siehe
-- Änderungsbericht im Chat).

alter table players drop constraint if exists players_claim_status_check;
alter table players add constraint players_claim_status_check
  check (claim_status in ('unclaimed', 'pending', 'awaiting_review', 'claimed', 'rejected'));

alter table players add column if not exists approved_at timestamptz;
alter table players add column if not exists approved_by uuid references players(id) on delete set null;

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
    -- claimed_at = E-Mail-Besitz bestätigt, approved_at = Vereins-Admin hat
    -- zugestimmt (separater Schritt, siehe oben).
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

  -- 2. Kein Claim: frisches Profil wie bisher (kein Identitätsrisiko,
  -- niemand übernimmt fremde Historie) -> weiterhin sofort 'claimed'.
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
-- 2. Warteliste: Double-Opt-in + optionales Vereinsfeld
-- ------------------------------------------------------------
-- Bisher landete die E-Mail sofort in der Warteliste, ohne dass jemand
-- bestätigt hat, dass sie ihm gehört (Spam-/Tippfehler-Risiko, und die
-- Einwilligung aus der Datenschutzerklärung war so nur behauptet, nicht
-- nachgewiesen). token_hash + confirmed_at wie bei delisting_requests.

alter table waitlist add column if not exists club_name text;
alter table waitlist add column if not exists token_hash text;
alter table waitlist add column if not exists confirmed_at timestamptz;

create unique index if not exists waitlist_token_hash_idx on waitlist (token_hash);

-- ------------------------------------------------------------
-- 3. Demo-Anfragen von Vereinen (getrennter Funnel, siehe Chat)
-- ------------------------------------------------------------
create table if not exists club_demo_requests (
  id            uuid primary key default gen_random_uuid(),
  club_name     text not null,
  contact_name  text not null,
  email         text not null,
  message       text,
  created_at    timestamptz not null default now(),
  constraint club_demo_requests_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

alter table club_demo_requests enable row level security;
-- Keine Policy für anon/authenticated: läuft ausschließlich über
-- service_role, wie waitlist/profile_claims/delisting_requests.

-- ------------------------------------------------------------
-- Reversibel (manuell, falls nötig):
-- alter table players drop column if exists approved_at, drop column if exists approved_by;
-- alter table players drop constraint if exists players_claim_status_check;
-- alter table players add constraint players_claim_status_check
--   check (claim_status in ('unclaimed', 'pending', 'claimed'));
-- (handle_new_user() müsste auf die 0012-Fassung zurückgebaut werden)
-- alter table waitlist drop column if exists club_name, drop column if exists token_hash, drop column if exists confirmed_at;
-- drop table if exists club_demo_requests;
-- ------------------------------------------------------------
