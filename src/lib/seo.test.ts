import { describe, expect, it } from 'vitest';
import { isProfileIndexable, MIN_MATCHES_FOR_INDEXING } from './seo';

describe('isProfileIndexable', () => {
	it('ist erst ab der Mindestanzahl bestätigter Matches indexierbar', () => {
		expect(isProfileIndexable(MIN_MATCHES_FOR_INDEXING - 1)).toBe(false);
		expect(isProfileIndexable(MIN_MATCHES_FOR_INDEXING)).toBe(true);
		expect(isProfileIndexable(MIN_MATCHES_FOR_INDEXING + 10)).toBe(true);
	});

	it('behandelt 0 Matches als nicht indexierbar', () => {
		expect(isProfileIndexable(0)).toBe(false);
	});
});
