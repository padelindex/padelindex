// ============================================================
// PadelIndex — Formkurve & bevorzugte Partner (reine Funktionen)
// ============================================================
// Nimmt die bereits geladene Matchhistorie (neueste zuerst, siehe
// loadPublicMatchHistory in player-profile.ts) und leitet Statistik
// daraus ab — keine eigenen Datenbankzugriffe, deshalb ohne Mock einfach
// testbar.

export type FormMatch = {
	won: boolean;
	myTeam: 1 | 2;
	sets: { team1Games: number; team2Games: number }[];
};

export type FormCurve = {
	window: number;
	matchesCounted: number;
	winRate: number;
	gameDiff: number;
};

/** entries: neueste zuerst. window schneidet von vorn ab, kein Sortieren nötig. */
export function computeFormCurve(entries: FormMatch[], window: number): FormCurve {
	const slice = entries.slice(0, window);
	if (slice.length === 0) {
		return { window, matchesCounted: 0, winRate: 0, gameDiff: 0 };
	}

	const wins = slice.filter((e) => e.won).length;
	const gameDiff = slice.reduce((sum, e) => {
		const matchDiff = e.sets.reduce((s, set) => {
			const mine = e.myTeam === 1 ? set.team1Games : set.team2Games;
			const theirs = e.myTeam === 1 ? set.team2Games : set.team1Games;
			return s + (mine - theirs);
		}, 0);
		return sum + matchDiff;
	}, 0);

	return {
		window,
		matchesCounted: slice.length,
		winRate: Number((wins / slice.length).toFixed(3)),
		gameDiff
	};
}

export type PreferredPartner = {
	id: string;
	handle: string;
	name: string;
	claimed: boolean;
	count: number;
};

export function computePreferredPartners(
	entries: { partner: { id: string; handle: string; name: string; claimed: boolean } | null }[],
	top = 3
): PreferredPartner[] {
	const byId = new Map<string, PreferredPartner>();

	for (const e of entries) {
		if (!e.partner) continue;
		const existing = byId.get(e.partner.id);
		if (existing) existing.count++;
		else byId.set(e.partner.id, { ...e.partner, count: 1 });
	}

	return [...byId.values()].sort((a, b) => b.count - a.count).slice(0, top);
}
