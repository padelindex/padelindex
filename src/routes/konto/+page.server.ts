import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidEmail } from '$lib/email';
import { loadRatingHistory } from '$lib/server/rating-history';
import { confirmMatchAsPlayer, loadPendingMatches, loadPlayerClub } from '$lib/server/matches';
import { loadTokenAccount } from '$lib/server/tokens';
import { loadRewardCatalog, redeemReward } from '$lib/server/rewards';
import { loadAdminClubs } from '$lib/server/club-admin';
import { supabaseAdmin } from '$lib/server/supabase';
import { getNotifications, markAllRead } from '$lib/server/notification-store';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	// Hinweis aus dem Match-Melden-Flow, falls die Challenge-Verknüpfung nicht
	// geklappt hat (das Match selbst wurde trotzdem gemeldet).
	const challengeHinweis = url.searchParams.get('challengeHinweis');
	const player = locals.player;
	if (!player || !locals.supabase) {
		return {
			email: locals.user?.email ?? null,
			player: null,
			history: [],
			club: null,
			pendingMatches: [],
			tokens: { balance: 0, recent: [] },
			rewards: [],
			adminClubs: [],
			notifications: [],
			challengeHinweis
		};
	}

	const admin = supabaseAdmin(platform);
	const [history, club, pendingMatches, tokens, adminClubs, notifications] = await Promise.all([
		loadRatingHistory(locals.supabase, player.id),
		loadPlayerClub(locals.supabase, player.id),
		loadPendingMatches(locals.supabase, admin, player.id),
		loadTokenAccount(locals.supabase, player.id),
		loadAdminClubs(locals.supabase, player.id),
		getNotifications(locals.supabase, player.id, 10)
	]);

	// Prämien gehören zum Verein — ohne Vereinsmitgliedschaft gibt es
	// nichts zum Einlösen.
	const rewards = club ? await loadRewardCatalog(locals.supabase, club.id) : [];

	return {
		email: locals.user?.email ?? null,
		player,
		history,
		club,
		pendingMatches,
		tokens,
		rewards,
		adminClubs,
		notifications,
		challengeHinweis
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
	},

	redeem: async ({ request, locals, platform }) => {
		if (!locals.player) {
			return { redeemError: 'Nicht angemeldet.' };
		}

		const form = await request.formData();
		const rewardId = String(form.get('rewardId') ?? '');
		if (!rewardId) return { redeemError: 'Ungültige Anfrage.' };

		const result = await redeemReward(supabaseAdmin(platform), locals.player.id, rewardId);
		if (!result.ok) return { redeemError: result.message };

		return { redeemed: true };
	},

	// Läuft bewusst über den Session-Client, nicht service_role: die
	// Spalten sind per column-level GRANT (0010_player_profile.sql) und
	// players_self_update-RLS (0005) exakt auf diese fünf Selbstauskunft-
	// Felder der eigenen Zeile begrenzt — kein zusätzlicher Autorisierungs-
	// Code hier nötig, die Datenbank erzwingt es bereits.
	updateProfile: async ({ request, locals }) => {
		if (!locals.supabase || !locals.player) {
			return { profileError: 'Nicht angemeldet.' };
		}

		const form = await request.formData();
		const city = String(form.get('city') ?? '').trim();
		const playingHand = String(form.get('playingHand') ?? '');
		const preferredSide = String(form.get('preferredSide') ?? '');
		const gender = String(form.get('gender') ?? '');
		const selfAssessedLevelRaw = String(form.get('selfAssessedLevel') ?? '');

		const toEnum = (v: string, allowed: string[]) => (allowed.includes(v) ? v : null);
		const selfAssessedLevel =
			selfAssessedLevelRaw === '' ? null : Math.max(0, Math.min(7, Number(selfAssessedLevelRaw)));

		const { error } = await locals.supabase
			.from('players')
			.update({
				city: city || null,
				playing_hand: toEnum(playingHand, ['rechts', 'links']),
				preferred_side: toEnum(preferredSide, ['rechts', 'links']),
				gender: toEnum(gender, ['maennlich', 'weiblich', 'divers']),
				self_assessed_level: selfAssessedLevel
			})
			.eq('id', locals.player.id);

		if (error) return { profileError: error.message };
		return { profileSaved: true };
	},

	markNotificationsRead: async ({ locals, platform }) => {
		if (!locals.player) return { notificationError: 'Nicht angemeldet.' };
		await markAllRead(supabaseAdmin(platform), locals.player.id);
		return { notificationsRead: true };
	}
};
