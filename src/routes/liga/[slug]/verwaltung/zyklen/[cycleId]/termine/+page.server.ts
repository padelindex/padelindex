// ============================================================
// PadelIndex — Liga-Verwaltung: Termine & Plätze (6-Wochen-Regel)
// ============================================================
// Woche 1 bis league.config.selfServiceWeeks: Spieler vereinbaren ihre
// Termine selbst (Eintrag über die öffentliche Box-Seite,
// playerScheduleRound) — hier gibt es dazu nur Status + Erinnerung.
// Danach vergibt der Admin die restlichen offenen Runden (assignRoundSlot).
// Verdrängt ein eigenständiger Spieler-Termin einen bereits vergebenen
// Admin-Slot, taucht er hier als "wird frei" auf (resolveFreedSlot).

import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import {
	assignRoundSlot,
	cyclePhase,
	loadCurrentCycle,
	loadLadder,
	resolveFreedSlot
} from '$lib/server/league';
import { requireLeagueAdmin } from '$lib/server/league-admin';
import { notifyScheduleReminder, notifySlotAssigned } from '$lib/server/league-notifications';

async function loadCycleOr404(
	admin: ReturnType<typeof supabaseAdmin>,
	leagueId: string,
	cycleId: string
) {
	const cycle = await loadCurrentCycle(admin, leagueId, cycleId);
	if (!cycle) throw error(404, 'Diesen Zyklus gibt es in dieser Liga nicht.');
	return cycle;
}

/** Die vier Spieler-IDs einer Runde, aus Sitz + Aufstellung aufgelöst. */
function roundPlayerIds(
	box: { lineup: { seat: number; playerId: string }[] },
	round: { team1: [number, number]; team2: [number, number] }
): string[] {
	const bySeat = new Map(box.lineup.map((p) => [p.seat, p.playerId] as const));
	return [...round.team1, ...round.team2]
		.map((s) => bySeat.get(s))
		.filter((id): id is string => !!id);
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);
	const cycle = await loadCycleOr404(admin, league.id, params.cycleId);
	const boxes = await loadLadder(admin, cycle.id, league.config);
	const phase = cyclePhase(cycle.startDate, league.config.selfServiceWeeks);
	return { league, cycle, boxes, phase };
};

export const actions: Actions = {
	assign: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		const cycle = await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxMatchId = String(form.get('boxMatchId') ?? '');
		const boxId = String(form.get('boxId') ?? '');
		const dateRaw = String(form.get('scheduledDate') ?? '');
		const timeRaw = String(form.get('scheduledTime') ?? '').trim() || '18:00';
		const court = String(form.get('court') ?? '').trim() || null;

		if (!boxMatchId || !boxId || !dateRaw) {
			return fail(400, { message: 'Bitte mindestens ein Datum angeben.' });
		}

		const result = await assignRoundSlot(
			admin,
			boxMatchId,
			{
				scheduledAt: `${dateRaw}T${timeRaw}:00`,
				court,
				adminPlayerId: locals.player!.id
			},
			league.id
		);
		if (!result.ok) return fail(400, { message: result.message });

		const boxes = await loadLadder(admin, cycle.id, league.config);
		const box = boxes.find((b) => b.id === boxId);
		const round = box?.rounds.find((r) => r.id === boxMatchId);
		if (box && round) {
			await notifySlotAssigned(
				admin,
				{
					baseUrl: url.origin,
					leagueSlug: league.slug,
					leagueName: league.name,
					emailEnv: readEmailEnv(platform)
				},
				{
					playerIds: roundPlayerIds(box, round),
					boxId: box.id,
					boxLabel: box.label ?? `Box ${box.ladderPosition}`,
					when: new Date(`${dateRaw}T${timeRaw}:00`).toLocaleString('de-DE', {
						weekday: 'short',
						day: '2-digit',
						month: '2-digit',
						hour: '2-digit',
						minute: '2-digit'
					}),
					court
				}
			);
		}

		return { success: true, action: 'assign' };
	},

	remind: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		const cycle = await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxId = String(form.get('boxId') ?? '');
		if (!boxId) return fail(400, { message: 'Keine Box angegeben.' });

		const boxes = await loadLadder(admin, cycle.id, league.config);
		const box = boxes.find((b) => b.id === boxId);
		if (!box) return fail(404, { message: 'Box nicht gefunden.' });

		const openRounds = box.rounds.filter((r) => r.status === 'scheduled' && !r.scheduledAt);
		const playerIds = [...new Set(openRounds.flatMap((r) => roundPlayerIds(box, r)))];
		if (playerIds.length > 0) {
			await notifyScheduleReminder(
				admin,
				{
					baseUrl: url.origin,
					leagueSlug: league.slug,
					leagueName: league.name,
					emailEnv: readEmailEnv(platform)
				},
				{ playerIds, boxId: box.id, boxLabel: box.label ?? `Box ${box.ladderPosition}` }
			);
		}

		return { success: true, action: 'remind', count: playerIds.length };
	},

	/** Bulk-Erinnerung über alle Boxen des Zyklus hinweg (Woche 1-3). */
	remindAll: async ({ params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		const cycle = await loadCycleOr404(admin, league.id, params.cycleId);

		const boxes = await loadLadder(admin, cycle.id, league.config);
		const ctx = {
			baseUrl: url.origin,
			leagueSlug: league.slug,
			leagueName: league.name,
			emailEnv: readEmailEnv(platform)
		};

		let notified = 0;
		for (const box of boxes) {
			const openRounds = box.rounds.filter((r) => r.status === 'scheduled' && !r.scheduledAt);
			const playerIds = [...new Set(openRounds.flatMap((r) => roundPlayerIds(box, r)))];
			if (playerIds.length === 0) continue;
			await notifyScheduleReminder(admin, ctx, {
				playerIds,
				boxId: box.id,
				boxLabel: box.label ?? `Box ${box.ladderPosition}`
			});
			notified += playerIds.length;
		}

		return { success: true, action: 'remindAll', count: notified };
	},

	resolveFreed: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxMatchId = String(form.get('boxMatchId') ?? '');
		const decision = form.get('decision') === 'reject' ? 'reject' : 'confirm';
		if (!boxMatchId) return fail(400, { message: 'Keine Runde angegeben.' });

		const result = await resolveFreedSlot(admin, boxMatchId, decision, league.id);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, action: 'resolveFreed' };
	}
};
