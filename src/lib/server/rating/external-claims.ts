// ============================================================
// PadelIndex — externe Ranking-Nachweise: Extraktion, Plausibilität, Seed
// Ergänzt rating.ts, keine Änderung dort nötig.
// ============================================================
//
// Ablauf (siehe verification-pipeline.md für die Begründung):
//   1. extractClaim()      -> LLM liest den Screenshot, liefert JSON
//   2. scorePlausibility() -> deterministische Regeln, kein Modell
//   3. classifyClaim()     -> auto_verified / needs_review / rejected
//   4. computeSeedFromClaims() -> mu/sigma NUR wenn matches_played < LOCK

import { BASE_SIGMA } from './rating';

// ---------- Typen ----------

export type Platform =
  | 'playtomic'
  | 'rankedin'
  | 'padel_bundesliga'
  | 'club_league'
  | 'other';

export type ScaleType = 'level_0_7' | 'points_relative' | 'division_tier' | 'elo_like' | 'unknown';

export interface PlatformScaleInfo {
  scaleType: ScaleType;
  baseTrustWeight: number; // 0..1, Tabelle platform_scale_map
}

// Spiegel der DB-Seed-Daten aus platform_scale_map — hier als Konstante,
// damit die Seed-Berechnung ohne DB-Roundtrip testbar bleibt. Bei
// Änderung in der DB auch hier nachziehen (oder beim Serverstart laden).
export const PLATFORM_SCALES: Record<Platform, PlatformScaleInfo> = {
  playtomic: { scaleType: 'level_0_7', baseTrustWeight: 0.55 },
  rankedin: { scaleType: 'points_relative', baseTrustWeight: 0.35 },
  padel_bundesliga: { scaleType: 'division_tier', baseTrustWeight: 0.6 },
  club_league: { scaleType: 'elo_like', baseTrustWeight: 0.5 },
  other: { scaleType: 'unknown', baseTrustWeight: 0.2 }
};

export const SEED_LOCK_MATCHES = 3; // ab hier zählen keine Nachweise mehr

/** Rohes Ergebnis der Vision-Extraktion — ungeprüft, kann falsch sein */
export interface ExtractedClaim {
  platform: Platform;
  displayNameOnScreenshot: string | null;
  ratingValue: number | null;
  ratingLabel: string | null;
  scaleType: ScaleType;
  matchesPlayedShown: number | null;
  snapshotDateVisible: string | null; // ISO-Datum oder null
  extractionConfidence: number; // 0..1, vom Modell selbst gemeldet
  ambiguityNotes: string | null;
}

export interface ClaimContext {
  claimedHandle: string; // vom Spieler VOR der Extraktion eingegeben
  playerDisplayName: string;
  screenshotHash: string;
  previousHashesForOtherPlayers: Set<string>; // Duplikat-Check-Basis
  now: Date;
}

export interface PlausibilityResult {
  score: number; // 0..1
  flags: string[]; // z.B. ['name_mismatch', 'implausible_level_for_matches']
}

export type ClaimStatus = 'auto_verified' | 'needs_review' | 'rejected';

// ---------- Prompt für die Vision-Extraktion ----------
//
// Wird serverseitig mit dem Screenshot als Bild-Input an ein
// vision-fähiges Modell geschickt. Bewusst strikt auf Extraktion
// beschränkt — keine Bewertung, keine Meinung, nur Ablesen.

export const EXTRACTION_SYSTEM_PROMPT = `
Du liest einen Screenshot einer Padel-Ranking-Plattform (Playtomic,
RankedIn, Padel Bundesliga oder eine Vereinsliga-Seite) und gibst
ausschließlich das aus, was sichtbar auf dem Bild steht.

Erfinde nichts. Wenn ein Feld nicht klar erkennbar ist, setze es auf
null und beschreibe die Unsicherheit kurz in "ambiguity_notes".

Gib ausschließlich dieses JSON zurück, keinen weiteren Text:

{
  "platform": "playtomic|rankedin|padel_bundesliga|club_league|other",
  "display_name_on_screenshot": string|null,
  "rating_value": number|null,
  "rating_label": string|null,
  "scale_type": "level_0_7|points_relative|division_tier|elo_like|unknown",
  "matches_played_shown": number|null,
  "snapshot_date_visible": string|null,
  "extraction_confidence": number,
  "ambiguity_notes": string|null
}
`.trim();

// ---------- Plausibilitätsregeln (deterministisch) ----------

/** Grobe Ähnlichkeit ohne externe Bibliothek — Levenshtein auf Kleinschreibung */
function similarity(a: string, b: string): number {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;

  const m = x.length,
    n = y.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] =
        x[i - 1] === y[j - 1]
          ? d[i - 1][j - 1]
          : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
    }
  }
  const dist = d[m][n];
  return 1 - dist / Math.max(m, n);
}

