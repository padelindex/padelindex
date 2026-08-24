// Ergebniseingabe für eine Box. Nur wer in dieser Box spielt, kommt hier
// rein — die Prüfung läuft bei JEDER Aktion neu, nicht nur beim Laden
// (gleiche Begründung wie isClubAdmin in club-admin.ts: die IDs in der
// URL sind Nutzereingabe).

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin, supabasePublic } from '$lib/server/supabase';
import { loadCurrentCycle, loadLadder, loadLeague, reportBoxResult } from '$lib/server/league';

/** Wirft, wenn der eingeloggte Spieler nicht zu dieser Box gehört. */
async function requireBoxMember(platform: App.Platform | undefined, boxId: string, playerId: string) {
	const { data, error: err } = await supabaseAdmin(platform)
		.from('league_box_members')
		.select('player_id')
		.eq('box_id', boxId)
		.eq('player_id', playerId)
		.maybeSingle();

	if (err) throw error(500, err.message);
	if (!data) throw error(403, 'Nur wer in dieser Box spielt, darf hier Ergebnisse melden.');
}

export const load: PageServerLoad = async ({ params, url, platform, locals }) => {
	const league = await loadLeague(supabasePublic(platform), params.slug);
	if (!league) throw error(404, 'Diese Liga gibt es nicht.');

	if (!locals.player) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	await requireBoxMember(platform, params.boxId, locals.player.id);

	const admin = supabaseAdmin(platform);
	const cycle = await loadCurrentCycle(admin, league.id);
	if (!cycle) throw error(404, 'Für diese Liga läuft gerade kein Zyklus.');

	const box = (await loadLadder(admin, cycle.id, league.config)).find((b) => b.id === params.boxId);
	if (!box) throw error(404, 'Diese Box gehört nicht zum laufenden Zyklus.');

	return { league, cycle, box, myPlayerId: locals.player.id };
};

export const actions: Actions = {
	report: async ({ request, params, platform, locals }) => {
		if (!locals.player) throw error(401, 'Nicht angemeldet.');
		await requireBoxMember(platform, params.boxId, locals.player.id);

		const form = await request.formData();
		const boxMatchId = String(form.get('boxMatchId') ?? '');
		if (!boxMatchId) return fail(400, { message: 'Keine Runde angegeben.' });

		// Bis zu drei Sätze; leere Zeilen am Ende sind erlaubt und werden
		// verworfen, eine halb ausgefüllte Zeile dagegen nicht.
		const sets: { team1_games: number; team2_games: number }[] = [];
		for (let i = 1; i <= 3; i++) {
			const raw1 = String(form.get(`set${i}team1`) ?? '').trim();
			const raw2 = String(form.get(`set${i}team2`) ?? '').trim();
			if (raw1 === '' && raw2 === '') continue;
			if (raw1 === '' || raw2 === '') {
				return fail(400, { message: `Satz ${i}: bitte beide Spielstände eintragen.` });
			}
			const a = Number(raw1);
			const b = Number(raw2);
			if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99) {
				return fail(400, { message: `Satz ${i}: nur ganze Zahlen zwischen 0 und 99.` });
			}
			if (a === b) {
				return fail(400, { message: `Satz ${i}: ein Satz kann nicht unentschieden enden.` });
			}
			sets.push({ team1_games: a, team2_games: b });
		}

		if (sets.length === 0) {
			return fail(400, { message: 'Bitte mindestens einen Satz eintragen.' });
		}

		try {
			await reportBoxResult(supabaseAdmin(platform), {
				boxMatchId,
				reporterId: locals.player.id,
				sets
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Ergebnis konnte nicht gespeichert werden.';
			// Die RPC wirft mit deutschen Klartextmeldungen — die kann der
			// Nutzer direkt lesen, statt "500".
			return fail(400, { message });
		}

		return { success: true };
	}
};
