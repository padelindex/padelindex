import { describe, expect, it } from 'vitest';
import { computeBadges, longestStreak } from './badges';

describe('longestStreak', () => {
	it('findet die längste Folge von Siegen', () => {
		expect(longestStreak([true, true, false, true, true, true])).toBe(3);
	});

	it('zählt eine Folge am Ende', () => {
		expect(longestStreak([false, true, true, true, true, true, true, true, true, true, true])).toBe(
			10
		);
	});

	it('leere Liste -> 0', () => {
		expect(longestStreak([])).toBe(0);
	});

	it('keine Siege -> 0', () => {
		expect(longestStreak([false, false, false])).toBe(0);
	});
});

describe('computeBadges', () => {
	it('vergibt win_streak_10 erst ab genau 10', () => {
		const nine = computeBadges({
			resultsChronological: Array(9).fill(true),
			mixedMatchCount: 0,
			isMostImprovedInClub: false
		});
		expect(nine.map((b) => b.id)).not.toContain('win_streak_10');

		const ten = computeBadges({
			resultsChronological: Array(10).fill(true),
			mixedMatchCount: 0,
			isMostImprovedInClub: false
		});
		expect(ten.map((b) => b.id)).toContain('win_streak_10');
	});

	it('vergibt mixed_specialist ab dem Schwellwert', () => {
		const below = computeBadges({
			resultsChronological: [],
			mixedMatchCount: 4,
			isMostImprovedInClub: false
		});
		expect(below.map((b) => b.id)).not.toContain('mixed_specialist');

		const at = computeBadges({
			resultsChronological: [],
			mixedMatchCount: 5,
			isMostImprovedInClub: false
		});
		expect(at.map((b) => b.id)).toContain('mixed_specialist');
	});

	it('vergibt most_improved nur bei isMostImprovedInClub', () => {
		const no = computeBadges({
			resultsChronological: [],
			mixedMatchCount: 0,
			isMostImprovedInClub: false
		});
		expect(no).toHaveLength(0);

		const yes = computeBadges({
			resultsChronological: [],
			mixedMatchCount: 0,
			isMostImprovedInClub: true
		});
		expect(yes.map((b) => b.id)).toEqual(['most_improved']);
	});

	it('kann mehrere Badges gleichzeitig vergeben', () => {
		const badges = computeBadges({
			resultsChronological: Array(12).fill(true),
			mixedMatchCount: 7,
			isMostImprovedInClub: true
		});
		expect(badges.map((b) => b.id).sort()).toEqual(
			['win_streak_10', 'most_improved', 'mixed_specialist'].sort()
		);
	});
});