function scaleBounds(scaleType: ScaleType): [number, number] | null {
  switch (scaleType) {
    case 'level_0_7':
      return [0, 7];
    case 'division_tier':
      return [1, 10]; // grobe Liga-Ebenen, plattformabhängig kalibriert
    default:
      return null; // points_relative/elo_like/unknown: kein fester Bereich prüfbar
  }
}

export function scorePlausibility(claim: ExtractedClaim, ctx: ClaimContext): PlausibilityResult {
  const flags: string[] = [];
  let score = 1.0;

  // 1. Namensabgleich — wichtigste Prüfung
  const nameToCheck = claim.displayNameOnScreenshot ?? '';
  const nameSim = Math.max(
    similarity(nameToCheck, ctx.claimedHandle),
    similarity(nameToCheck, ctx.playerDisplayName)
  );
  if (!nameToCheck) {
    flags.push('name_not_extracted');
    score -= 0.4;
  } else if (nameSim < 0.5) {
    flags.push('name_mismatch');
    score -= 0.55;
  } else if (nameSim < 0.75) {
    flags.push('name_partial_match');
    score -= 0.15;
  }

  // 2. Werte-Bereich
  const bounds = scaleBounds(claim.scaleType);
  if (claim.ratingValue == null) {
    flags.push('rating_not_extracted');
    score -= 0.25;
  } else if (bounds && (claim.ratingValue < bounds[0] || claim.ratingValue > bounds[1])) {
    flags.push('rating_out_of_range');
    score -= 0.5;
  }

  // 3. Konsistenz Level/Matches (nur für level_0_7 sinnvoll bewertbar)
  if (claim.scaleType === 'level_0_7' && claim.ratingValue != null) {
    const matches = claim.matchesPlayedShown ?? null;
    if (matches != null) {
      // Sehr hohe Level bei sehr wenigen Matches ist unplausibel
      if (claim.ratingValue >= 5.5 && matches < 15) {
        flags.push('implausible_level_for_matches');
        score -= 0.3;
      }
    } else {
      flags.push('matches_not_visible');
      score -= 0.05; // leichter Abzug, kein hartes Kriterium
    }
  }

  // 4. Datum nicht in der Zukunft
  if (claim.snapshotDateVisible) {
    const d = new Date(claim.snapshotDateVisible);
    if (!Number.isNaN(d.getTime()) && d > ctx.now) {
      flags.push('future_dated');
      score -= 0.5;
    }
  }

  // 5. Duplikat-Erkennung
  if (ctx.previousHashesForOtherPlayers.has(ctx.screenshotHash)) {
    flags.push('duplicate_screenshot_other_player');
    score -= 0.8; // praktisch disqualifizierend
  }

  return { score: Math.max(0, Math.min(1, Number(score.toFixed(3)))), flags };
}

export function classifyClaim(
  extractionConfidence: number,
  plausibility: PlausibilityResult
): ClaimStatus {
  const p = plausibility.score;
  if (extractionConfidence >= 0.8 && p >= 0.8) return 'auto_verified';
  if (extractionConfidence < 0.35 || p < 0.35) return 'rejected';
  return 'needs_review';
}

// ---------- Umrechnung auf die 0-7-Anzeigeskala ----------

function toDisplayScale(value: number, scaleType: ScaleType): number | null {
  switch (scaleType) {
    case 'level_0_7':
      return Math.max(0, Math.min(7, value));
    case 'division_tier':
      // Grobe Näherung: höhere Liga-Ebene -> höherer Wert.
      // Muss vor Produktivbetrieb an der echten Padel-Bundesliga-
      // Staffelung kalibriert werden (Kreisliga..Bundesliga).
      return Math.max(0, Math.min(7, (value / 10) * 7));
    default:
      // points_relative / elo_like / unknown: ohne verlässliche Formel
      // keine Umrechnung -> Nachweis fließt nur als schwaches Signal
      // über den Review-Weg ein, nie automatisch in die Seed-Zahl.
      return null;
  }
}

// ---------- Seed-Berechnung aus mehreren Nachweisen ----------

export interface VerifiedClaimForSeed {
  platform: Platform;
  ratingValue: number;
  scaleType: ScaleType;
  status: ClaimStatus; // nur 'auto_verified' | 'needs_review' (nach manueller Bestätigung)
  plausibilityScore: number;
  extractionConfidence: number;
}

export interface SeedResult {
  mu: number;
  sigma: number;
  usedClaims: number;
  note: string;
}

/**
 * Kombiniert alle akzeptierten Nachweise zu einem Startpunkt.
 * Wird NUR aufgerufen, wenn player.external_seed_locked === false
 * (siehe Trigger in external_claims_schema.sql — diese Sperre wird
 * hier nochmal als Parameter erzwungen, damit die Funktion auch
 * isoliert nicht falsch verwendet werden kann).
 */
