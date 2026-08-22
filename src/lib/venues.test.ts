import { describe, expect, it } from 'vitest';
import { filterVenues, matchesFilter, matchesQuery, normalizeForSearch } from './venues';

const venue = (over: Partial<Parameters<typeof matchesQuery>[0]> = {}) => ({
	name: 'STC Oberland',
	city: 'Wolfratshausen',
	postalCode: '82515',
	isPartner: true,
	...over
});

describe('normalizeForSearch', () => {
	it('faltet deutsche Umlaute auf ihre Zweibuchstaben-Form', () => {
		expect(normalizeForSearch('München')).toBe('muenchen');
		expect(normalizeForSearch('Köln')).toBe('koeln');
		expect(normalizeForSearch('Grüßau')).toBe('gruessau');
	});
});

describe('matchesQuery', () => {
	it('findet über den Namen', () => {
		expect(matchesQuery(venue(), 'oberland')).toBe(true);
	});

	it('findet über die Stadt', () => {
		expect(matchesQuery(venue(), 'wolfrats')).toBe(true);
	});

	it('findet über die Postleitzahl', () => {
		expect(matchesQuery(venue(), '82515')).toBe(true);
	});

	it('findet Umlaut-Städte auch ohne Umlaut-Eingabe', () => {
		const v = venue({ city: 'München' });
		expect(matchesQuery(v, 'munchen')).toBe(false); // "u" statt "ue" trifft bewusst nicht
		expect(matchesQuery(v, 'muenchen')).toBe(true);
		expect(matchesQuery(v, 'münch')).toBe(true);
	});

	it('leerer Begriff trifft alles', () => {
		expect(matchesQuery(venue(), '')).toBe(true);
		expect(matchesQuery(venue(), '   ')).toBe(true);
	});

	it('kommt mit fehlender Stadt und PLZ klar', () => {
		const v = venue({ city: null, postalCode: null });
		expect(matchesQuery(v, 'oberland')).toBe(true);
		expect(matchesQuery(v, 'wolfrats')).toBe(false);
	});
});

describe('matchesFilter', () => {
	it('trennt Partner von Nicht-Partnern', () => {
		expect(matchesFilter(venue({ isPartner: true }), 'partner')).toBe(true);
		expect(matchesFilter(venue({ isPartner: false }), 'partner')).toBe(false);
		expect(matchesFilter(venue({ isPartner: false }), 'non_partner')).toBe(true);
		expect(matchesFilter(venue({ isPartner: true }), 'non_partner')).toBe(false);
	});

	it('"all" lässt beide durch', () => {
		expect(matchesFilter(venue({ isPartner: true }), 'all')).toBe(true);
		expect(matchesFilter(venue({ isPartner: false }), 'all')).toBe(true);
	});
});

describe('filterVenues', () => {
	const list = [
		venue({ name: 'STC Oberland', city: 'Wolfratshausen', isPartner: true }),
		venue({ name: 'Padel Köln', city: 'Köln', postalCode: '50667', isPartner: false }),
		venue({ name: 'Beispielhalle', city: 'München', postalCode: '80331', isPartner: false })
	];

	it('kombiniert Filter und Suche', () => {
		expect(filterVenues(list, 'non_partner', 'koeln').map((v) => v.name)).toEqual(['Padel Köln']);
	});

	it('Filter allein schränkt korrekt ein', () => {
		expect(filterVenues(list, 'partner', '')).toHaveLength(1);
		expect(filterVenues(list, 'non_partner', '')).toHaveLength(2);
		expect(filterVenues(list, 'all', '')).toHaveLength(3);
	});

	it('gibt eine leere Liste zurück statt zu werfen, wenn nichts passt', () => {
		expect(filterVenues(list, 'partner', 'hamburg')).toEqual([]);
	});
});
