# embed.js — Integration, Versionierung, Caching

Ergänzt `docs/widget-konzept.md` um die Betriebs-Details, die beim
Website-Audit (Block 3) gefehlt haben: Wie groß ist es wirklich, wie
lange wird es gecacht, und wie kann eine Vereinsseite sich gegen ein
manipuliertes `embed.js` absichern.

## Größe

`static/embed.js` ist Vanilla JS ohne Abhängigkeiten. Aktueller Stand:

- roh: ~10,9 kB
- gzip: **~3,9 kB** — deutlich unter dem 15-kB-Budget aus dem Auftrag

Prüfen:

```sh
gzip -c static/embed.js | wc -c
```

Wenn das Skript wächst (z. B. durch Filter- oder Matchfinder-Widget aus
Lizenzstufe Pro, siehe widget-konzept.md), diesen Wert vor dem Merge neu
prüfen.

## Versionierung

Kein Content-Hash im Dateinamen — die eine Anforderung aus dem
Widget-Konzept ist "ein Copy-Paste-Snippet, das nie wieder angefasst
werden muss". Stattdessen trägt das Skript selbst eine Versionsnummer
(`EMBED_VERSION` am Anfang der Datei), abrufbar für Support-Zwecke:

```js
customElements.get('padelindex-leaderboard').version // "1.0.0"
```

Bei jeder inhaltlichen Änderung an `embed.js`: `EMBED_VERSION` hochzählen
und den SRI-Hash unten neu berechnen.

## Caching

`/_headers` (Projekt-Root, von `@sveltejs/adapter-cloudflare` gelesen —
**nicht** in `static/`, das bricht den Build) setzt:

```
Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400
```

Browser cachen eine Stunde, das Edge einen Tag, danach wird im
Hintergrund neu geladen statt eine eingebettete Vereinsseite mit einem
veralteten Request zu blockieren. Bewusst kein `immutable` — anders als
`/_app/immutable/*` (SvelteKit-Build-Assets mit Content-Hash im Namen)
hat `/embed.js` eine stabile URL und muss nach einer Änderung ohne
harten Cache-Bust bei bestehenden Einbindungen ankommen.

## Subresource Integrity (optional, für Vereine mit eigenen
Sicherheitsanforderungen)

```html
<script
  src="https://padelindex.de/embed.js"
  integrity="sha384-/WFE1Udb3OCzPlnGInUZ5R+XTEQnqKz0S9E2JwCxYCDiJyQfYXzvYTuM++vOLXYu"
  crossorigin="anonymous"
  async
></script>
```

**Wichtig:** Der Hash gehört zu genau dieser Fassung von `embed.js`.
Nach jeder inhaltlichen Änderung muss er neu berechnet und hier
aktualisiert werden — sonst bricht das Widget bei jeder Seite, die
`integrity` gesetzt hat (der Browser verweigert dann das Laden). Deshalb
steht `integrity` nicht im Standard-Snippet in `widget-konzept.md`,
sondern nur hier als Option für Vereine, die das ausdrücklich wollen.

Neu berechnen:

```sh
openssl dgst -sha384 -binary static/embed.js | openssl base64 -A
```

Aktueller Hash (Stand dieser Datei): `sha384-/WFE1Udb3OCzPlnGInUZ5R+XTEQnqKz0S9E2JwCxYCDiJyQfYXzvYTuM++vOLXYu`
