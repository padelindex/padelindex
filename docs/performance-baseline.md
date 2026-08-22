# Performance-Baseline — Startseite

Website-Audit Block 3. Gemessen mit Lighthouse gegen einen lokalen
Production-Build (`npm run build` + `wrangler pages dev`), Chromium
headless, in der Sandbox-Umgebung dieser Session — **kein** Ersatz für
eine Messung gegen die echte, live deployte `padelindex.de`. Vor dem
nächsten Performance-Block dort erneut messen (PageSpeed Insights oder
Lighthouse CI) und diese Datei aktualisieren.

## Messumgebung — eine bekannte Einschränkung

Jeder Lauf in dieser Sandbox zeigt einen Konsolenfehler
(`net::ERR_CONNECTION_RESET`) beim Laden der Google-Fonts-Stylesheet-URL
— das ist die eingeschränkte Netzwerkumgebung dieser Session, kein
Bug im Code (die Seite hat produktiv vollen Netzwerkzugriff). Das drückt
den Best-Practices-Score minimal (0.96 statt 1.0) und ist vermutlich
auch der Grund für den auffällig hohen Speed-Index-Wert unten — LCP,
FCP, TBT und CLS sind davon unberührt und sehen konsistent gut aus.
Speed Index deshalb mit Vorsicht lesen, bis eine Messung ohne dieses
Netzwerkproblem vorliegt.

## Mobil (Lighthouse-Standardpreset, gedrosselt)

| Kategorie | Score |
|---|---|
| Performance | 0,89 |
| Accessibility | 1,00 |
| Best Practices | 0,96 (s. o. — Netzwerkartefakt der Messumgebung) |
| SEO | 1,00 |

| Metrik | Wert |
|---|---|
| First Contentful Paint | 1,5 s |
| Largest Contentful Paint | 1,6 s |
| Time to Interactive | 1,6 s |
| Total Blocking Time | 30 ms |
| **Cumulative Layout Shift** | **0** (Ziel: < 0,1 — deutlich erreicht) |
| Speed Index | 21,1 s (siehe Hinweis oben) |

## Desktop

| Kategorie | Score |
|---|---|
| Performance | 0,90 |
| Accessibility | 1,00 |
| Best Practices | 0,96 |
| SEO | 1,00 |

| Metrik | Wert |
|---|---|
| First Contentful Paint | 0,5 s |
| Largest Contentful Paint | 0,5 s |
| Time to Interactive | 0,5 s |
| Total Blocking Time | 0 ms |
| **Cumulative Layout Shift** | **0** |
| Speed Index | 7,8 s (siehe Hinweis oben) |

## Was zum guten CLS-Wert beiträgt (bereits vor Block 3 vorhanden, hier verifiziert)

- Jedes `<img>` im Projekt trägt explizite `width`/`height` — keine
  Layout-Verschiebung durch nachladende Bilder.
- Das Rating-Modell (openskill + `rating-demo.ts`, ~11 kB gzip) wird auf
  der gesamten Landingpage konsequent per `whenVisible`/dynamischem
  `import()` erst geladen, wenn der jeweilige Abschnitt in Sichtweite
  kommt (`HeroSequence`, `PartnerProblem`, `MatchLab`, `ConfidenceCurve`,
  `RatingJourney`, `TokenFlow`) — nie beim initialen Rendern.

## In Block 3 gefunden und behoben

- `heading-order`: die Tarif-Karten (Kostenlos/Basic/Pro) sprangen von
  `<h2>` direkt zu `<h4>` — jetzt `<h3>`, wie die übrigen Kartenüberschriften
  auf der Seite.
- `landmark-one-main`: die Landingpage hatte kein `<main>`-Element.
  Ergänzt um Nav/Hero/Footer herum. **Gilt nicht nur für die
  Landingpage** — keine einzige Route im Projekt verwendet `<main>`;
  das ist ein bekannter, noch offener Punkt für die übrigen Seiten
  (`/konto`, `/challenges`, etc.), hier bewusst nicht mit erledigt, um
  Block 3 nicht auf einen Site-weiten Umbau auszudehnen.

## Hydration below-the-fold

Ehrliche Einschätzung statt einer Behauptung, die der Code nicht
einlöst: SvelteKit hydriert serverseitig gerenderte Seiten als Ganzes,
es gibt hier keine Islands-Architektur. Was tatsächlich verzögert wird,
ist nicht die Hydration der Komponenten selbst, sondern das JS-Gewicht
darin — die Landingpage-Komponenten laden ihr eigentlich schweres Modul
(openskill/rating-demo) erst bei Sichtbarkeit nach, wie oben beschrieben.
Eine echte Below-the-Fold-Hydrationsverzögerung bräuchte `svelte:boundary`
oder eine Islands-Architektur — beides ein größerer Umbau, der hier ohne
Rückfrage nicht angefasst wurde.
