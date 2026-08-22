import { describe, expect, it } from 'vitest';
import {
	ageInYears,
	isPlausibleBirthDate,
	isStrongEnoughPassword,
	isValidCalendarDate,
	validateRegisterInput,
	type RegisterInput
} from './register';
import { isValidEmail } from './email';

describe('isValidCalendarDate', () => {
	it('akzeptiert echte Daten', () => {
		expect(isValidCalendarDate('2000-01-31')).toBe(true);
		expect(isValidCalendarDate('2024-02-29')).toBe(true); // Schaltjahr
	});

	it('lehnt kalendarisch unmögliche Daten ab, statt sie zu verschieben', () => {
		expect(isValidCalendarDate('2001-02-30')).toBe(false);
		expect(isValidCalendarDate('2023-02-29')).toBe(false); // kein Schaltjahr
		expect(isValidCalendarDate('2000-13-01')).toBe(false);
	});

	it('lehnt falsch formatierte Werte ab', () => {
		expect(isValidCalendarDate('31.01.2000')).toBe(false);
		expect(isValidCalendarDate('')).toBe(false);
		expect(isValidCalendarDate('not-a-date')).toBe(false);
	});
});

describe('ageInYears', () => {
	const today = new Date(Date.UTC(2026, 5, 15)); // 15. Juni 2026

	it('rechnet volle Jahre, Geburtstag schon gehabt', () => {
		expect(ageInYears('2000-06-15', today)).toBe(26);
		expect(ageInYears('2000-01-01', today)).toBe(26);
	});

	it('zieht ein Jahr ab, wenn der Geburtstag dieses Jahr noch aussteht', () => {
		expect(ageInYears('2000-06-16', today)).toBe(25);
		expect(ageInYears('2000-12-31', today)).toBe(25);
	});
});

describe('isPlausibleBirthDate', () => {
	it('lehnt zu junge Geburtsdaten ab', () => {
		const tenYearsAgo = new Date();
		tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
		const iso = tenYearsAgo.toISOString().slice(0, 10);
		expect(isPlausibleBirthDate(iso)).toBe(false);
	});

	it('akzeptiert ein plausibles Erwachsenenalter', () => {
		expect(isPlausibleBirthDate('1990-05-20')).toBe(true);
	});

	it('lehnt unrealistisch hohes Alter ab', () => {
		expect(isPlausibleBirthDate('1850-01-01')).toBe(false);
	});
});

describe('isStrongEnoughPassword', () => {
	it('verlangt Länge, Groß-, Kleinbuchstaben und Ziffer', () => {
		expect(isStrongEnoughPassword('Abcdefg1')).toBe(true);
		expect(isStrongEnoughPassword('short1A')).toBe(false); // zu kurz
		expect(isStrongEnoughPassword('alllowercase1')).toBe(false); // kein Großbuchstabe
		expect(isStrongEnoughPassword('ALLUPPERCASE1')).toBe(false); // kein Kleinbuchstabe
		expect(isStrongEnoughPassword('NoDigitsHere')).toBe(false); // keine Ziffer
	});
});

describe('validateRegisterInput', () => {
	const valid: RegisterInput = {
		firstName: 'Alex',
		lastName: 'Muster',
		birthDate: '1990-05-20',
		clubName: 'STC Oberland',
		email: 'alex@example.com',
		password: 'Abcdefg1',
		passwordRepeat: 'Abcdefg1'
	};

	it('lässt ein vollständig gültiges Formular durch', () => {
		expect(validateRegisterInput(valid, isValidEmail)).toEqual({});
	});

	it('meldet fehlende Pflichtfelder', () => {
		const errors = validateRegisterInput({ ...valid, firstName: '  ', clubName: '' }, isValidEmail);
		expect(errors.firstName).toBeTruthy();
		expect(errors.clubName).toBeTruthy();
	});

	it('meldet ein zu junges Geburtsdatum', () => {
		const errors = validateRegisterInput({ ...valid, birthDate: '2020-01-01' }, isValidEmail);
		expect(errors.birthDate).toBeTruthy();
	});

	it('meldet eine ungültige E-Mail-Adresse', () => {
		const errors = validateRegisterInput({ ...valid, email: 'not-an-email' }, isValidEmail);
		expect(errors.email).toBeTruthy();
	});

	it('meldet ein zu schwaches Passwort', () => {
		const errors = validateRegisterInput(
			{ ...valid, password: 'weak', passwordRepeat: 'weak' },
			isValidEmail
		);
		expect(errors.password).toBeTruthy();
	});

	it('meldet nicht übereinstimmende Passwörter', () => {
		const errors = validateRegisterInput(
			{ ...valid, password: 'Abcdefg1', passwordRepeat: 'Abcdefg2' },
			isValidEmail
		);
		expect(errors.passwordRepeat).toBeTruthy();
	});

	it('"Passwort wiederholen" ist nur über den Abgleich Pflicht, nicht als eigenes Pflichtfeld', () => {
		// Deckt die Vorgabe ab: alle Felder außer "Passwort wiederholen" sind
		// Pflichtfelder — ein leeres Repeat-Feld fällt trotzdem über den
		// Abgleich mit dem echten Passwort auf, nicht weil es "leer" ist.
		const errors = validateRegisterInput({ ...valid, passwordRepeat: '' }, isValidEmail);
		expect(errors.passwordRepeat).toBeTruthy();
	});
});
