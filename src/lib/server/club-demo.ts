// ============================================================
// PadelIndex — Demo-Anfragen von Vereinen (getrennter Funnel)
// ============================================================
// Anders als die Warteliste (Spieler, "sag mir Bescheid") ist das hier
// eine Anfrage von jemandem mit Entscheidungsbefugnis im Verein — landet
// in club_demo_requests UND geht als E-Mail an kontakt@padelindex.de,
// damit nichts im Postfach untergeht, aber auch nichts verloren ist, falls
// der Mailversand mal ausfällt (siehe email.ts: sendEmail() wirft nie).

import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidEmail } from '$lib/email';
import { sendEmail, type EmailEnv } from './email';

export type ClubDemoInput = {
	clubName: string;
	contactName: string;
	email: string;
	message: string;
};

export type ClubDemoResult = { ok: true } | { ok: false; message: string };

export async function submitClubDemoRequest(
	admin: SupabaseClient,
	input: ClubDemoInput,
	opts: { emailEnv: EmailEnv | null; notifyTo: string }
): Promise<ClubDemoResult> {
	const clubName = input.clubName.trim().slice(0, 120);
	const contactName = input.contactName.trim().slice(0, 120);
	const email = input.email.trim().toLowerCase();
	const message = input.message.trim().slice(0, 2000);

	if (!clubName) return { ok: false, message: 'Bitte den Vereinsnamen angeben.' };
	if (!contactName) return { ok: false, message: 'Bitte einen Ansprechpartner angeben.' };
	if (!isValidEmail(email)) return { ok: false, message: 'Bitte eine gültige E-Mail-Adresse eingeben.' };

	const { error } = await admin.from('club_demo_requests').insert({
		club_name: clubName,
		contact_name: contactName,
		email,
		message: message || null
	});
	if (error) return { ok: false, message: 'Konnte nicht gesendet werden. Bitte später erneut versuchen.' };

	await sendEmail(opts.emailEnv, {
		to: opts.notifyTo,
		subject: `Demo-Anfrage: ${clubName}`,
		html: `
			<p><strong>${escapeHtml(clubName)}</strong> möchte PadelIndex kennenlernen.</p>
			<p>Kontakt: ${escapeHtml(contactName)} — <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
			${message ? `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
		`.trim()
	});

	return { ok: true };
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
