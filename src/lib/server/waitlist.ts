// ============================================================
// PadelIndex — Warteliste mit Double-Opt-in
// ============================================================
// Bisher landete eine E-Mail sofort in der Warteliste, ohne dass jemand
// bestätigt hat, dass sie ihm gehört. token_hash + confirmed_at wie bei
// delisting.ts: roher Token nur im Link, in der DB nur der SHA-256-Hash.
//
// Erneutes Eintragen derselben (noch unbestätigten) Adresse aktualisiert
// die bestehende Zeile mit frischem Token statt gegen den Unique-Index
// auf lower(email) zu laufen — sonst bekäme jemand, der die erste Mail
// verloren hat, nie einen zweiten Versuch.

import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidEmail } from '$lib/email';
import { waitlistConfirmEmail } from '$lib/notifications';
import { sendEmail, type EmailEnv } from './email';

async function hashToken(raw: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export type WaitlistResult = { ok: true } | { ok: false; message: string };

export async function requestWaitlistSignup(
	admin: SupabaseClient,
	email: string,
	clubName: string,
	opts: { emailEnv: EmailEnv | null; baseUrl: string }
): Promise<WaitlistResult> {
	const normalizedEmail = email.trim().toLowerCase();
	if (!isValidEmail(normalizedEmail)) {
		return { ok: false, message: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
	}
	const trimmedClub = clubName.trim().slice(0, 120) || null;

	const { data: existing } = await admin
		.from('waitlist')
		.select('id, confirmed_at')
		.eq('email', normalizedEmail)
		.maybeSingle();

	if (existing?.confirmed_at) {
		// Schon bestätigt — kein Enumeration-Oracle, deshalb trotzdem { ok: true }.
		if (trimmedClub) {
			await admin.from('waitlist').update({ club_name: trimmedClub }).eq('id', existing.id);
		}
		return { ok: true };
	}

	const rawToken = crypto.randomUUID() + crypto.randomUUID();
	const tokenHash = await hashToken(rawToken);

	if (existing) {
		const { error } = await admin
			.from('waitlist')
			.update({ token_hash: tokenHash, club_name: trimmedClub })
			.eq('id', existing.id);
		if (error) return { ok: false, message: 'Konnte nicht eingetragen werden.' };
	} else {
		const { error } = await admin
			.from('waitlist')
			.insert({ email: normalizedEmail, club_name: trimmedClub, token_hash: tokenHash });
		if (error) return { ok: false, message: 'Konnte nicht eingetragen werden.' };
	}

	const confirmUrl = `${opts.baseUrl}/warteliste/bestaetigen?token=${rawToken}`;
	await sendEmail(opts.emailEnv, { to: normalizedEmail, ...waitlistConfirmEmail({ confirmUrl }) });

	return { ok: true };
}

export async function confirmWaitlistSignup(
	admin: SupabaseClient,
	rawToken: string
): Promise<WaitlistResult> {
	if (!rawToken) return { ok: false, message: 'Ungültiger Link.' };
	const tokenHash = await hashToken(rawToken);

	const { data, error } = await admin
		.from('waitlist')
		.update({ confirmed_at: new Date().toISOString() })
		.eq('token_hash', tokenHash)
		.is('confirmed_at', null)
		.select('id');

	if (error) return { ok: false, message: error.message };
	if (!data || data.length === 0) {
		return { ok: false, message: 'Dieser Link ist ungültig oder wurde schon bestätigt.' };
	}
	return { ok: true };
}
