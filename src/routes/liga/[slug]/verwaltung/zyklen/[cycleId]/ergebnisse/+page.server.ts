// ============================================================
// PadelIndex — Liga-Verwaltung: Ergebnisse, Walkover, Abbruch
// ============================================================
// Ergänzt das Selbst-Melden der Spieler (box/[boxId]) um die Admin-Sicht:
// Ergebnis eintragen/korrigieren, Walkover werten, Abbruch mit Teilsätzen
// erfassen, eine noch nicht gewertete Eintragung zurücksetzen. Siehe
// league.ts (adminReportBoxResult/setBoxWalkover/resetBoxMatch) für die
// genaue Begründung, warum ein admin-erfasstes Ergebnis trotzdem erst
// nach der üblichen 48h-Frist ins Index-Rating einfließt.

import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import {
	adminReportBoxResult,
	loadCurrentCycle,
	loadLadder,
	resetBoxMatch,
	setBoxWalkover
} from '$lib/server/league';
import { requireLeagueAdmin } from '$lib/server/league-admin';

async function loadCycleOr404(
	admin: ReturnType<typeof supabaseAdmin>,
	leagueId: string,
	cycleId: string
) {
	const cycle = await loadCurrentCycle(admin, leagueId, cycleId);
	if (!cycle) throw error(404, 'Diesen Zyklus gibt es in dieser Liga nicht.');
	return cycle;
}

/** Bis zu fünf Sätze aus dem Formular lesen — leere Zeilen am Ende erlaubt, halb ausgefüllte nicht. */
function readSets(
	form: FormData
): { team1_games: number; team2_games: number }[] | { error: string } {
	const sets: { team1_games: number; team2_games: number }[] = [];
	for (let i = 1; i <= 5; i++) {
		const raw1 = String(form.get(`set${i}team1`) ?? '').trim();
		const raw2 = String(form.get(`set${i}team2`) ?? '').trim();
		if (raw1 === '' && raw2 === '') continue;
		if (raw1 === '' || raw2 === '')
			return { error: `Satz ${i}: bitte beide Spielstände eintragen.` };
		const a = Number(raw1);
		const b = Number(raw2);
		if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99) {
			return { error: `Satz ${i}: nur ganze Zahlen zwischen 0 und 99.` };
		}
		sets.push({ team1_games: a, team2_games: b });
	}
	return sets;
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);
	const cycle = await loadCycleOr404(admin, league.id, params.cycleId);
	const boxes = await loadLadder(admin, cycle.id, league.config);
	return { league, cycle, boxes };
};

export const actions: Actions = {
	report: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxMatchId = String(form.get('boxMatchId') ?? '');
		const seat1 = Number(form.get('team1seat1') ?? '');
		const seat2 = Number(form.get('team1seat2') ?? '');
		const seat3 = Number(form.get('team2seat1') ?? '');
		const seat4 = Number(form.get('team2seat2') ?? '');
		const status = form.get('status') === 'abandoned' ? 'abandoned' : 'played';
		const note = String(form.get('note') ?? '').trim() || null;
		const boxId = String(form.get('boxId') ?? '');

		if (!boxMatchId || !boxId) return fail(400, { message: 'Unvollständige Angabe.' });

		const sets = readSets(form);
		if ('error' in sets) return fail(400, { message: sets.error });
		if (sets.length === 0) return fail(400, { message: 'Bitte mindestens einen Satz eintragen.' });

		const box = (await loadLadder(admin, params.cycleId, league.config)).find(
			(b) => b.id === boxId
		);
		if (!box) return fail(404, { message: 'Box nicht gefunden.' });
		const playerBySeat = new Map(box.lineup.map((p) => [p.seat, p.playerId] as const));
		const team1 = [playerBySeat.get(seat1), playerBySeat.get(seat2)];
		const team2 = [playerBySeat.get(seat3), playerBySeat.get(seat4)];
		if (!team1[0] || !team1[1] || !team2[0] || !team2[1]) {
			return fail(400, { message: 'Die Box ist nicht vollständig besetzt.' });
		}

		try {
			await adminReportBoxResult(
				admin,
				{
					boxMatchId,
					adminPlayerId: locals.player!.id,
					team1: [team1[0], team1[1]],
					team2: [team2[0], team2[1]],
					sets,
					status,
					note
				},
				league.id
			);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Ergebnis konnte nicht gespeichert werden.';
			return fail(400, { message });
		}

		return { success: true, action: 'report' };
	},

	walkover: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxMatchId = String(form.get('boxMatchId') ?? '');
		const winnerTeam = Number(form.get('winnerTeam') ?? '');
		const note = String(form.get('note') ?? '').trim() || null;

		if (!boxMatchId) return fail(400, { message: 'Keine Runde angegeben.' });
		if (winnerTeam !== 1 && winnerTeam !== 2) {
			return fail(400, { message: 'Bitte das siegende Team wählen.' });
		}

		const result = await setBoxWalkover(
			admin,
			{
				boxMatchId,
				adminPlayerId: locals.player!.id,
				winnerTeam: winnerTeam as 1 | 2,
				note
			},
			league.id
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, action: 'walkover' };
	},

	reset: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxMatchId = String(form.get('boxMatchId') ?? '');
		if (!boxMatchId) return fail(400, { message: 'Keine Runde angegeben.' });

		const result = await resetBoxMatch(
			admin,
			{ boxMatchId, adminPlayerId: locals.player!.id },
			league.id
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, action: 'reset' };
	}
};
