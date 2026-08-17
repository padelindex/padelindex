import { describe, expect, it } from 'vitest';
import { isUsableClaimQuery, matchClaimName, normalizeName, similarity } from './claim-match';

// Erfundene Namen. Sie bilden bewusst die Eigenschaften nach, die im
// echten Bestand vorkommen und den Abgleich schwer machen: Umlaute,
// mehrteilige Nachnamen und zwei Paare, die sich nur minimal
// unterscheiden. Keine echten Personen — dieses Repo ist öffentlich.
const roster = [
	{ id: '1', displayName: 'Jörg Feldkamp' },
	{ id: '2', displayName: 'Roland Kettwig' },
	{ id: '3', displayName: 'Mateo Ferrer Vidal' },
	{ id: '4', displayName: 'Kerstin Mühlbauer' },
	{ id: '5', displayName: 'Timo Berger Lindqvist' },
	{ id: '6', displayName: 'Tino Berger Lindqvist' },
	{ id: '7', displayName: 'Silke Sprengel' },
	{ id: '8', displayName: 'Gregor Sprengel' }
];

describe('normalizeName', () => {
	it('löst Umlaute auf', () => {
		expect(normalizeName('Jörg Feldkamp')).toBe('joerg feldkamp');
		expect(normalizeName('Kerstin Mühlbauer')).toBe('kerstin muehlbauer');
	});

	it('normalisiert Leerraum und Satzzeichen', () => {
		expect(normalizeName('  Lars   Vogt ')).toBe('lars vogt');
		expect(normalizeName('Jean-Luc Picard')).toBe('jean luc picard');
	});
});

describe('similarity', () => {
	it('erkennt Gleichheit', () => {
		expect(similarity('lars vogt', 'lars vogt')).toBe(1);
	});

	it('bewertet Tippfehler hoch', () => {
		expect(similarity('lars vogt', 'lars vgt')).toBeGreaterThan(0.85);
	});

	it('bewertet verschiedene Namen niedrig', () => {
		expect(similarity('lars vogt', 'mara vogt')).toBeLessThan(0.82);
	});
});

describe('isUsableClaimQuery', () => {
	it('verlangt Vor- und Nachname', () => {
		expect(isUsableClaimQuery('Jörg Feldkamp')).toBe(true);
		expect(isUsableClaimQuery('Jörg')).toBe(false);
		expect(isUsableClaimQuery('a b')).toBe(false);
		expect(isUsableClaimQuery('')).toBe(false);
	});
});

describe('matchClaimName', () => {
	it('findet den passenden Spieler', () => {
		const hit = matchClaimName('Jörg Feldkamp', roster);
		expect(hit?.match.id).toBe('1');
	});

	it('verzeiht Umlaut-Schreibweisen', () => {
		expect(matchClaimName('Joerg Feldkamp', roster)?.match.id).toBe('1');
		expect(matchClaimName('Kerstin Muehlbauer', roster)?.match.id).toBe('4');
	});

	it('verzeiht kleine Tippfehler', () => {
		expect(matchClaimName('Roland Ketwig', roster)?.match.id).toBe('2');
		expect(matchClaimName('Silk Sprengel', roster)?.match.id).toBe('7');
	});

	it('lehnt zu unspezifische Eingaben ab', () => {
		expect(matchClaimName('Jörg', roster)).toBeNull();
		expect(matchClaimName('a', roster)).toBeNull();
	});

	it('lehnt Unbekannte ab', () => {
		expect(matchClaimName('Roger Federer', roster)).toBeNull();
	});

	// Der wichtigste Fall: zwei fast gleiche Namen im selben Verein.
	// Lieber kein Treffer als das falsche Profil an den falschen Menschen.
	it('verweigert die Zuordnung bei zwei ähnlich guten Kandidaten', () => {
		expect(matchClaimName('Berger Lindqvist', roster)).toBeNull();
	});

	it('trennt Namensvettern, wenn der Vorname eindeutig ist', () => {
		expect(matchClaimName('Silke Sprengel', roster)?.match.id).toBe('7');
		expect(matchClaimName('Gregor Sprengel', roster)?.match.id).toBe('8');
	});

	it('kommt mit leerer Kandidatenliste klar', () => {
		expect(matchClaimName('Jörg Feldkamp', [])).toBeNull();
	});
});
