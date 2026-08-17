import { describe, expect, it } from 'vitest';
import {
	classifyClaim,
	computeSeedFromClaims,
	scorePlausibility,
	SEED_LOCK_MATCHES,
	type ClaimContext,
	type ExtractedClaim
} from './external-claims';

const claim: ExtractedClaim = {
	platform: 'playtomic',
	displayNameOnScreenshot: 'Max M.',
	ratingValue: 4.2,
	ratingLabel: 'Nivel 4.20',
	scaleType: 'level_0_7',
	matchesPlayedShown: 47,
	snapshotDateVisible: null,
	extractionConfidence: 0.91,
	ambiguityNotes: null
};

function ctx(over: Partial<ClaimContext> = {}): ClaimContext {
	return {
		claimedHandle: 'max-m',
		playerDisplayName: 'Max M.',
		screenshotHash: 'abc',
		previousHashesForOtherPlayers: new Set(),
		now: new Date('2026-08-17T12:00:00Z'),
		...over
	};
}

describe('scorePlausibility', () => {
	it('accepts a matching Playtomic screenshot', () => {
		const result = scorePlausibility(claim, ctx());
		expect(result.score).toBeGreaterThanOrEqual(0.8);
		expect(result.flags).toEqual([]);
	});

	it('flags a name mismatch', () => {
		const result = scorePlausibility(
			{ ...claim, displayNameOnScreenshot: 'Someone Else' },
			ctx()
		);
		expect(result.flags).toContain('name_mismatch');
		expect(result.score).toBeLessThan(0.5);
	});
});

describe('classifyClaim', () => {
	it('auto-verifies high confidence + plausibility', () => {
		expect(classifyClaim(0.91, { score: 0.9, flags: [] })).toBe('auto_verified');
	});

	it('rejects low plausibility', () => {
		expect(classifyClaim(0.9, { score: 0.2, flags: ['name_mismatch'] })).toBe('rejected');
	});
});

describe('computeSeedFromClaims', () => {
	it('refuses to seed after the lock threshold', () => {
		expect(() =>
			computeSeedFromClaims(
				[
					{
						platform: 'playtomic',
						ratingValue: 4.2,
						scaleType: 'level_0_7',
						status: 'auto_verified',
						plausibilityScore: 0.9,
						extractionConfidence: 0.91
					}
				],
				SEED_LOCK_MATCHES,
				3
			)
		).toThrow(/geschlossen/);
	});
});
