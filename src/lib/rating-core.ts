// ============================================================
// PadelIndex — Rating-Kern (reine Funktionen, ohne DB-Zugriff)
// npm i openskill
// ============================================================
//
// Warum diese Struktur: OpenSkill liefert die Bayes'sche Basis
// (Team-aware, mu/sigma). Score-Margin und Streak-Amplifikation
// legen wir als eigene, nachvollziehbare Faktoren OBEN DRAUF —
// so bleibt jeder Rating-Sprung in der UI erklärbar.
//
// Hinweis: die Options-Namen von openskill.js (model, tau, ...)
// gegen die aktuelle Doku prüfen, die API hat sich zwischen
// Major-Versionen schon geändert.

import { rating, rate } from 'openskill';

// ---------- Konstanten ----------
export const BASE_MU = 25.0;
export const BASE_SIGMA = 25.0 / 3.0; // 8.3333
export const PROVISIONAL_MATCHES = 12; // bis dahin gilt Rating als provisorisch

// Anzeige-Skala 0–7 (identisch zur generated column im Schema)
export function toDisplayRating(mu: number, sigma: number): number {
  const conservative = mu - 2 * sigma;
  const scaled = (conservative * 7.0) / 50.0;
  return Math.max(0, Math.min(7, Number(scaled.toFixed(2))));
}

// Seed: Spieler wählt beim Onboarding ein Level-Band, wir setzen
// ihn bewusst ans UNTERE Ende (lieber hocharbeiten als abstürzen).
export function seedRating(selfAssessedLevel: number) {
  // Level 0–7 -> mu, mit voller Unsicherheit
  const targetDisplay = Math.max(0, Math.min(7, selfAssessedLevel)) * 0.85; // konservativ
  const mu = (targetDisplay * 50.0) / 7.0 + 2 * BASE_SIGMA;
  return { mu: Number(mu.toFixed(4)), sigma: BASE_SIGMA };
}

// ---------- Admin-Kalibrierung (Cold Start) ----------
// Anders als seedRating() (Selbsteinschätzung, bewusst gedämpft) ist hier
// ein Vereins-Admin die Quelle, der den Spieler persönlich kennt — der
// Zielwert wird deshalb NICHT künstlich gesenkt. Nur zulässig, solange
// external_seed_locked = false (0 Matches gespielt, siehe
// 0020_initial_index_calibration.sql, die exakt dieselben Zielwerte
// verwendet — bei Änderung hier IMMER auch dort nachziehen).
export type SkillTier = 'beginner' | 'intermediate' | 'advanced';

export const SKILL_TIER_TARGET_INDEX: Record<SkillTier, number> = {
  beginner: 1,
  intermediate: 3,
  advanced: 5
};

export const SKILL_TIER_LABELS: Record<SkillTier, string> = {
  beginner: 'Anfänger',
  intermediate: 'Fortgeschritten',
  advanced: 'Turnierspieler'
};

export function seedRatingForTier(tier: SkillTier) {
  const targetDisplay = SKILL_TIER_TARGET_INDEX[tier];
  const mu = (targetDisplay * 50.0) / 7.0 + 2 * BASE_SIGMA;
  return { mu: Number(mu.toFixed(4)), sigma: BASE_SIGMA };
}

// ---------- Typen ----------
export interface PlayerState {
  playerId: string;
  mu: number;
  sigma: number;
  matchesPlayed: number;
  /** aktuelle Serie: positiv = Siege, negativ = Niederlagen */
  currentStreak: number;
}

export interface SetScore {
  team1Games: number;
  team2Games: number;
}

export interface MatchInput {
  team1: PlayerState[];
  team2: PlayerState[];
  sets: SetScore[];
}

export interface PlayerRatingResult {
  playerId: string;
  muBefore: number;
  sigmaBefore: number;
  muAfter: number;
  sigmaAfter: number;
  ratingBefore: number;
  ratingAfter: number;
  /** wird 1:1 in rating_history.factors geschrieben -> Transparenz-UI */
  factors: {
    won: boolean;
    baseDelta: number;
    marginFactor: number;
    streakFactor: number;
    appliedFactor: number;
    dominance: number;
    opponentAvgRating: number;
    partnerAvgRating: number;
    expectedWinProb: number;
    provisional: boolean;
  };
}

