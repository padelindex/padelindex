// ============================================================
// PadelIndex — reine Validierung fürs Match-Melden
// ============================================================
//
// Meldeformular denkt in "ich + Partner gegen zwei Gegner" (team1 =
// Melder-Team, team2 = Gegner-Team) statt in generischer Team-Zuordnung —
// so berichtet ein Spieler tatsächlich von seinem Match.

export type SetScoreInput = { team1Games: number; team2Games: number };

export type MatchType = 'gps' | 'turnier' | 'vereinsliga' | 'padelindex_challenge' | 'freizeit';

export const MATCH_TYPES: readonly MatchType[] = [
	'freizeit',
	'gps',
	'turnier',
	'vereinsliga',
	'padelindex_challenge'
];

/** GPS = vom Deutschen Padel Verband organisierte Punktspiele. */
export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
	freizeit: 'Freizeit',
	gps: 'GPS (DPV-Punktspiele)',
	turnier: 'Turnier',
	vereinsliga: 'Vereinsliga',
	padelindex_challenge: 'PadelIndex Challenge'
};

export type MatchReportInput = {
	reporterId: string;
	partnerId: string;
	opponent1Id: string;
	opponent2Id: string;
	sets: SetScoreInput[];
	matchType: MatchType;
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

export const MAX_SETS = 3;
export const MAX_GAMES = 99;

export function validateMatchReport(input: MatchReportInput): ValidationResult {
	const ids = [input.reporterId, input.partnerId, input.opponent1Id, input.opponent2Id];
	if (ids.some((id) => !id)) {
		return { ok: false, message: 'Bitte alle vier Spieler auswählen.' };
	}
	if (new Set(ids).size !== 4) {
		return { ok: false, message: 'Alle vier Spieler müssen unterschiedlich sein.' };
	}
	if (!MATCH_TYPES.includes(input.matchType)) {
		return { ok: false, message: 'Ungültiger Match-Typ.' };
	}

	if (input.sets.length === 0 || input.sets.length > MAX_SETS) {
		return { ok: false, message: `Zwischen einem und ${MAX_SETS} Sätzen angeben.` };
	}

	for (const s of input.sets) {
		if (!Number.isInteger(s.team1Games) || !Number.isInteger(s.team2Games)) {
			return { ok: false, message: 'Spielstände müssen ganze Zahlen sein.' };
		}
		if (
			s.team1Games < 0 ||
			s.team1Games > MAX_GAMES ||
			s.team2Games < 0 ||
			s.team2Games > MAX_GAMES
		) {
			return { ok: false, message: `Spielstand muss zwischen 0 und ${MAX_GAMES} liegen.` };
		}
		if (s.team1Games === s.team2Games) {
			return { ok: false, message: 'Ein Satz kann nicht unentschieden enden.' };
		}
	}

	return { ok: true };
}
