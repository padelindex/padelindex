# PadelIndex — Externe Ranking-Nachweise

Ziel: ein Spieler, der bereits auf Playtomic, RankedIn, in der Padel
Bundesliga oder einer Vereinsliga eine Historie hat, soll nicht bei
`mu=25, sigma=8.3` (Nullpunkt) starten. Er lädt einen Screenshot hoch,
das System liest ihn aus und setzt einen **besseren Startpunkt** als
ein Fragebogen es könnte.

Wichtig für die Erwartungshaltung: das ist ein **verbesserter Seed,
keine Wahrheit.** Ein Screenshot ist eine Behauptung mit Beleg, kein
geprüftes Ergebnis wie ein bestätigtes PadelIndex-Match. Die Pipeline
ist entsprechend so gebaut, dass sie diesen Unterschied nie verwischt.

---

## 1. Ablauf

```
Screenshot hochladen
   │
   ▼
Vision-Extraktion (LLM)         → strukturierte Daten + eigene Konfidenz
   │
   ▼
Plausibilitätsregeln (Code)     → deterministisch, nachvollziehbar
   │
   ├─ hohe Konfidenz + plausibel  → auto_verified, sofort in Seed
   ├─ mittel / uneindeutig        → needs_review, Mensch entscheidet
   └─ unplausibel                 → rejected, Fragebogen-Fallback
```

**Warum Extraktion und Plausibilität getrennt sind:** Das
Vision-Modell liest, was auf dem Bild steht — es soll nicht auch noch
entscheiden, ob das Bild glaubwürdig ist. Die Plausibilitätsprüfung ist
bewusst normaler, deterministischer Code: nachvollziehbar, testbar,
und ohne dass ein zweiter unsicherer Modellaufruf über einen ersten
urteilt.

## 2. Was die Extraktion liefert

Pro Screenshot ein JSON-Objekt:

```json
{
  "platform": "playtomic",
  "display_name_on_screenshot": "Max M.",
  "rating_value": 4.2,
  "rating_label": "Nivel 4.20",
  "scale_type": "level_0_7",
  "matches_played_shown": 47,
  "snapshot_date_visible": null,
  "extraction_confidence": 0.91,
  "ambiguity_notes": "Kein Datum sichtbar, Rest eindeutig lesbar."
}
```

Die Extraktion bekommt vorher den vom Spieler selbst eingetippten
Plattform-Handle mitgeliefert — nicht um ihn zu "erraten", sondern um
zu prüfen, ob **der im Screenshot sichtbare Name zu der Angabe passt.**
Das ist die erste und wichtigste Hürde: ein Screenshot vom Profil einer
fremden Person nützt nichts, wenn Name/Handle nicht übereinstimmen.

## 3. Plausibilitätsregeln

Alles hier ist deterministisch, keine Modellentscheidung:

| Prüfung | Beispiel |
|---|---|
| Namensabgleich | Sichtbarer Name ↔ vom Spieler angegebener Handle — Fuzzy-Match |
| Werte-Bereich | `rating_value` innerhalb der bekannten Skala der Plattform |
| Konsistenz Matches/Level | Level 6 nach 3 Matches ist unplausibel, nach 300 nicht |
| Datum nicht in der Zukunft | Falls ein Datum sichtbar ist |
| Duplikat-Erkennung | Bildhash gegen bereits eingereichte Screenshots |
| Plattform erkennbar | UI-Elemente passen zum behaupteten Anbieter |

Jede Regel trägt zu einem `plausibility_score` (0–1) bei. Zusammen mit
`extraction_confidence` ergibt sich die Einstufung:

- **beide hoch** → `auto_verified`
- **eine davon mittel, keine niedrig** → `needs_review`
- **eine niedrig** → `rejected`, mit Grund für den Spieler sichtbar

## 4. Was wir bewusst NICHT versprechen

- **Kein Fälschungsschutz gegen bearbeitete Bilder.** Ein sorgfältig
  manipulierter Screenshot kann durchrutschen. Deshalb verbessert ein
  verifizierter Nachweis den Startpunkt, senkt die Unsicherheit
  (`sigma`) aber nie auf das Niveau eines Spielers mit echter
  PadelIndex-Historie — ein Screenshot bleibt schwächere Evidenz als
  12 bestätigte, gegnerseitig bestätigte Matches im eigenen System.
- **Kein Ersatz für Gegner-Bestätigung.** Nachweise beeinflussen nur
  den *Startpunkt*, niemals das laufende Rating nach dem ersten
  eigenen Match.
- **Mehrere Quellen schlagen eine einzelne.** Deuten Playtomic- und
  Bundesliga-Nachweis aufs Gleiche, sinkt die Startunsicherheit
  stärker, als es eine Quelle allein könnte. Widersprechen sie sich
  deutlich, bleibt der vorsichtigere, unsicherere Wert bestehen — nie
  der günstigere.

## 5. Fenster, in dem Nachweise wirken

Nachweise werden **nur akzeptiert, solange der Spieler noch kaum
eigene PadelIndex-Matches gespielt hat** (Schwelle: < 3).

Das ist eine bewusste Anti-Manipulations-Grenze: ohne sie könnte
jemand erst zehn eigene Matches spielen, sein Rating dort selbst
"herunterspielen", und danach einen hochkarätigen externen Nachweis
nachreichen, um einen künstlichen Sprung zu erzwingen. Mit der
Schwelle ist das ausgeschlossen — Nachweise zählen nur am Anfang, wenn
sie ihren eigentlichen Zweck erfüllen: die Kaltstart-Phase abkürzen.

## 6. Skalen-Übersetzung je Plattform

| Plattform | Skalentyp | Vertrauensgewicht | Hinweis |
|---|---|---|---|
| Playtomic | 0–7-Level | mittel | direkt übertragbar, aber bekanntermaßen oft schlecht kalibriert |
| RankedIn | Turnierpunkte, relativ | niedrig | kein direktes Skill-Level, nur grobe Bandzuordnung |
| Padel Bundesliga | Liga-Stufe | mittel-hoch | grobes Raster, aber ein Liga-Level ist ein starkes Signal |
| Vereinsliga | uneinheitlich | mittel | stark abhängig davon, was der Screenshot überhaupt zeigt |

Das Vertrauensgewicht fließt direkt in die Seed-Berechnung ein — ein
Playtomic-Level bewegt den Startpunkt weniger stark als ein
Bundesliga-Nachweis, weil Playtomics Skala nachweislich ungenau ist
(siehe eigene Recherche zu Nutzerbeschwerden).

## 7. Reviewer-Oberfläche (für needs_review)

Kein separates Team nötig für den Pilotstart — Vereins-Admins über-
nehmen das für ihre eigenen Mitglieder, weil sie die Person oft
persönlich kennen. Die Ansicht braucht: Screenshot, extrahierte Daten
nebeneinander, den berechneten `plausibility_score`, und zwei
Buttons — bestätigen oder ablehnen mit kurzem Grund. Kein
Freitext-Editieren der extrahierten Werte, um Nachbearbeitungs-
Missbrauch auszuschließen — nur annehmen oder verwerfen.

## 8. Reihenfolge des Baus

1. Upload + Speicherung (Supabase Storage), noch ohne Extraktion
2. Vision-Extraktion für Playtomic (häufigste Plattform im Umfeld)
3. Plausibilitätsregeln + Seed-Berechnung
4. Reviewer-Ansicht für needs_review
5. Weitere Plattformen (RankedIn, Bundesliga, Vereinsliga) nachziehen,
   sobald Playtomic sauber läuft
