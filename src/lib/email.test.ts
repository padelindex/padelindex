import { describe, expect, it } from 'vitest';
import { isValidEmail } from './email';

describe('isValidEmail', () => {
	it('akzeptiert gültige Adressen', () => {
		expect(isValidEmail('a@b.de')).toBe(true);
		expect(isValidEmail('chris.hahn@example.com')).toBe(true);
	});

	it('lehnt offensichtlich ungültige Adressen ab', () => {
		expect(isValidEmail('')).toBe(false);
		expect(isValidEmail('a@b')).toBe(false);
		expect(isValidEmail('a b@c.de')).toBe(false);
		expect(isValidEmail('a@@b.de')).toBe(false);
	});
});