// ---------- Hilfsfunktionen ----------

/** Wie klar war der Sieg? 0 = hauchdünn, 1 = 6:0 6:0 */
export function computeDominance(sets: SetScore[], team1Won: boolean): number {
  let winnerGames = 0;
  let loserGames = 0;
  for (const s of sets) {
    winnerGames += team1Won ? s.team1Games : s.team2Games;
    loserGames += team1Won ? s.team2Games : s.team1Games;
  }
  const total = winnerGames + loserGames;
  if (total === 0) return 0;
  return Math.max(0, Math.min(1, (winnerGames - loserGames) / total));
}

/**
 * Score-Margin-Faktor: 6:0 6:0 bewegt mehr als 7:6 7:6.
 * Bewusst gedeckelt — ein Kantersieg soll verstärken, nicht explodieren.
 */
export function marginFactor(dominance: number): number {
  return Number((0.85 + 0.45 * dominance).toFixed(4)); // 0.85 .. 1.30
}

/**
 * Bidirektionale Streak-Amplifikation: wer 3+ mal in Folge gewinnt,
 * ist wahrscheinlich unterbewertet -> Anpassung beschleunigen.
 * Greift nur, wenn das Ergebnis die Serie FORTSETZT.
 */
export function streakFactor(currentStreak: number, won: boolean): number {
  const continues = (won && currentStreak >= 2) || (!won && currentStreak <= -2);
  if (!continues) return 1.0;
  const magnitude = Math.min(Math.abs(currentStreak) - 1, 4); // max 4 Stufen
  return Number((1.0 + magnitude * 0.06).toFixed(4)); // bis 1.24
}

