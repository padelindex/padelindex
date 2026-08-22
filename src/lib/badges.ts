// ============================================================
// PadelIndex — Badges (rein berechnet, nichts gespeichert)
// ============================================================
// Bewusst KEINE eigene Tabelle: Badges werden bei jedem Profilaufruf aus
// den ohnehin geladenen Daten neu bestimmt. Das ist immer korrekt (kein
// "vergessenes Vergeben" wie bei einem Cron/Trigger) und für die aktuell
// drei unterstützten Badges billig genug, um live zu rechnen.
//
// Nur die drei Badges, die sich aus bestehenden Daten ableiten lassen —
// "Turniersieger", "Club Champion" und "Comeback King" brauchen Konzepte
// (Turnier-Ergebnisse, Saison, eine genaue Comeback-Regel), die es im
// Schema noch nicht gibt.

export type BadgeId = 'win_streak_10' | 'most_improved' | 'mixed_specialist';

export type Badge = { id: BadgeId; label: string; detail: string };

const BADGE_INFO: Record<BadgeId, { label: string; detail: (n?: number) => string }> = {
	win_streak_10: {
		label: '10 Siege in Folge',
		detail: () => 'Zehn bestätigte Siege am Stück geschafft.'
	},
	most_improved: {
		label: 'Most Improved Player',
		detail: () => 'Größter Rating-Zuwachs im Verein der letzten 30 Tage.'
	},
	mixed_specialist: {
		label: 'Mixed Specialist',
		detail: (n) => `${n} bestätigte Mixed-Matches gespielt.`
	}
};

/** Längste Folge von true in der Liste — Reihenfolge muss chronologisch sein. */
export function longestStreak(results: boolean[]): number {
	let longest = 0;
	let current = 0;
	for (const won of results) {
		current = won ? current + 1 : 0;
		if (current > longest) longest = current;
	}
	return longest;
}

export const WIN_STREAK_BADGE_THRESHOLD = 10;
export const MIXED_SPECIALIST_THRESHOLD = 5;

export function computeBadges(input: {
	/** Chronologisch (älteste zuerst) — longestStreak() braucht die Reihenfolge. */
	resultsChronological: boolean[];
	mixedMatchCount: number;
	isMostImprovedInClub: boolean;
}): Badge[] {
	const badges: Badge[] = [];

	if (longestStreak(input.resultsChronological) >= WIN_STREAK_BADGE_THRESHOLD) {
		badges.push({
			id: 'win_streak_10',
			label: BADGE_INFO.win_streak_10.label,
			detail: BADGE_INFO.win_streak_10.detail()
		});
	}

	if (input.isMostImprovedInClub) {
		badges.push({
			id: 'most_improved',
			label: BADGE_INFO.most_improved.label,
			detail: BADGE_INFO.most_improved.detail()
		});
	}

	if (input.mixedMatchCount >= MIXED_SPECIALIST_THRESHOLD) {
		badges.push({
			id: 'mixed_specialist',
			label: BADGE_INFO.mixed_specialist.label,
			detail: BADGE_INFO.mixed_specialist.detail(input.mixedMatchCount)
		});
	}

	return badges;
}
