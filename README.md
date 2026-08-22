# PadelIndex

> **Proprietary software.** This repository is **not** open source. All rights reserved — see [LICENSE](LICENSE).

Unabhängige Rangliste für Padel-Amateure. SvelteKit auf Cloudflare Pages, Daten in Supabase.

Die Landing-Page, das Vereins-Widget und der Rating-Kern liegen in diesem Repo. Phase 1: Site, Waitlist, öffentliches Club-Leaderboard. Noch kein Login und kein Match-Melden.

## Stack

- **SvelteKit** mit `@sveltejs/adapter-cloudflare`
- **Cloudflare Pages** — Hosting für Landing, App, API, `embed.js`
- **Supabase** — Postgres, Auth, später Realtime und Storage
- **GitHub** — nur Source (`padelindex/padelindex`). Hosting ist Cloudflare Pages, nicht GitHub Pages.

## Lokal starten

```bash
cp .env.example .env
# Keys eintragen, siehe unten
npm install
npm run dev
```

- Site: [http://localhost:5173](http://localhost:5173)
- Club-Seite: `/c/stc-oberland`
- Widget-API: `/api/v1/clubs/stc-oberland/leaderboard?limit=10`
- iframe-Fallback: `/embed/stc-oberland`
- Widget-Skript: `/embed.js`

Ohne Supabase-Keys läuft die Landing trotzdem. Waitlist und Leaderboard antworten dann mit 503.

```bash
npm test
npm run check
npm run build
```

## Was du anlegen musst

### 1. Supabase-Projekt

1. Projekt in der EU anlegen (z.B. `eu-central-1`).
2. SQL in dieser Reihenfolge im SQL Editor ausführen:
   - [`supabase/migrations/0001_schema.sql`](supabase/migrations/0001_schema.sql)
   - [`supabase/migrations/0002_apply_match_rating.sql`](supabase/migrations/0002_apply_match_rating.sql)
   - [`supabase/migrations/0003_external_claims.sql`](supabase/migrations/0003_external_claims.sql)
   - [`supabase/migrations/0004_waitlist_anon_insert.sql`](supabase/migrations/0004_waitlist_anon_insert.sql)
   - [`supabase/migrations/0005_claimable_profiles.sql`](supabase/migrations/0005_claimable_profiles.sql)
   - … (0006–0018, siehe `supabase/migrations/`)
   - [`supabase/migrations/0019_password_auth.sql`](supabase/migrations/0019_password_auth.sql)
3. Authentication → Providers: **Email** (Magic Link + Passwort, siehe
   "Registrierung mit Passwort" weiter unten für die zusätzlichen Schritte).
4. Authentication → URL Configuration: Site URL = Cloudflare-URL (lokal `http://localhost:5173`).
5. Keys unter Project Settings → API:
   - Project URL → `PUBLIC_SUPABASE_URL`
   - `anon` `public` → `PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nie ins Client-Bundle, nie committen)

Storage-Bucket `ranking-claims` erst in Phase 2 (Screenshot-Nachweise).

### 2. Cloudflare Workers

1. Cloudflare-Account, Workers & Pages aktivieren.
2. Worker `padelindex` an das GitHub-Repo `padelindex/padelindex` koppeln (Workers Builds).
3. `PUBLIC_SUPABASE_*` stehen in `wrangler.toml` (`[vars]`). `SUPABASE_SERVICE_ROLE_KEY` muss unter Workers → `padelindex` → Settings → Variables and Secrets als **encrypted Secret** liegen — nicht als Build-Variable. Klartext-Vars aus dem Dashboard löscht `wrangler deploy`.

4. Custom Domain `padelindex.de` ist auf diesen Worker geschaltet (Dashboard → Domains & Routes) — nicht in `wrangler.toml` verwaltet, bleibt also bei Code-Deploys unangetastet.
5. Supabase → Authentication → URL Configuration: Site URL auf `https://padelindex.de`, `https://padelindex.afmhahn.workers.dev/**` zusätzlich unter Redirect URLs (Fallback für die workers.dev-Vorschau-URLs pro Branch).

Das alte `padelindex.github.io` ist kein Host mehr — GitHub Pages dort deaktivieren.

### 3. Lokal `.env`

Siehe [`.env.example`](.env.example). Datei nicht committen.

## Repo-Struktur

| Pfad                                         | Inhalt                                      |
| -------------------------------------------- | ------------------------------------------- |
| `src/routes/+page.svelte`                    | Landing                                     |
| `src/routes/c/[slug]`                        | Öffentliche Vereinsseite                    |
| `src/routes/embed/[slug]`                    | iframe-Fallback fürs Widget                 |
| `src/routes/api/waitlist`                    | Waitlist → Postgres                         |
| `src/routes/api/v1/clubs/[slug]/leaderboard` | Widget-API (CORS, Cache 5 min)              |
| `static/embed.js`                            | Custom Element für Vereinswebsites          |
| `src/routes/c/[slug]/beanspruchen`           | Profil beanspruchen (Name → Magic Link)     |
| `src/routes/registrieren`                    | Registrierung (E-Mail + Passwort)           |
| `src/routes/login`                           | Login, Passwort vergessen/zurücksetzen      |
| `src/routes/spieler/mein-profil`             | Privates Profil (Identität + Ranking)       |
| `src/routes/api/claim`                       | Claim-Lookup + Claim-Start                  |
| `src/lib/claim-match.ts`                     | Namensabgleich fürs Beanspruchen            |
| `src/lib/server/rating/`                     | OpenSkill-Kern, Confirm-Worker, Claims      |
| `src/lib/server/rating/league-seed.ts`       | Startwert aus einer bestehenden Ligatabelle |
| `scripts/import-bavaro.ts`                   | Ligadaten → Seed-SQL                        |
| `supabase/migrations/`                       | Schema + RPCs                               |
| `docs/`                                      | Widget-Konzept, Verification-Pipeline       |

## Echte Ligadaten importieren

Der Pilot läuft mit den echten Tabellen der BÁVARO Padel League (STC Oberland),
nicht mit Demodaten.

```bash
# data/bavaro-zyklus5.json liegt lokal, nicht im Repo
npm run import:bavaro
# erzeugt supabase/seed-bavaro.local.sql -> im Supabase SQL Editor ausführen
```

Das Skript rechnet die echten Matches durch denselben Rating-Kern, den auch
der Live-Betrieb nutzt: Startwert aus der Ligaposition vor dem Zyklus, dann
jedes Match einzeln. Alle IDs sind deterministisch aus dem Namen abgeleitet,
ein erneuter Lauf ist idempotent.

**Personenbezogene Daten:** `data/` und `*.local.sql` sind bewusst gitignored.
Dieses Repo ist öffentlich — Klarnamen von Vereinsmitgliedern gehören weder in
die Git-Historie noch in eine Migration. Sie leben ausschließlich in Supabase.

## Profile beanspruchen statt neu anlegen

Importierte Spieler existieren als Profile ohne Auth-User
(`players.user_id is null`, `claim_status = 'unclaimed'`).

1. Spieler öffnet `/c/<slug>/beanspruchen` und tippt seinen Namen.
2. Der Server sucht das unbeanspruchte Profil. Genau ein eindeutiger Treffer
   oder keiner — bei zwei ähnlichen Namen wird die Zuordnung verweigert, statt
   zu raten.
3. Magic Link an die E-Mail. Beim ersten Login löst `handle_new_user()` den
   Claim ein und verknüpft das **bestehende** Profil samt Rating und
   Matchhistorie. Es entsteht kein Zweitprofil.

Öffentlich sichtbar ist ein unbeanspruchtes Profil nur abgekürzt ("Robin K.")
und unter einem anonymen Handle. `anon` hat keinen Lesezugriff auf `players`,
sondern ausschließlich auf die View `club_leaderboard`. Erst nach dem
Beanspruchen entscheidet der Spieler selbst über den vollen Namen.

## Registrierung mit Passwort (E-Mail-Bestätigung)

Zusätzlich zum Magic Link gibt es jetzt eine klassische Registrierung unter
`/registrieren` (Vorname, Nachname, Geburtsdatum, Verein, E-Mail, Passwort)
und `/login` (E-Mail + Passwort, "Passwort vergessen"). Beides läuft über
denselben Supabase-Auth-Client wie der Magic-Link-Flow — `signUp()` legt
dieselbe Zeile in `auth.users` an, `handle_new_user()`
(`supabase/migrations/0019_password_auth.sql`) verknüpft sie mit einem
Spielerprofil, exakt wie bisher. `/anmelden` (Magic Link) bleibt unverändert
nutzbar, z. B. für Konten ohne Passwort aus `/c/[slug]/beanspruchen`.

**Migration ausführen:**
[`supabase/migrations/0019_password_auth.sql`](supabase/migrations/0019_password_auth.sql)
im SQL Editor des Projekts ausführen (fügt `players.first_name` /
`last_name` / `birth_date` / `club_name`, die Rate-Limit-Tabelle und die
neue Fassung von `handle_new_user()` hinzu).

**Im Supabase-Dashboard des LIVE-Projekts (config.toml gilt nur für die
lokale CLI, siehe Kommentare dort):**

1. Authentication → Sign In / Providers → Email → **"Confirm email"**
   aktivieren. Ohne diesen Schalter lässt `signInWithPassword()` auch
   unbestätigte Accounts durch.
2. Authentication → Emails → Templates:
   - **Confirm signup** und **Reset Password** müssen wie die bestehende
     **Magic Link**-Vorlage token-basiert verlinken, nicht mit
     `{{ .ConfirmationURL }}` (siehe `src/routes/auth/confirm/+server.ts` —
     ein einziger, typ-generischer Handler für alle drei):
     ```
     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}
     ```
     Für **Reset Password** dieselbe Zeile mit `type=recovery`.
3. Authentication → Policies/Passwords: Mindestlänge 8,
   "Lowercase, uppercase, digits" — spiegelt `[auth]` in `config.toml`.
4. Rate Limits (Authentication → Rate Limits) einmal gegenprüfen — die
   Defaults aus `config.toml` (`[auth.rate_limit]`) sind bereits sinnvoll,
   gelten aber nur, wenn im Dashboard nichts Abweichendes eingetragen ist.
   Zusätzlich gibt es jetzt eine eigene, feingranulare Bremse direkt in
   Postgres (`check_rate_limit()`, s.o.) für Registrierung/Login/Reset —
   unabhängig von den projektweiten Supabase-Limits.

## Nächste Schritte (nach Phase 1)

1. Supabase + Cloudflare wie oben verbinden, Waitlist einmal testen.
2. **Auth + Onboarding** — Magic Link, Profil, Club-Mitgliedschaft, Fragebogen-Seed.
3. **Match-Flow** — Ergebnis eintragen, Gegner bestätigt, `applyRatingForMatch()`.
4. Cloudflare Cron (`wrangler.toml`) für die 48h-Frist.
5. Realtime für pending Matches, danach Claims (Storage + Vision).

## Widget einbauen (Pilot)

Sobald die Domain steht:

```html
<script src="https://padelindex.de/embed.js" async></script>
<padelindex-leaderboard club="stc-oberland" limit="10" accent="#0F6E5C"> </padelindex-leaderboard>
```

Lokal: `api="http://localhost:5173/api/v1"` am Custom Element setzen.

## License

This software is **proprietary**.
See the [LICENSE](LICENSE) file for full details.

Copyright © 2025–2026 Alec Hahn / Sportcenter Hahn GmbH
All rights reserved. Unauthorized use, copying, modification, distribution or commercial exploitation is strictly prohibited.
