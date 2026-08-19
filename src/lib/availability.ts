// ============================================================
// PadelIndex — Freie Spielzeiten (reine Typen & Validierung)
// ============================================================
// Keine Datenbankzugriffe — dieselbe Trennung wie match-report.ts:
// die Regeln stehen hier und sind ohne Mock testbar, der Datenzugriff
// liegt in lib/server/availabilities.ts.

export type AvailabilityMatchType = 'friendly' | 'competitive' | 'training' | 'tournament_prep';
export type PreferredFormat = 'doubles' | 'mixed' | 'open';
export type DesiredLevel = 'similar' | 'slightly_stronger' | 'much_stronger' | 'any';
export type AvailabilityStatus = 'active' | 'paused' | 'deleted';

export const AVAILABILITY_MATCH_TYPES: readonly AvailabilityMatchType[] = [
	'friendly',
	'competitive',
	'training',
	'tournament_prep'
];

export const PREFERRED_FORMATS: readonly PreferredFormat[] = ['open', 'doubles', 'mixed'];

export const DESIRED_LEVELS: readonly DesiredLevel[] = [
	'any',
	'similar',
	'slightly_stronger',
	'much_stronger'
];

export const AVAILABILITY_MATCH_TYPE_LABELS: Record<AvailabilityMatchType, string> = {
	friendly: 'Freundschaftlich',
	competitive: 'Wettkampf',
	training: 'Training',
	tournament_prep: 'Turniervorbereitung'
};

export const PREFERRED_FORMAT_LABELS: Record<PreferredFormat, string> = {
	open: 'Offen',
	doubles: 'Doppel',
	mixed: 'Mixed'
};

export const DESIRED_LEVEL_LABELS: Record<DesiredLevel, string> = {
	any: 'Egal',
	similar: 'Ähnlich',
	slightly_stronger: 'Etwas stärker',
	much_stronger: 'Deutlich stärker'
};

/** 0 = Montag (ISO-nah), damit die UI-Reihenfolge der Woche entspricht. */
export const WEEKDAY_LABELS = [
	'Montag',
	'Dienstag',
	'Mittwoch',
	'Donnerstag',
	'Freitag',
	'Samstag',
	'Sonntag'
] as const;

export type AvailabilityInput = {
	weekday: number | null;
	specificDate: string | null;
	startTime: string;
	endTime: string;
	isRecurring: boolean;
	clubId: string | null;
	maxDistanceKm: number;
	matchType: AvailabilityMatchType;
	preferredFormat: PreferredFormat;
	desiredLevel: DesiredLevel;
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_DISTANCE_KM = 500;

/** "HH:MM" -> Minuten seit Mitternacht. -1 bei ungültigem Format. */
export function toMinutes(time: string): number {
	if (!TIME_PATTERN.test(time)) return -1;
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

export function validateAvailability(input: AvailabilityInput): ValidationResult {
	if (toMinutes(input.startTime) < 0 || toMinutes(input.endTime) < 0) {
		return { ok: false, message: 'Uhrzeiten müssen im Format HH:MM angegeben werden.' };
	}
	if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
		return { ok: false, message: 'Die Endzeit muss nach der Startzeit liegen.' };
	}

	if (input.isRecurring) {
		if (input.weekday === null || !Number.isInteger(input.weekday) || input.weekday < 0 || input.weekday > 6) {
			return { ok: false, message: 'Bitte einen Wochentag auswählen.' };
		}
		if (input.specificDate) {
			return { ok: false, message: 'Wöchentliche Zeiten haben kein festes Datum.' };
		}
	} else {
		if (!input.specificDate || !DATE_PATTERN.test(input.specificDate)) {
			return { ok: false, message: 'Bitte ein gültiges Datum angeben.' };
		}
	}

	if (
		!Number.isInteger(input.maxDistanceKm) ||
		input.maxDistanceKm < 0 ||
		input.maxDistanceKm > MAX_DISTANCE_KM
	) {
		return { ok: false, message: `Entfernung muss zwischen 0 und ${MAX_DISTANCE_KM} km liegen.` };
	}

	if (!AVAILABILITY_MATCH_TYPES.includes(input.matchType)) {
		return { ok: false, message: 'Ungültiger Matchtyp.' };
	}
	if (!PREFERRED_FORMATS.includes(input.preferredFormat)) {
		return { ok: false, message: 'Ungültiges Format.' };
	}
	if (!DESIRED_LEVELS.includes(input.desiredLevel)) {
		return { ok: false, message: 'Ungültiges Spielniveau.' };
	}

	return { ok: true };
}

/**
 * Wochentag eines ISO-Datums nach unserer Konvention (0 = Montag).
 * getDay() liefert 0 = Sonntag, deshalb die Verschiebung.
 */
export function weekdayOfDate(isoDate: string): number {
	return (new Date(`${isoDate}T12:00:00Z`).getUTCDay() + 6) % 7;
}
