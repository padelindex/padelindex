import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { listAssignedPlayerIds, loadCurrentCycle, loadLadder } from '$lib/server/league';
import { loadClubRoster } from '$lib/server/matches';
import {
	addBoxMember,
	createBox,
	deleteBox,
	moveBoxMember,
	nextLadderPosition,
	removeBoxMember,
	requireLeagueAdmin,
	swapBoxMembers
} from '$lib/server/league-admin';
import { loadSeason, publishCycle } from '$lib/server/league-seasons';

async function loadCycleOr404(
	admin: ReturnType<typeof supabaseAdmin>,
	leagueId: string,
	cycleId: string
) {
	const cycle = await loadCurrentCycle(admin, leagueId, cycleId);
	if (!cycle) throw error(404, 'Diesen Zyklus gibt es in dieser Liga nicht.');
	return cycle;
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);

	const cycle = await loadCycleOr404(admin, league.id, params.cycleId);

	const [boxes, roster, assignedIds, suggestedPosition, season] = await Promise.all([
		loadLadder(admin, cycle.id, league.config),
		league.clubId ? loadClubRoster(admin, league.clubId) : Promise.resolve([]),
		listAssignedPlayerIds(admin, cycle.id),
		nextLadderPosition(admin, cycle.id),
		loadSeason(admin, cycle.seasonId)
	]);

	const availableRoster = roster.filter((p) => !assignedIds.has(p.id));

	return {
		league,
		cycle,
		season,
		boxes,
		availableRoster,
		suggestedPosition,
		boxSize: league.config.boxSize
	};
};

export const actions: Actions = {
	createBox: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const ladderPosition = Number(form.get('ladderPosition') ?? '');
		if (!Number.isInteger(ladderPosition) || ladderPosition < 1) {
			return fail(400, { message: 'Leiterposition muss eine ganze Zahl ≥ 1 sein.' });
		}
		const label = String(form.get('label') ?? '').trim() || null;
		const court = String(form.get('court') ?? '').trim() || null;
		const scheduledDate = String(form.get('scheduledDate') ?? '').trim();
		const scheduledTime = String(form.get('scheduledTime') ?? '').trim() || '18:00';
		const scheduledAt = scheduledDate ? `${scheduledDate}T${scheduledTime}:00` : null;

		const result = await createBox(
			admin,
			params.cycleId,
			{ ladderPosition, label, scheduledAt, court },
			league.config.rounds
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	deleteBox: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxId = String(form.get('boxId') ?? '');
		if (!boxId) return fail(400, { message: 'Keine Box angegeben.' });

		const result = await deleteBox(admin, boxId);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	addMember: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxId = String(form.get('boxId') ?? '');
		const playerId = String(form.get('playerId') ?? '');
		const seat = Number(form.get('seat') ?? '');
		const role = form.get('role') === 'substitute' ? 'substitute' : 'regular';

		if (!boxId || !playerId) return fail(400, { message: 'Bitte Box und Spieler auswählen.' });
		if (!Number.isInteger(seat) || seat < 1 || seat > league.config.boxSize) {
			return fail(400, { message: `Sitz muss zwischen 1 und ${league.config.boxSize} liegen.` });
		}

		const result = await addBoxMember(admin, boxId, {
			playerId,
			seat,
			role,
			replacesPlayerId: null
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	/**
	 * Ziel der Drag&Drop-Oberfläche: ein Spieler wird zwischen Boxen oder
	 * innerhalb einer Box verschoben. fromBoxId="" heißt "kam aus dem Pool
	 * der verfügbaren Vereinsmitglieder" (noch keiner Box zugeteilt) —
	 * dann ist es ein reines Hinzufügen, kein Verschieben.
	 */
	moveMember: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const playerId = String(form.get('playerId') ?? '');
		const fromBoxId = String(form.get('fromBoxId') ?? '');
		const fromSeat = Number(form.get('fromSeat') ?? '');
		const fromRole = form.get('fromRole') === 'substitute' ? 'substitute' : 'regular';
		const toBoxId = String(form.get('toBoxId') ?? '');
		const toSeat = Number(form.get('toSeat') ?? '');
		const role = form.get('role') === 'substitute' ? 'substitute' : 'regular';

		if (!playerId || !toBoxId) return fail(400, { message: 'Unvollständige Angabe.' });
		if (!Number.isInteger(toSeat) || toSeat < 1 || toSeat > league.config.boxSize) {
			return fail(400, { message: `Sitz muss zwischen 1 und ${league.config.boxSize} liegen.` });
		}

		const result = fromBoxId
			? await moveBoxMember(admin, {
					playerId,
					fromBoxId,
					fromSeat,
					fromRole,
					toBoxId,
					toSeat,
					role
				})
			: await addBoxMember(admin, toBoxId, {
					playerId,
					seat: toSeat,
					role,
					replacesPlayerId: null
				});

		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	/** Sitztausch innerhalb einer Box (Drag & Drop auf einen besetzten Sitz). */
	swapMembers: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxId = String(form.get('boxId') ?? '');
		const playerAId = String(form.get('playerAId') ?? '');
		const playerBId = String(form.get('playerBId') ?? '');
		if (!boxId || !playerAId || !playerBId) return fail(400, { message: 'Unvollständige Angabe.' });

		const result = await swapBoxMembers(admin, boxId, playerAId, playerBId);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	removeMember: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const form = await request.formData();
		const boxId = String(form.get('boxId') ?? '');
		const playerId = String(form.get('playerId') ?? '');
		if (!boxId || !playerId) return fail(400, { message: 'Unvollständige Angabe.' });

		const result = await removeBoxMember(admin, boxId, playerId);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true };
	},

	/**
	 * Schaltet einen per Assistent vorbereiteten Zyklus (status='planned')
	 * frei — "erste Spielrunde freischalten". Ab hier zeigt die
	 * öffentliche Ligaseite den Zyklus, und für die Erst-Saison wechselt
	 * die Saison von 'draft' auf 'active' (siehe publishCycle).
	 */
	publish: async ({ params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadCycleOr404(admin, league.id, params.cycleId);

		const result = await publishCycle(admin, params.cycleId);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, published: true };
	}
};
