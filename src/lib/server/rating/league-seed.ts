// ============================================================
// PadelIndex — Startwert aus einer bestehenden Ligatabelle
// ============================================================
//
// Ein importierter Spieler hat keine PadelIndex-Historie, aber eine
// belastbare Position in einer echten Liga über mehrere Zyklen. Diese
// Position ist ein deutlich besseres Signal als ein Fragebogen — sie
// ist über Monate erspielt und von der Liga selbst geführt.
//
// Bewusst NICHT übernommen wird die Sicherheit: sigma bleibt hoch,
// weil PadelIndex den Spieler noch nie gesehen hat. Die Liga sagt uns
// die Reihenfolge, nicht die Genauigkeit.

import { BASE_SIGMA } from './rating';

/** Oberes und unteres Ende der Anzeigeskala, auf das eine Liga gemappt wird. */
export const LEAGUE_TOP_DISPLAY = 5.6;
export const LEAGUE_BOTTOM_DISPLAY = 1.8;

/**
 * Wie viel Unsicherheit bleibt trotz Ligaposition. 1.0 = volle
 * Startunsicherheit. Bewusst nur leicht reduziert: die Tabelle ordnet
 * zuverlässig, sagt aber nichts über die Streuung einzelner Spieler.
 */
export const LEAGUE_SIGMA_FACTOR = 0.85;

export interface LeagueSeed {
	mu: number;
	sigma: number;
	targetDisplay: number;
}

/**
 * Rang 1 ist der stärkste Spieler. `size` ist die Zahl der gewerteten
 * Plätze — bei nur einem Spieler landet er in der Mitte der Skala.
 */
export function seedFromLeagueRank(rank: number, size: number): LeagueSeed {
	const sigma = Number((BASE_SIGMA * LEAGUE_SIGMA_FACTOR).toFixed(4));

	const clamped = Math.max(1, Math.min(size, Math.round(rank)));
	const span = LEAGUE_TOP_DISPLAY - LEAGUE_BOTTOM_DISPLAY;
	const position = size > 1 ? (clamped - 1) / (size - 1) : 0.5;
	const targetDisplay = Number((LEAGUE_TOP_DISPLAY - position * span).toFixed(4));

	// Umkehrung von toDisplayRating: display = (mu - 2*sigma) * 7 / 50
	const mu = Number(((targetDisplay * 50.0) / 7.0 + 2 * sigma).toFixed(4));

	return { mu, sigma, targetDisplay };
}

/** Spieler ohne Ligaposition (z.B. Warteliste) starten neutral. */
export function seedWithoutRank(): LeagueSeed {
	const mid = (LEAGUE_TOP_DISPLAY + LEAGUE_BOTTOM_DISPLAY) / 2;
	const mu = Number(((mid * 50.0) / 7.0 + 2 * BASE_SIGMA).toFixed(4));
	return { mu, sigma: BASE_SIGMA, targetDisplay: mid };
}
