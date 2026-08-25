// Liga-Verwaltung: Auf-/Abstiegsvorschlag prüfen und bestätigen, plus die
// Status-Übersicht (offene Spiele, fehlende Termine, angeforderte
// Ersatzspieler) fürs Dashboard.
// Zugriff hat, wer Admin des Vereins ist, zu dem die Liga gehört —
// geprüft bei jedem Laden UND bei jeder Aktion (requireLeagueAdmin).

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { readEmailEnv } from '$lib/server/email';
import {
	applyPromotionProposal,
	cyclePhase,
	findPlannedCycle,
	loadCurrentCycle,
	loadLadder,
	loadPromotionProposal
} from '$lib/server/league';
import { requireLeagueAdmin } from '$lib/server/league-admin';
import { notifyCycleClosed } from '$lib/server/league-notifications';
import { activeSeason, createNextCycle } from '$lib/server/league-seasons';

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);

	const admin = supabaseAdmin(platform);
	const cycle = await loadCurrentCycle(admin, league.id);
	if (!cycle) {
		return {
			league,
			cycle: null,
			ladder: [],
			proposal: [],
			phase: null,
			tags: null,
			nextCycle: null
		};
	}

	const [ladder, proposal, season] = await Promise.all([
		loadLadder(admin, cycle.id, league.config),
		loadPromotionProposal(admin, cycle.id, league.config),
		activeSeason(admin, league.id)
	]);

	const phase = cyclePhase(cycle.startDate, league.config.selfServiceWeeks);

	// Status-Tags fürs Dashboard: rein aus bereits geladenen Daten
	// abgeleitet, keine zusätzliche Query.
	const openMatches = ladder.reduce(
		(n, b) => n + b.rounds.filter((r) => r.status === 'scheduled').length,
		0
	);
	const missingSchedule = ladder.reduce(
		(n, b) => n + b.rounds.filter((r) => r.status === 'scheduled' && !r.scheduledAt).length,
		0
	);
	const openSeats = ladder.reduce((n, b) => n + (league.config.boxSize - b.lineup.length), 0);

	// "Nächsten Zyklus anlegen" braucht: aktive Saison, Auf-/Abstieg schon
	// festgeschrieben, alle Runden gewertet, und noch keinen
	// unveröffentlichten Zyklus, der auf Korrektur wartet (sonst gäbe es
	// zwei parallele Vorschläge).
	const alreadyApplied = proposal.some((p) => p.saved === 'applied');
	const allRoundsScored = ladder.length > 0 && openMatches === 0;
	const pendingCycle = season ? await findPlannedCycle(admin, season.id) : null;
	const canStartNextCycle = Boolean(season) && alreadyApplied && allRoundsScored && !pendingCycle;

	return {
		league,
		cycle,
		ladder,
		proposal,
		phase,
		tags: { openMatches, missingSchedule, openSeats },
		nextCycle: { canStart: canStartNextCycle, pendingCycleId: pendingCycle?.id ?? null }
	};
};

export const actions: Actions = {
	applyPromotions: async ({ request, params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);

		const cycle = await loadCurrentCycle(admin, league.id);
		if (!cycle) return fail(400, { message: 'Kein Zyklus vorhanden.' });

		// Overrides kommen als override_<playerId>=up|down|stay — nur für
		// Zeilen, die der Admin bewusst per Auswahl übersteuert hat.
		const form = await request.formData();
		const overrides = new Map<string, 'up' | 'down' | 'stay'>();
		for (const [key, value] of form.entries()) {
			if (!key.startsWith('override_')) continue;
			const direction = String(value);
			if (direction === 'up' || direction === 'down' || direction === 'stay') {
				overrides.set(key.slice('override_'.length), direction);
			}
		}

		// Bewusst hart: bleibt nach den Overrides irgendeine Warnung übrig,
		// wird gar nichts festgeschrieben. Ein halb angewandter Auf-/Abstieg
		// wäre schlimmer als gar keiner.
		const result = await applyPromotionProposal(
			admin,
			cycle.id,
			locals.player!.id,
			league.config,
			overrides
		);
		if (!result.ok) {
			return fail(409, {
				message: `${result.blocked.length} Einträge brauchen erst eine Entscheidung — nichts festgeschrieben.`
			});
		}

		// Best-effort: alle aktuell in einer Box sitzenden Spieler über das
		// Zyklusende informieren. Ein Zustellungsfehler darf das bereits
		// festgeschriebene Ergebnis nicht mehr rückgängig machen.
		const ladder = await loadLadder(admin, cycle.id, league.config);
		const playerIds = [...new Set(ladder.flatMap((b) => b.lineup.map((p) => p.playerId)))];
		if (playerIds.length > 0) {
			await notifyCycleClosed(
				admin,
				{
					baseUrl: url.origin,
					leagueSlug: league.slug,
					leagueName: league.name,
					emailEnv: readEmailEnv(platform)
				},
				{ playerIds }
			);
		}

		return { success: true, count: result.count };
	},

	/**
	 * "Neuer Zyklus starten": baut den Folgezyklus (status='planned') aus
	 * dem bereits festgeschriebenen Auf-/Abstieg. Die Korrektur läuft auf
	 * der normalen Boxen-Seite (Drag & Drop), veröffentlicht wird er dort
	 * über den separaten "Zyklus veröffentlichen"-Knopf.
	 */
	startNextCycle: async ({ params, url, platform, locals }) => {
		const league = await requireLeagueAdmin(platform, params.slug, locals.player?.id, url.pathname);
		const admin = supabaseAdmin(platform);

		const cycle = await loadCurrentCycle(admin, league.id);
		if (!cycle) return fail(400, { message: 'Kein Zyklus vorhanden.' });

		const season = await activeSeason(admin, league.id);
		if (!season) return fail(400, { message: 'Keine aktive Saison.' });

		const pending = await findPlannedCycle(admin, season.id);
		if (pending) {
			throw redirect(303, `/liga/${league.slug}/verwaltung/zyklen/${pending.id}`);
		}

		const result = await createNextCycle(admin, {
			seasonId: season.id,
			currentCycleId: cycle.id,
			ordinal: cycle.ordinal + 1,
			config: league.config
		});
		if (!result.ok) return fail(400, { message: result.message });

		throw redirect(303, `/liga/${league.slug}/verwaltung/zyklen/${result.cycleId}`);
	}
};
