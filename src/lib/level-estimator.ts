// ============================================================
// PadelIndex — Level-Schätzer (Website-Audit Block 6)
// ============================================================
// Reine Schätzfunktion für Leute ohne (oder mit noch zu wenigen)
// bestätigten Matches: sechs Fragen, additiv gewichtet, auf die
// bestehende 0–7-Anzeigeskala aus rating-core.ts abgebildet.
//
// Wichtig für die Ehrlichkeit dieses Tools: es rechnet NICHT mit dem
// Rating-Modell (OpenSkill) und schreibt nirgends ein echtes Rating.
// Es liefert nur einen Vorschlag für das Feld "Selbsteinschätzung"
// (siehe konto/+page.server.ts, self_assessed_level), das seedRating()
// als vorsichtigen Startpunkt nimmt. Das eigentliche Level bleibt allein
// Sache bestätigter Matches.

export interface EstimatorOption {
	label: string;
	points: 0 | 1 | 2 | 3 | 4;
}

export interface EstimatorQuestion {
	id: string;
	question: string;
	options: EstimatorOption[];
}

export const LEVEL_QUESTIONS: EstimatorQuestion[] = [
	{
		id: 'erfahrung',
		question: 'Wie lange spielst du schon Padel?',
		options: [
			{ label: 'Noch gar nicht / erst ausprobiert', points: 0 },
			{ label: 'Ein paar Monate', points: 1 },
			{ label: '6 Monate bis 2 Jahre', points: 2 },
			{ label: '2 bis 5 Jahre', points: 3 },
			{ label: 'Mehr als 5 Jahre', points: 4 }
		]
	},
	{
		id: 'haeufigkeit',
		question: 'Wie oft spielst du aktuell?',
		options: [
			{ label: 'So gut wie nie', points: 0 },
			{ label: 'Seltener als einmal im Monat', points: 1 },
			{ label: 'Ein- bis zweimal im Monat', points: 2 },
			{ label: 'Etwa einmal die Woche', points: 3 },
			{ label: 'Mehrmals die Woche', points: 4 }
		]
	},
	{
		id: 'racketsport',
		question: 'Hast du Vorerfahrung in einer anderen Schlägersportart (Tennis, Squash, Badminton)?',
		options: [
			{ label: 'Keine', points: 0 },
			{ label: 'Als Kind mal gespielt', points: 1 },
			{ label: 'Gelegentlich Freizeitspieler:in', points: 2 },
			{ label: 'Regelmäßig, im Verein', points: 3 },
			{ label: 'Wettkampfniveau', points: 4 }
		]
	},
	{
		id: 'schlaege',
		question: 'Welche Schläge sitzen bei dir sicher?',
		options: [
			{ label: 'Ich übe noch die Grundschläge', points: 0 },
			{ label: 'Grundschläge und Volley', points: 1 },
			{ label: 'Zusätzlich die Bandeja', points: 2 },
			{ label: 'Zusätzlich Vibora und ein sicherer Smash', points: 3 },
			{ label: 'Ich spiele taktisch mit der Wand und variablem Aufschlag', points: 4 }
		]
	},
	{
		id: 'wettkampf',
		question: 'Turnier- oder Liga-Erfahrung?',
		options: [
			{ label: 'Keine', points: 0 },
			{ label: 'Ein paar Freizeitturniere', points: 1 },
			{ label: 'Unterste Liga-Ebene im Verein', points: 2 },
			{ label: 'Mittlere Ligen', points: 3 },
			{ label: 'Obere Ligen oder Turniere', points: 4 }
		]
	},
	{
		id: 'vergleich',
		question: 'Wie schätzt du dich im Vergleich zu anderen Vereinsspieler:innen ein?',
		options: [
			{ label: 'Deutlich unter dem Durchschnitt', points: 0 },
			{ label: 'Eher unter dem Durchschnitt', points: 1 },
			{ label: 'Etwa Durchschnitt', points: 2 },
			{ label: 'Eher über dem Durchschnitt', points: 3 },
			{ label: 'Deutlich über dem Durchschnitt', points: 4 }
		]
	}
];

const MAX_POINTS = LEVEL_QUESTIONS.length * 4; // 24

/** Rundet auf die nächste 0.5-Stufe — dieselbe Granularität wie self_assessed_level. */
function roundToHalf(value: number): number {
	return Math.round(value * 2) / 2;
}

/**
 * Rechnet Antworten (Frage-ID -> Punkte) auf die 0–7-Anzeigeskala um.
 * Fehlende Antworten zählen als 0 Punkte statt den Schnitt zu verzerren.
 */
export function estimateLevel(answers: Record<string, number>): number {
	const total = LEVEL_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
	const scaled = (total / MAX_POINTS) * 7;
	return Math.max(0, Math.min(7, roundToHalf(scaled)));
}

export interface LevelBand {
	label: string;
	description: string;
}

const BANDS: { max: number; band: LevelBand }[] = [
	{
		max: 1.5,
		band: {
			label: 'Einstieg',
			description: 'Du lernst gerade die Grundlagen — genau der richtige Zeitpunkt, um mitzuzählen.'
		}
	},
	{
		max: 3,
		band: {
			label: 'Aufbau',
			description: 'Die Grundschläge sitzen, jetzt geht es an Konstanz und Spielverständnis.'
		}
	},
	{
		max: 4.5,
		band: {
			label: 'Fortgeschritten',
			description: 'Du spielst regelmäßig und triffst die meisten Bälle dahin, wo du willst.'
		}
	},
	{
		max: 6,
		band: {
			label: 'Starker Vereinsspieler',
			description: 'Taktik, Wandspiel und Konstanz sind bei dir schon ziemlich weit.'
		}
	},
	{
		max: 7,
		band: {
			label: 'Sehr stark',
			description: 'Du spielst auf einem Niveau, das die wenigsten Vereinsspieler:innen erreichen.'
		}
	}
];

/** Kurzbeschreibung für den geschätzten Level-Bereich, rein informativ für die UI. */
export function levelBand(level: number): LevelBand {
	const found = BANDS.find((b) => level <= b.max);
	return (found ?? BANDS[BANDS.length - 1]).band;
}

/** Für die Ergebnis-URL: 0, 0.5, 1 ... 7 als Text, damit sie stabil in der Query-String steht. */
export function formatLevelParam(level: number): string {
	return level.toFixed(1);
}

/** Parst den Level-Query-Parameter defensiv — ungültige/fehlende Werte ergeben null. */
export function parseLevelParam(value: string | null): number | null {
	if (value === null) return null;
	const n = Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.max(0, Math.min(7, roundToHalf(n)));
}
