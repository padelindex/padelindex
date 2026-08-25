// ============================================================
// PadelIndex — Liga-Modul: Benachrichtigungen
// ============================================================
// Bündelt notify() (In-App, siehe notification-store.ts) und sendEmail()
// (Resend) für Liga-Ereignisse — gleiches Best-effort-Prinzip wie
// play-requests.ts/challenges.ts: ein Zustellungsfehler darf die
// auslösende Admin-Aktion nie scheitern lassen, deshalb wirft keine
// dieser Funktionen.

import type { SupabaseClient } from '@supabase/supabase-js';
import { notify, resolvePlayerEmailAddress } from '$lib/server/notification-store';
import { sendEmail, type EmailEnv } from '$lib/server/email';
import {
	leagueCycleClosedEmail,
	leagueScheduleReminderEmail,
	leagueSlotAssignedEmail,
	leagueSubstituteAssignedEmail,
	leagueSubstituteJoinedEmail
} from '$lib/notifications';

async function notifyBoth(
	admin: SupabaseClient,
	env: EmailEnv | null,
	playerId: string,
	kind: Parameters<typeof notify>[1]['kind'],
	title: string,
	link: string,
	email: { subject: string; html: string }
): Promise<void> {
	await notify(admin, { playerId, kind, title, link });
	try {
		const address = await resolvePlayerEmailAddress(admin, playerId);
		if (!address) return;
		await sendEmail(env, { to: address, subject: email.subject, html: email.html });
	} catch (e) {
		console.error('Liga-E-Mail fehlgeschlagen', e);
	}
}

export type LeagueNotifyContext = {
	baseUrl: string;
	leagueSlug: string;
	leagueName: string;
	emailEnv: EmailEnv | null;
};

/** Der nachrückende Ersatzspieler — Auswechselung (automatisch oder manuell). */
export async function notifySubstituteAssigned(
	admin: SupabaseClient,
	ctx: LeagueNotifyContext,
	params: { substitutePlayerId: string; boxId: string; boxLabel: string }
): Promise<void> {
	const url = `${ctx.baseUrl}/liga/${ctx.leagueSlug}/box/${params.boxId}`;
	await notifyBoth(
		admin,
		ctx.emailEnv,
		params.substitutePlayerId,
		'league_substitute_assigned',
		`Du rückst in ${params.boxLabel} nach`,
		url,
		leagueSubstituteAssignedEmail({ leagueName: ctx.leagueName, boxLabel: params.boxLabel, url })
	);
}

/** Die verbleibenden Box-Mitglieder — informiert über den neuen Mitspieler. */
export async function notifySubstituteJoined(
	admin: SupabaseClient,
	ctx: LeagueNotifyContext,
	params: { playerIds: string[]; boxId: string; boxLabel: string; substituteName: string }
): Promise<void> {
	const url = `${ctx.baseUrl}/liga/${ctx.leagueSlug}/box/${params.boxId}`;
	const email = leagueSubstituteJoinedEmail({
		leagueName: ctx.leagueName,
		boxLabel: params.boxLabel,
		substituteName: params.substituteName,
		url
	});
	await Promise.all(
		params.playerIds.map((playerId) =>
			notifyBoth(
				admin,
				ctx.emailEnv,
				playerId,
				'league_substitute_joined',
				`${params.substituteName} ist neu in ${params.boxLabel}`,
				url,
				email
			)
		)
	);
}

/** Erinnerung an alle Mitglieder einer Box: Termin für die offene Runde fehlt noch (Woche 1-3). */
export async function notifyScheduleReminder(
	admin: SupabaseClient,
	ctx: LeagueNotifyContext,
	params: { playerIds: string[]; boxId: string; boxLabel: string }
): Promise<void> {
	const url = `${ctx.baseUrl}/liga/${ctx.leagueSlug}/box/${params.boxId}`;
	const email = leagueScheduleReminderEmail({
		leagueName: ctx.leagueName,
		boxLabel: params.boxLabel,
		url
	});
	await Promise.all(
		params.playerIds.map((playerId) =>
			notifyBoth(
				admin,
				ctx.emailEnv,
				playerId,
				'league_schedule_reminder',
				`Termin für ${params.boxLabel} eintragen`,
				url,
				email
			)
		)
	);
}

/** Admin hat einen Slot vergeben (Woche 4-6) — informiert alle Box-Mitglieder. */
export async function notifySlotAssigned(
	admin: SupabaseClient,
	ctx: LeagueNotifyContext,
	params: {
		playerIds: string[];
		boxId: string;
		boxLabel: string;
		when: string;
		court: string | null;
	}
): Promise<void> {
	const url = `${ctx.baseUrl}/liga/${ctx.leagueSlug}/box/${params.boxId}`;
	const email = leagueSlotAssignedEmail({
		leagueName: ctx.leagueName,
		boxLabel: params.boxLabel,
		when: params.when,
		court: params.court,
		url
	});
	await Promise.all(
		params.playerIds.map((playerId) =>
			notifyBoth(
				admin,
				ctx.emailEnv,
				playerId,
				'league_slot_assigned',
				`Termin vergeben für ${params.boxLabel}`,
				url,
				email
			)
		)
	);
}

/** Zyklus beendet, Auf-/Abstieg festgeschrieben — an alle aktuell aktiven Ligamitglieder. */
export async function notifyCycleClosed(
	admin: SupabaseClient,
	ctx: LeagueNotifyContext,
	params: { playerIds: string[] }
): Promise<void> {
	const url = `${ctx.baseUrl}/liga/${ctx.leagueSlug}`;
	const email = leagueCycleClosedEmail({ leagueName: ctx.leagueName, url });
	await Promise.all(
		params.playerIds.map((playerId) =>
			notifyBoth(admin, ctx.emailEnv, playerId, 'league_cycle_closed', 'Zyklus beendet', url, email)
		)
	);
}
