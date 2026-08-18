// ============================================================
// PadelIndex — Match melden
// ============================================================
//
// Nur eingeloggte Vereinsmitglieder. Der Kader für die Spieler-Auswahl
// kommt aus loadClubRoster() (Admin-Client, siehe matches.ts) — die
// eigentliche Mitgliedschaftsprüfung aller vier gewählten Spieler läuft
// aber nochmal in create_match_report() selbst (SQL, siehe 0006), nicht
// nur hier im UI-Kader.

import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { createMatchReport, loadClubRoster } from '$lib/server/matches';
import { MAX_SETS, MATCH_TYPES, type MatchType } from '$lib/match-report';

export const load: PageServerLoad = async ({ params, locals, url, platform }) => {
	if (!locals.player) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}

	const admin = supabaseAdmin(platform);
	const { data: club, error: clubErr } = await admin
		.from('clubs')
		.select('id, slug, name')
		.eq('slug', params.slug)
		.maybeSingle();

	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');

	const roster = await loadClubRoster(admin, club.id);

	return { club, roster, me: locals.player.id };
};

export const actions: Actions = {
	default: async ({ request, params, locals, platform }) => {
		if (!locals.player) {
			return { message: 'Nicht angemeldet.' };
		}

		const admin = supabaseAdmin(platform);
		const { data: club, error: clubErr } = await admin
			.from('clubs')
			.select('id')
			.eq('slug', params.slug)
			.maybeSingle();
		if (clubErr || !club) return { message: 'Verein nicht gefunden.' };

		const form = await request.formData();
		const partnerId = String(form.get('partnerId') ?? '');
		const opponent1Id = String(form.get('opponent1Id') ?? '');
		const opponent2Id = String(form.get('opponent2Id') ?? '');
		const playedAtRaw = String(form.get('playedAt') ?? '');
		const matchTypeRaw = String(form.get('matchType') ?? '');
		const matchType: MatchType = MATCH_TYPES.includes(matchTypeRaw as MatchType)
			? (matchTypeRaw as MatchType)
			: 'freizeit';

		const sets: { team1Games: number; team2Games: number }[] = [];
		for (let i = 1; i <= MAX_SETS; i++) {
			const t1 = form.get(`set${i}team1`);
			const t2 = form.get(`set${i}team2`);
			if (t1 === null || t2 === null || t1 === '' || t2 === '') continue;
			sets.push({ team1Games: Number(t1), team2Games: Number(t2) });
		}

		const playedAt = playedAtRaw ? `${playedAtRaw}T18:00:00` : new Date().toISOString();

		const result = await createMatchReport(admin, club.id, {
			reporterId: locals.player.id,
			partnerId,
			opponent1Id,
			opponent2Id,
			sets,
			matchType,
			playedAt
		});

		if (!result.ok) return { message: result.message };

		throw redirect(303, `/konto`);
	}
};
