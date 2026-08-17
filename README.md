# PadelIndex

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
3. Authentication → Providers: **Email** (Magic Link reicht für den Pilot).
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

4. Optional: Custom Domain `padelindex.de` auf diesen Worker.

Das alte `padelindex.github.io` ist kein Host mehr — GitHub Pages dort deaktivieren.

### 3. Lokal `.env`

Siehe [`.env.example`](.env.example). Datei nicht committen.

## Repo-Struktur

| Pfad | Inhalt |
|---|---|
| `src/routes/+page.svelte` | Landing |
| `src/routes/c/[slug]` | Öffentliche Vereinsseite |
| `src/routes/embed/[slug]` | iframe-Fallback fürs Widget |
| `src/routes/api/waitlist` | Waitlist → Postgres |
| `src/routes/api/v1/clubs/[slug]/leaderboard` | Widget-API (CORS, Cache 5 min) |
| `static/embed.js` | Custom Element für Vereinswebsites |
| `src/routes/c/[slug]/beanspruchen` | Profil beanspruchen (Name → Magic Link) |
| `src/routes/api/claim` | Claim-Lookup + Claim-Start |
| `src/lib/claim-match.ts` | Namensabgleich fürs Beanspruchen |
| `src/lib/server/rating/` | OpenSkill-Kern, Confirm-Worker, Claims |
| `src/lib/server/rating/league-seed.ts` | Startwert aus einer bestehenden Ligatabelle |
| `scripts/import-bavaro.ts` | Ligadaten → Seed-SQL |
| `supabase/migrations/` | Schema + RPCs |
| `docs/` | Widget-Konzept, Verification-Pipeline |

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
<padelindex-leaderboard club="stc-oberland" limit="10" accent="#0F6E5C">
</padelindex-leaderboard>
```

Lokal: `api="http://localhost:5173/api/v1"` am Custom Element setzen.