/** Erwartete Siegwahrscheinlichkeit Team1 (für UI + Manipulationserkennung) */
export function expectedWinProbability(team1: PlayerState[], team2: PlayerState[]): number {
  const mu1 = avg(team1.map((p) => p.mu));
  const mu2 = avg(team2.map((p) => p.mu));
  const s1 = sumSq(team1.map((p) => p.sigma));
  const s2 = sumSq(team2.map((p) => p.sigma));
  const denom = Math.sqrt(team1.length + team2.length) * BASE_SIGMA ** 2 + s1 + s2;
  const p = 1 / (1 + Math.exp((-(mu1 - mu2) * Math.sqrt(2)) / Math.sqrt(denom)));
  return Number(p.toFixed(4));
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sumSq = (xs: number[]) => xs.reduce((a, b) => a + b * b, 0);

// ---------- Hauptfunktion ----------

/**
 * Berechnet neue Ratings für alle Beteiligten eines bestätigten Matches.
 * Rein funktional: keine DB, keine Seiteneffekte -> gut testbar.
 */
export function computeMatchRatings(input: MatchInput): PlayerRatingResult[] {
  const { team1, team2, sets } = input;

  // 1. Sieger bestimmen (gewonnene Sätze, Games als Tiebreaker)
  let t1Sets = 0;
  let t2Sets = 0;
  let t1Games = 0;
  let t2Games = 0;
  for (const s of sets) {
    t1Games += s.team1Games;
    t2Games += s.team2Games;
    if (s.team1Games > s.team2Games) t1Sets++;
    else if (s.team2Games > s.team1Games) t2Sets++;
  }
  const team1Won = t1Sets !== t2Sets ? t1Sets > t2Sets : t1Games > t2Games;

  // 2. OpenSkill-Basisupdate (Team-aware, berücksichtigt Partner + Gegner)
  const os1 = team1.map((p) => rating({ mu: p.mu, sigma: p.sigma }));
  const os2 = team2.map((p) => rating({ mu: p.mu, sigma: p.sigma }));

  // rank: 1 = Sieger. Genau hier steckt die Doppel-Logik:
  // OpenSkill verteilt die Änderung anhand der individuellen Unsicherheit,
  // nicht pauschal auf beide Partner.
  const [new1, new2] = rate([os1, os2], {
    rank: team1Won ? [1, 2] : [2, 1]
  });

  // 3. Eigene Faktoren obendrauf
  const dominance = computeDominance(sets, team1Won);
  const mf = marginFactor(dominance);
  const winProb = expectedWinProbability(team1, team2);

  const results: PlayerRatingResult[] = [];

  const process = (
    players: PlayerState[],
    updated: { mu: number; sigma: number }[],
    won: boolean,
    opponents: PlayerState[]
  ) => {
    players.forEach((p, i) => {
      const baseDelta = updated[i].mu - p.mu;
      const sf = streakFactor(p.currentStreak, won);

      // Gesamt-Faktor gedeckelt, damit kein Ausreißer das Rating zerreißt
      const appliedFactor = Number(Math.max(0.6, Math.min(1.6, mf * sf)).toFixed(4));

      const muAfter = Number((p.mu + baseDelta * appliedFactor).toFixed(4));
      // sigma NIE künstlich aufblähen: Vertrauen wächst nur monoton
      const sigmaAfter = Number(Math.min(updated[i].sigma, p.sigma).toFixed(4));

      const partners = players.filter((x) => x.playerId !== p.playerId);

      results.push({
        playerId: p.playerId,
        muBefore: p.mu,
        sigmaBefore: p.sigma,
        muAfter,
        sigmaAfter,
        ratingBefore: toDisplayRating(p.mu, p.sigma),
        ratingAfter: toDisplayRating(muAfter, sigmaAfter),
        factors: {
          won,
          baseDelta: Number(baseDelta.toFixed(4)),
          marginFactor: mf,
          streakFactor: sf,
          appliedFactor,
          dominance: Number(dominance.toFixed(4)),
          opponentAvgRating: Number(
            avg(opponents.map((o) => toDisplayRating(o.mu, o.sigma))).toFixed(2)
          ),
          partnerAvgRating: Number(
            avg(partners.map((o) => toDisplayRating(o.mu, o.sigma))).toFixed(2)
          ),
          expectedWinProb: won === team1Won ? winProb : Number((1 - winProb).toFixed(4)),
          provisional: p.matchesPlayed < PROVISIONAL_MATCHES
        }
      });
    });
  };

  process(team1, new1, team1Won, team2);
  process(team2, new2, !team1Won, team1);

  return results;
}

// ---------- Inaktivität ----------

/**
 * Sigma-Inflation bei Inaktivität: nach längerer Pause weiß das System
 * weniger über den Spieler -> nächste Matches bewegen wieder mehr.
 * Läuft als Cron, nicht bei Match-Eingabe.
 */
export function inflateSigmaForInactivity(
  sigma: number,
  weeksInactive: number
): number {
  if (weeksInactive < 6) return sigma;
  const steps = Math.floor((weeksInactive - 6) / 4) + 1; // alle 4 Wochen eine Stufe
  const inflated = sigma * (1 + 0.08 * steps);
  return Number(Math.min(inflated, BASE_SIGMA).toFixed(4)); // nie über Startunsicherheit
}

// ---------- Token-Regeln (nur Gutschriften, nie Abzug) ----------

export interface TokenGrant {
  playerId: string;
  amount: number;
  reason:
    | 'match_played'
    | 'match_won'
    | 'milestone'
    | 'streak'
    | 'tournament';
}

export function computeTokenGrants(
  results: PlayerRatingResult[],
  states: PlayerState[],
  source: 'manual' | 'club_league' | 'tournament' | 'import'
): TokenGrant[] {
  const grants: TokenGrant[] = [];
  const byId = new Map(states.map((s) => [s.playerId, s]));

  for (const r of results) {
    const st = byId.get(r.playerId);
    if (!st) continue;

    grants.push({ playerId: r.playerId, amount: 10, reason: 'match_played' });
    if (r.factors.won) {
      grants.push({ playerId: r.playerId, amount: 15, reason: 'match_won' });
    }
    if (source === 'tournament' || source === 'club_league') {
      grants.push({ playerId: r.playerId, amount: 10, reason: 'tournament' });
    }

    const played = st.matchesPlayed + 1;
    if ([10, 25, 50, 100, 250].includes(played)) {
      grants.push({ playerId: r.playerId, amount: 100, reason: 'milestone' });
    }

    const newStreak = r.factors.won
      ? Math.max(st.currentStreak, 0) + 1
      : Math.min(st.currentStreak, 0) - 1;
    if (newStreak > 0 && newStreak % 5 === 0) {
      grants.push({ playerId: r.playerId, amount: 50, reason: 'streak' });
    }
  }

  return grants;
}
