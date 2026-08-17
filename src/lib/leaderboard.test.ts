import { describe, expect, it } from 'vitest';
import { clampLeaderboardLimit } from './leaderboard';

describe('clampLeaderboardLimit', () => {
	it('caps free clubs at 10', () => {
		expect(clampLeaderboardLimit(50, 'free')).toBe(10);
	});

	it('allows basic/pro up to 50', () => {
		expect(clampLeaderboardLimit(40, 'basic')).toBe(40);
		expect(clampLeaderboardLimit(80, 'pro')).toBe(50);
	});
});
