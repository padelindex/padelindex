# PadelIndex Widget — Konzept

Das Widget ist nicht nur ein Feature, es ist der Vertriebskanal. Jede
Vereinsseite, auf der es läuft, ist ein Schaufenster für neue Spieler.
Deshalb: technisch anspruchslos einzubauen, optisch dem Verein
zugehörig, und mit einem Rückkanal zu PadelIndex.

---

## 1. Einbettungsproblem

Deine Zielgruppe sind Vereinswebsites — überwiegend WordPress, oft mit
Elementor, teils uralte Themes, gelegentlich Wix oder Jimdo. Daraus
folgen drei harte Anforderungen:

1. **Ein Copy-Paste-Snippet**, kein Build-Schritt, keine npm-Installation.
2. **Vollständige Style-Isolation.** Ein fremdes Theme mit
   `* { box-sizing: content-box }` oder aggressiven `table`-Regeln darf
   das Widget nicht zerlegen — und das Widget darf die Seite nicht
   anfassen.
3. **Kein Login.** Ein öffentliches Leaderboard braucht keine Auth,
   also ist es cachebar und praktisch kostenlos auszuliefern.

### Lösung: Custom Element mit Shadow DOM

```html
<script src="https://padelindex.de/embed.js" async></script>

<padelindex-leaderboard
  club="stc-oberland"
  limit="10"
  accent="#0F6E5C">
</padelindex-leaderboard>
```

Shadow DOM kapselt die Styles in beide Richtungen — das löst Punkt 2
vollständig, ohne iframe. Das Element ist unabhängig von SvelteKit
geschrieben (Vanilla JS, keine Runtime), damit der Verein keine 40 kB
Framework für eine Tabelle lädt.

**Fallback iframe** für CMS, die kein `<script>` im Body erlauben
(manche Jimdo-/Wix-Tarife):

```html
<iframe src="https://padelindex.de/embed/stc-oberland?limit=10"
        style="width:100%;border:0;height:520px" loading="lazy"></iframe>
```

**WordPress-Plugin** als dritte Stufe. Für deine Kunden der eigentlich
relevante Weg: ein Mini-Plugin, das einen Shortcode
`[padelindex club="stc-oberland"]` registriert, plus ein
Elementor-Widget. Damit kann der Vereinsvorstand das Ranking selbst
platzieren, ohne dich anzurufen — und du hast einen Grund, das Plugin
im WordPress-Verzeichnis zu veröffentlichen (Reichweite bei genau der
Zielgruppe, die du sonst einzeln ansprechen müsstest).

---

## 2. Datenweg

```
Browser (Vereinsseite)
   │  GET /api/v1/clubs/stc-oberland/leaderboard?limit=10
   ▼
Cloudflare Pages Function  ──►  Cache API (TTL 300s)
   │  cache miss
   ▼
Supabase: view club_leaderboard  (anon key, RLS: nur profile_public)
```

**Warum Edge-Cache:** ein Leaderboard ändert sich nach bestätigten
Matches, nicht sekündlich. 5 Minuten TTL bedeutet: bei 20 Vereinen und
tausenden Seitenaufrufen sprechen vielleicht ein Dutzend Requests pro
Stunde die Datenbank an. Das hält dich im kostenlosen Supabase-Tarif,
solange du klein bist. Bei Bedarf per `cache.delete()` gezielt
invalidieren, wenn `apply_match_rating` durchgelaufen ist.

**Antwortformat** (bewusst schlank, keine internen Felder):

```json
{
  "club": { "name": "STC Oberland", "slug": "stc-oberland" },
  "updated_at": "2026-08-17T09:12:00Z",
  "players": [
    {
      "rank": 1,
      "handle": "max-m",
      "name": "Max M.",
      "rating": 4.82,
      "confidence": 0.78,
      "matches": 34,
      "provisional": false,
      "trend": 0.12
    }
  ]
}
```

`mu` und `sigma` gehen **nie** nach außen. Nach außen geht nur
`rating` und ein normalisierter `confidence`-Wert von 0–1 — sonst kann
jemand deinen Algorithmus rückrechnen oder das Rohmodell nachbauen.

---

## 3. Gestaltung

Das Widget sitzt in fremden Layouts. Es darf also nicht schreien, muss
aber sofort als eigenständiges, verlässliches Datenobjekt erkennbar
sein — nicht als weitere Theme-Tabelle.

