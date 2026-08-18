import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidEmail } from '$lib/email';
import { loadRatingHistory } from '$lib/server/rating-history';
import { confirmMatchAsPlayer, loadPendingMatches, loadPlayerClub } from '$lib/server/matches';
import { loadTokenAccount } from '$lib/server/tokens';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const player = locals.player;
	if (!player || !locals.supabase) {
		return {
			email: locals.user?.email ?? null,
			player: null,
			history: [],
			club: null,
			pendingMatches: [],
			tokens: { balance: 0, recent: [] }
		};
	}

	const admin = supabaseAdmin(platform);
	const [history, club, pendingMatches, tokens] = await Promise.all([
		loadRatingHistory(locals.supabase, player.id),
		loadPlayerClub(locals.supabase, player.id),
		loadPendingMatches(locals.supabase, admin, player.id),
		loadTokenAccount(locals.supabase, player.id)
	]);

	return {
		email: locals.user?.email ?? null,
		player,
		history,
		club,
		pendingMatches,
		tokens
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) {
			await locals.supabase.auth.signOut();
		}
		throw redirect(303, '/');
	},

	// updateUser() läuft über den cookie-gebundenen Session-Client (locals.supabase),
	// der bereits als der eingeloggte Nutzer authentifiziert ist — kein extra
	// Identitätsnachweis nötig. Je nach Supabase-Einstellung ("Secure email
	// change") schickt das eine Bestätigung an die neue Adresse, evtl. auch
	// eine Benachrichtigung an die alte. Erst nach Bestätigung ändert sich
	// locals.user.email — der Link landet wie beim Login auf /konto und wird
	// von derselben Fragment-Logik dort abgefangen (siehe supabase-browser.ts).
	changeEmail: async ({ request, locals, url }) => {
		if (!locals.supabase || !locals.user) {
			return { emailError: 'Nicht angemeldet.' };
		}

		const form = await request.formData();
		const newEmail = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!isValidEmail(newEmail)) {
			return { emailError: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
		}
		if (newEmail === locals.user.email) {
			return { emailError: 'Das ist bereits deine aktuelle E-Mail-Adresse.' };
		}

		const { error } = await locals.supabase.auth.updateUser(
			{ email: newEmail },
			{ emailRedirectTo: `${url.origin}/konto` }
		);

		if (error) {
			return { emailError: error.message };
		}

		return { emailSent: true };
	},

	confirmMatch: async ({ request, locals, platform }) => {
		if (!locals.player) {
			return { matchError: 'Nicht angemeldet.' };
		}

		const form = await request.formData();
		const matchId = String(form.get('matchId') ?? '');
		if (!matchId) return { matchError: 'Ungültige Anfrage.' };

		const result = await confirmMatchAsPlayer(supabaseAdmin(platform), matchId, locals.player.id);
		if (!result.ok) return { matchError: result.message };

		return { matchConfirmed: true };
	}
};
