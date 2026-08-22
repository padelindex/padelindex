import { describe, expect, it } from 'vitest';
import {
	MAX_DISTANCE_KM,
	toMinutes,
	validateAvailability,
	weekdayOfDate,
	type AvailabilityInput
} from './availability';

const base: AvailabilityInput = {
	weekday: 1,
	specificDate: null,
	startTime: '18:00',
	endTime: '20:00',
	isRecurring: true,
	clubId: null,
	maxDistanceKm: 25,
	matchType: 'friendly',
	preferredFormat: 'open',
	desiredLevel: 'similar'
};

describe('toMinutes', () => {
	it('rechnet gültige Zeiten um', () => {
		expect(toMinutes('00:00')).toBe(0);
		expect(toMinutes('18:30')).toBe(1110);
		expect(toMinutes('23:59')).toBe(1439);
	});

	it('lehnt ungültige Formate mit -1 ab', () => {
		expect(toMinutes('24:00')).toBe(-1);
		expect(toMinutes('18:60')).toBe(-1);
		expect(toMinutes('8:00')).toBe(-1);
		expect(toMinutes('abc')).toBe(-1);
		expect(toMinutes('')).toBe(-1);
	});
});

describe('validateAvailability', () => {
	it('akzeptiert eine gültige wöchentliche Zeit', () => {
		expect(validateAvailability(base)).toEqual({ ok: true });
	});

	it('akzeptiert eine gültige einmalige Zeit', () => {
		expect(
			validateAvailability({ ...base, isRecurring: false, weekday: null, specificDate: '2026-04-15' })
		).toEqual({ ok: true });
	});

	it('lehnt Endzeit vor oder gleich Startzeit ab', () => {
		expect(validateAvailability({ ...base, endTime: '18:00' }).ok).toBe(false);
		expect(validateAvailability({ ...base, endTime: '17:00' }).ok).toBe(false);
	});

	it('lehnt ungültige Uhrzeitformate ab', () => {
		expect(validateAvailability({ ...base, startTime: '25:00' }).ok).toBe(false);
	});

	it('verlangt bei wöchentlichen Zeiten einen Wochentag', () => {
		expect(validateAvailability({ ...base, weekday: null }).ok).toBe(false);
		expect(validateAvailability({ ...base, weekday: 7 }).ok).toBe(false);
		expect(validateAvailability({ ...base, weekday: -1 }).ok).toBe(false);
	});

	it('akzeptiert beide Wochentags-Ränder', () => {
		expect(validateAvailability({ ...base, weekday: 0 }).ok).toBe(true);
		expect(validateAvailability({ ...base, weekday: 6 }).ok).toBe(true);
	});

	it('verlangt bei einmaligen Zeiten ein gültiges Datum', () => {
		const once = { ...base, isRecurring: false, weekday: null };
		expect(validateAvailability({ ...once, specificDate: null }).ok).toBe(false);
		expect(validateAvailability({ ...once, specificDate: '15.04.2026' }).ok).toBe(false);
	});

	it('lehnt wöchentliche Zeiten mit festem Datum ab', () => {
		expect(validateAvailability({ ...base, specificDate: '2026-04-15' }).ok).toBe(false);
	});

	it('prüft die Entfernungsgrenzen', () => {
		expect(validateAvailability({ ...base, maxDistanceKm: 0 }).ok).toBe(true);
		expect(validateAvailability({ ...base, maxDistanceKm: MAX_DISTANCE_KM }).ok).toBe(true);
		expect(validateAvailability({ ...base, maxDistanceKm: -1 }).ok).toBe(false);
		expect(validateAvailability({ ...base, maxDistanceKm: MAX_DISTANCE_KM + 1 }).ok).toBe(false);
		expect(validateAvailability({ ...base, maxDistanceKm: 12.5 }).ok).toBe(false);
	});

	it('lehnt unbekannte Enum-Werte ab', () => {
		// @ts-expect-error absichtlich ungültig
		expect(validateAvailability({ ...base, matchType: 'urlaub' }).ok).toBe(false);
		// @ts-expect-error absichtlich ungültig
		expect(validateAvailability({ ...base, preferredFormat: 'einzel' }).ok).toBe(false);
		// @ts-expect-error absichtlich ungültig
		expect(validateAvailability({ ...base, desiredLevel: 'schwaecher' }).ok).toBe(false);
	});
});

describe('weekdayOfDate', () => {
	it('bildet 0 = Montag ab', () => {
		// 2026-04-13 ist ein Montag
		expect(weekdayOfDate('2026-04-13')).toBe(0);
		expect(weekdayOfDate('2026-04-18')).toBe(5); // Samstag
		expect(weekdayOfDate('2026-04-19')).toBe(6); // Sonntag
	});
});