**Farben** (überschreibbar per Attribut/CSS-Variable):

| Rolle | Wert | Zweck |
|---|---|---|
| `--pi-surface` | `#FBFBF9` | Fläche, minimal warm, nie ganz weiß |
| `--pi-ink` | `#16232B` | Text, Slate mit Teal-Stich |
| `--pi-muted` | `#6B7C85` | Sekundärtext, Meta |
| `--pi-line` | `#E4E8E7` | Haarlinien |
| `--pi-accent` | `#0F6E5C` | Court-Grün, nur für den Ring |
| `--pi-signal` | `#B4711A` | provisorisches Rating |

Vereine setzen `accent` auf ihre Clubfarbe — das ist der eine Punkt, an
dem Anpassung wirklich Wert hat.

**Typografie:** System-Stack für Namen (kein Webfont-Download in einer
fremden Seite, das kostet Ladezeit, die dir der Verein anlastet),
aber `font-variant-numeric: tabular-nums` für alle Zahlen. Ratings in
einer Spalte müssen untereinander stehen; das ist Funktion, nicht Stil.

**Signature-Element: der Confidence-Ring.** Neben jedem Rating ein
kleiner SVG-Kreisbogen, dessen Füllung zeigt, wie sicher das System
sich ist. Das ist die eine Sache, die kein Konkurrenz-Widget hat, und
sie transportiert genau das Versprechen der Plattform: die Zahl ist
nicht behauptet, sie hat einen Genauigkeitsgrad. Ein halbleerer Ring
neben `3.4` erklärt "der spielt erst 6 Matches" ohne ein Wort Text.

Alles andere bleibt streng ruhig: Haarlinien statt Boxen, keine
Zebrastreifen, keine Farbbalken, keine Medaillen-Emojis. Die Bewegung
im Widget ist ein einziges Aufblenden der Zeilen beim Laden, gestaffelt
um 30 ms — und die wird bei `prefers-reduced-motion` weggelassen.

**Zustände** brauchen echte Texte, keine Spinner-Wüste:

- Laden: Skelettzeilen in der richtigen Höhe, damit die Seite nicht springt
- Leer: „Noch keine bestätigten Matches. Das Ranking startet mit dem ersten Ergebnis."
- Fehler: „Ranking gerade nicht erreichbar." + Retry-Button
- Verein unbekannt: „Diesen Verein gibt es bei PadelIndex noch nicht." + Link zur Anmeldung

---

## 4. Lizenzstufen

Das Widget ist der Ort, an dem `license_tier` aus dem Schema wirksam
wird. Die Function prüft den Tarif und liefert entsprechend aus:

| | Free | Basic | Pro |
|---|---|---|---|
| Leaderboard | Top 10 | vollständig | vollständig |
| Filter (Level, Geschlecht, Zeitraum) | – | ✓ | ✓ |
| Clubfarbe/Logo | – | ✓ | ✓ |
| „Powered by PadelIndex" | fest | klein | abschaltbar |
| Matchfinder-Widget | – | – | ✓ |
| Prämien-Widget (Token-Katalog) | – | – | ✓ |
| Eigene Subdomain (`stc.padelindex.de`) | – | – | ✓ |

**Der Free-Tarif ist Absicht, nicht Großzügigkeit.** Er bringt dir
einen Backlink von jeder Vereinsseite plus die Neugier der Spieler, die
sich auf Platz 11+ nicht finden — und genau die klicken durch und
registrieren sich. Erst wenn ein Verein das Ranking prominent nutzt,
wird der Upgrade-Wunsch (Filter, eigene Farben, Badge weg) von selbst
konkret.

---

## 5. Reihenfolge des Baus

1. Öffentliche Leaderboard-Function + Edge-Cache
2. Custom Element mit Shadow DOM, Confidence-Ring, allen vier Zuständen
3. Einbau bei einem Pilotverein, Ladezeit auf einer realen
   WordPress-Seite messen
4. WordPress-Plugin mit Shortcode + Elementor-Widget
5. Erst danach Filter, Matchfinder, Prämien-Widget

Schritt 3 vor Schritt 4 ist wichtig: du willst wissen, wie sich das
Ding in einem echten, überladenen Vereins-Theme verhält, bevor du ein
Plugin veröffentlichst, das andere Leute installieren.
