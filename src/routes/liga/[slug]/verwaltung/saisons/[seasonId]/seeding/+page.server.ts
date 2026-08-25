// Saison-Assistent, Schritt 3+4: automatischer Box-Vorschlag nach Rating
// (reine Vorschau, schreibt nichts) und "Boxen erstellen", das Zyklus 1
// als status='planned' inklusive Boxen/Mitgliedern anlegt. Die manuelle
// Drag & Drop-Korrektur läuft danach auf der bestehenden Boxen-Seite
// (zyklen/[cycleId]) — hier gibt es dafür keine zweite Oberfläche.

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { requireLeagueAdmin } from '$lib/server/league-admin';
import {
	listParticipants,
	loadSeason,
	previewInitialSeeding,
	seedInitialCycle
} from '$lib/server/league-seasons';

async function loadDraftSeasonOr404(
	admin: ReturnType<typeof supabaseAdmin>,
	leagueId: string,
	seasonId: string
) {
	const season = await loadSeason(admin, seasonId);
	if (!season || season.leagueId !== leagueId)
		throw error(404, 'Diese Saison gibt es in dieser Liga nicht.');
	if (season.status !== 'draft' || season.cycleCount > 0) {
		throw error(
			400,
			'Diese Saison hat schon einen Zyklus — die Einteilung ist nur für Zyklus 1 gedacht.'
		);
	}
	return season;
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
	const admin = supabaseAdmin(platform);
	const season = await loadDraftSeasonOr404(admin, league.id, params.seasonId);

	const [groups, participants] = await Promise.all([
		previewInitialSeeding(admin, league.id, league.config),
		listParticipants(admin, league.id)
	]);
	const nameOf = new Map(participants.map((p) => [p.playerId, p.name] as const));
	const namedGroups = groups.map((g) => ({
		ladderPosition: g.ladderPosition,
		members: g.members.map((m) => ({ ...m, name: nameOf.get(m.playerId) ?? 'Unbekannt' }))
	}));
	const participantCount = groups.reduce((n, g) => n + g.members.length, 0);

	return { league, season, groups: namedGroups, participantCount, boxSize: league.config.boxSize };
};

export const actions: Actions = {
	default: async ({ params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);
		await loadDraftSeasonOr404(admin, league.id, params.seasonId);

		const result = await seedInitialCycle(admin, {
			seasonId: params.seasonId,
			leagueId: league.id,
			config: league.config
		});
		if (!result.ok) return fail(400, { message: result.message });

		throw redirect(303, `/liga/${league.slug}/verwaltung/zyklen/${result.cycleId}`);
	}
};