export function computeSeedFromClaims(
  claims: VerifiedClaimForSeed[],
  matchesPlayed: number,
  selfAssessedFallback: number // 0-7, falls keine verwertbaren Nachweise
): SeedResult {
  if (matchesPlayed >= SEED_LOCK_MATCHES) {
    throw new Error(
      `computeSeedFromClaims: Spieler hat bereits ${matchesPlayed} Matches — ` +
        `Seed-Fenster ist geschlossen (Grenze: ${SEED_LOCK_MATCHES}).`
    );
  }

  const usable = claims
    .map((c) => {
      const displayValue = toDisplayScale(c.ratingValue, c.scaleType);
      if (displayValue == null) return null;
      const trust = PLATFORM_SCALES[c.platform].baseTrustWeight;
      // Review-bestätigte Nachweise zählen etwas weniger als auto_verified,
      // weil dort ein Mensch schon einmal Zweifel hatte, bevor er bestätigte
      const statusFactor = c.status === 'auto_verified' ? 1.0 : 0.85;
      const weight = trust * c.plausibilityScore * c.extractionConfidence * statusFactor;
      return { displayValue, weight };
    })
    .filter((x): x is { displayValue: number; weight: number } => x !== null);

  if (usable.length === 0) {
    const seed = seedFromSelfAssessment(selfAssessedFallback);
    return { ...seed, usedClaims: 0, note: 'Kein verwertbarer Nachweis — Fragebogen-Fallback.' };
  }

  const totalWeight = usable.reduce((a, b) => a + b.weight, 0);
  const weightedAvg = usable.reduce((a, b) => a + b.displayValue * b.weight, 0) / totalWeight;

  // Streuung zwischen den Quellen -> wie einig sind sie sich?
  const variance =
    usable.reduce((a, b) => a + b.weight * (b.displayValue - weightedAvg) ** 2, 0) / totalWeight;
  const disagreement = Math.sqrt(variance); // 0 = perfekte Einigkeit

  // Konservativ: wir seeden am unteren Rand der gewichteten Schätzung,
  // gleiche Logik wie beim reinen Fragebogen-Seed (lieber hocharbeiten).
  const conservativeValue = Math.max(0, weightedAvg - 0.4 * disagreement);

  // Confidence aus Anzahl Quellen + ihrer Gesamtgewichtung + Einigkeit.
  // Deckelung bei 0.6: ein Nachweis-Seed erreicht NIE die Sicherheit,
  // die echtes Spielgeschehen im System liefert (siehe Pipeline-Doku).
  const evidenceStrength = Math.min(1, totalWeight / usable.length);
  const agreementFactor = Math.max(0, 1 - disagreement / 3.5);
  const confidence = Math.min(0.6, 0.15 * usable.length ** 0.5 * evidenceStrength * agreementFactor);

  const mu = (conservativeValue * 50.0) / 7.0 + 2 * BASE_SIGMA * (1 - confidence);
  const sigma = BASE_SIGMA * (1 - confidence * 0.7); // nie unter 0.3 * BASE_SIGMA

  return {
    mu: Number(mu.toFixed(4)),
    sigma: Number(sigma.toFixed(4)),
    usedClaims: usable.length,
    note:
      usable.length > 1
        ? `${usable.length} Nachweise kombiniert, Uneinigkeit ${disagreement.toFixed(2)}.`
        : `Einzelner Nachweis, Vertrauen gedeckelt auf ${(confidence * 100).toFixed(0)}%.`
  };
}

/** Fallback: bestehende Fragebogen-Logik aus rating.ts, hier nur referenziert */
function seedFromSelfAssessment(level: number): { mu: number; sigma: number } {
  const targetDisplay = Math.max(0, Math.min(7, level)) * 0.85;
  const mu = (targetDisplay * 50.0) / 7.0 + 2 * BASE_SIGMA;
  return { mu: Number(mu.toFixed(4)), sigma: BASE_SIGMA };
}

// ---------- Für die UI: was der Spieler nach der Einreichung sieht ----------

export function explainClaimStatus(status: ClaimStatus, flags: string[]): string {
  switch (status) {
    case 'auto_verified':
      return 'Nachweis bestätigt und in deinen Startwert eingeflossen.';
    case 'needs_review':
      return 'Wird von deinem Verein geprüft — meist innerhalb weniger Tage.';
    case 'rejected': {
      if (flags.includes('name_mismatch')) return 'Der Name auf dem Screenshot passt nicht zu deinem Profil.';
      if (flags.includes('duplicate_screenshot_other_player'))
        return 'Dieser Screenshot wurde bereits bei einem anderen Profil eingereicht.';
      if (flags.includes('rating_out_of_range')) return 'Der erkannte Wert liegt außerhalb der plausiblen Skala.';
      return 'Nachweis konnte nicht bestätigt werden. Du kannst es erneut versuchen oder mit dem Fragebogen starten.';
    }
  }
}
