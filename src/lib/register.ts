// ============================================================
// PadelIndex — Validierung für die klassische Registrierung
// ============================================================
// Reine Funktionen, client- UND serverseitig verwendbar (siehe
// routes/registrieren) — die serverseitige Prüfung ist die, die zählt
// (nie einer Formvalidierung im Browser vertrauen), die Client-Nutzung
// ist nur für sofortiges Feedback.

/** Mindestalter für eine eigene Registrierung — DSGVO Art. 8 legt den
 *  Standard in Deutschland auf 16 fest (kein abweichendes Landesgesetz). */
export const MIN_REGISTRATION_AGE = 16;
export const MAX_PLAUSIBLE_AGE = 120;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_TEXT_FIELD_LENGTH = 80;

export type RegisterInput = {
	firstName: string;
	lastName: string;
	birthDate: string; // yyyy-mm-dd, wie aus <input type="date">
	clubName: string;
	email: string;
	password: string;
	passwordRepeat: string;
};

export type RegisterFieldErrors = Partial<Record<keyof RegisterInput, string>>;

function isNonEmpty(value: string, max = MAX_TEXT_FIELD_LENGTH): boolean {
	const trimmed = value.trim();
	return trimmed.length > 0 && trimmed.length <= max;
}

/** true, wenn `iso` ein echtes Kalenderdatum ist (kein "31.02.…", das
 *  `new Date()` sonst stillschweigend auf März verschiebt). */
export function isValidCalendarDate(iso: string): boolean {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!match) return false;
	const [, y, m, d] = match;
	const year = Number(y);
	const month = Number(m);
	const day = Number(d);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
	);
}

/** Alter in vollen Jahren zu einem Stichtag (Default: heute). */
export function ageInYears(birthDateIso: string, today: Date = new Date()): number {
	const [y, m, d] = birthDateIso.split('-').map(Number);
	let age = today.getUTCFullYear() - y;
	const hadBirthdayThisYear =
		today.getUTCMonth() + 1 > m || (today.getUTCMonth() + 1 === m && today.getUTCDate() >= d);
	if (!hadBirthdayThisYear) age -= 1;
	return age;
}

export function isPlausibleBirthDate(iso: string): boolean {
	if (!isValidCalendarDate(iso)) return false;
	const age = ageInYears(iso);
	return age >= MIN_REGISTRATION_AGE && age <= MAX_PLAUSIBLE_AGE;
}

/** Mind. 8 Zeichen, ein Klein-, ein Großbuchstabe, eine Ziffer — spiegelt
 *  password_requirements = "lower_upper_letters_digits" in config.toml. */
export function isStrongEnoughPassword(password: string): boolean {
	return (
		password.length >= MIN_PASSWORD_LENGTH &&
		/[a-z]/.test(password) &&
		/[A-Z]/.test(password) &&
		/[0-9]/.test(password)
	);
}

/**
 * Validiert alle Registrierungsfelder serverseitig. Gibt für jedes
 * ungültige Feld eine Nutzer-lesbare Meldung zurück; ein leeres Objekt
 * heißt "alles in Ordnung".
 */
export function validateRegisterInput(
	input: RegisterInput,
	isValidEmail: (value: string) => boolean
): RegisterFieldErrors {
	const errors: RegisterFieldErrors = {};

	if (!isNonEmpty(input.firstName)) errors.firstName = 'Bitte deinen Vornamen eingeben.';
	if (!isNonEmpty(input.lastName)) errors.lastName = 'Bitte deinen Nachnamen eingeben.';
	if (!isNonEmpty(input.clubName)) errors.clubName = 'Bitte deinen Verein eingeben.';

	if (!input.birthDate) {
		errors.birthDate = 'Bitte dein Geburtsdatum eingeben.';
	} else if (!isValidCalendarDate(input.birthDate)) {
		errors.birthDate = 'Das ist kein gültiges Datum.';
	} else if (ageInYears(input.birthDate) < MIN_REGISTRATION_AGE) {
		errors.birthDate = `Du musst mindestens ${MIN_REGISTRATION_AGE} Jahre alt sein, um dich zu registrieren.`;
	} else if (ageInYears(input.birthDate) > MAX_PLAUSIBLE_AGE) {
		errors.birthDate = 'Bitte dein echtes Geburtsdatum eingeben.';
	}

	if (!input.email || !isValidEmail(input.email)) {
		errors.email = 'Bitte eine gültige E-Mail-Adresse eingeben.';
	}

	if (!isStrongEnoughPassword(input.password)) {
		errors.password = `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen, mit Groß-, Kleinbuchstaben und einer Zahl.`;
	} else if (input.password !== input.passwordRepeat) {
		errors.passwordRepeat = 'Die Passwörter stimmen nicht überein.';
	}

	return errors;
}
