// ============================================================
// PadelIndex — Widerruf ohne Login
// ============================================================
// Unbeanspruchte, importierte Profile haben keine hinterlegte E-Mail —
// ein Abgleich "gehört diese Adresse wirklich zu diesem Profil" ist
// technisch nicht möglich. Die Hürde ist bewusst der Klick auf den
// Bestätigungslink, kein Identitätsnachweis (siehe Auftrag: "kein Login,
// kein Umweg"). token_hash wird als SHA-256-Hex gespeichert, der rohe
// Token steckt nur im Link — wie bei anderen Bestätigungsflüssen hier
// nie im Klartext in der Datenbank.
//
// Genau DESHALB gilt der Flow nur für claim_status='unclaimed': ein
// bereits beanspruchtes Profil hat eine echte, verifizierte E-Mail und
// einen Login (siehe /konto) — dafür ist "Klick auf einen Link genügt"
// keine Hürde mehr, sondern eine Lücke. Ohne diese Einschränkung könnte
// jede Person mit ihrer EIGENEN E-Mail-Adresse das öffentliche Profil
// einer fremden, aktiven Person unsichtbar machen (Handle reicht als
// einzige Eingabe) — kein Zugriff auf deren Postfach nötig.

import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidEmail } from '$lib/email';
import { delistingConfirmEmail } from '$lib/notifications';
import { sendEmail, type EmailEnv } from './email';

async function hashToken(raw: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export type RequestDelistingResult = { ok: true } | { ok: false; message: string };

/**
 * Immer { ok: true } bei unbekanntem/schon-privatem Handle oder schon
 * offener Anfrage — sonst ließe sich per Trial-and-Error herausfinden,
 * welche Handles existieren (gleiches Prinzip wie matchClaimName).
 */
export async function requestDelisting(
	admin: SupabaseClient,
	handle: string,
	email: string,
	opts: { emailEnv: EmailEnv | null; baseUrl: string }
): Promise<RequestDelistingResult> {
	const normalizedEmail = email.trim().toLowerCase();
	if (!isValidEmail(normalizedEmail)) {
		return { ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' };
	}

	const trimmedHandle = handle.trim();
	if (!trimmedHandle) return { ok: false, message: 'Bitte den Profil-Namen angeben.' };

	const { data: player } = await admin
		.from('players')
		.select('id, display_name, profile_public, claim_status')
		.eq('handle', trimmedHandle)
		.maybeSingle();

	if (!player || !player.profile_public || player.claim_status !== 'unclaimed') {
		return { ok: true };
	}

	const rawToken = crypto.randomUUID() + crypto.randomUUID();
	const tokenHash = await hashToken(rawToken);

	const { error: insertErr } = await admin.from('delisting_requests').insert({
		player_id: player.id,
		email: normalizedEmail,
		token_hash: tokenHash
	});

	// Verstößt gegen "nur eine offene Anfrage pro Profil" (delisting_requests_one_pending_idx)
	// -> es läuft schon eine, keine zweite Mail, aber auch kein Fehler nach außen.
	if (insertErr) return { ok: true };

	const confirmUrl = `${opts.baseUrl}/profil-entfernen/bestaetigen?token=${rawToken}`;
	await sendEmail(opts.emailEnv, {
		to: normalizedEmail,
		...delistingConfirmEmail({ playerName: player.display_name, confirmUrl })
	});

	return { ok: true };
}

export type ConfirmDelistingResult = { ok: true } | { ok: false; message: string };

export async function confirmDelisting(
	admin: SupabaseClient,
	rawToken: string
): Promise<ConfirmDelistingResult> {
	if (!rawToken) return { ok: false, message: 'Ungültiger Link.' };
	const tokenHash = await hashToken(rawToken);

	const { data: reqRow } = await admin
		.from('delisting_requests')
		.select('id, player_id, expires_at, confirmed_at')
		.eq('token_hash', tokenHash)
		.maybeSingle();

	if (!reqRow) return { ok: false, message: 'Dieser Link ist ungültig oder wurde schon verwendet.' };
	if (reqRow.confirmed_at) {
		return { ok: false, message: 'Dieser Link wurde bereits verwendet.' };
	}
	if (new Date(reqRow.expires_at).getTime() < Date.now()) {
		return { ok: false, message: 'Dieser Link ist abgelaufen. Fordere einen neuen an.' };
	}

	const { error: updErr } = await admin
		.from('players')
		.update({ profile_public: false })
		.eq('id', reqRow.player_id);
	if (updErr) return { ok: false, message: updErr.message };

	await admin
		.from('delisting_requests')
		.update({ confirmed_at: new Date().toISOString() })
		.eq('id', reqRow.id);

	return { ok: true };
}
