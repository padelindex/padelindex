// ============================================================
// PadelIndex — Transaktions-E-Mail (Resend)
// ============================================================
// Best-effort: ein Versandfehler darf einen auslösenden Vorgang (z.B.
// Match melden) nie blockieren. sendEmail() wirft deshalb nie, sondern
// gibt { ok } zurück und loggt Fehler.
//
// RESEND_API_KEY/MAIL_FROM sind optional (siehe .env.example) — solange
// sie nicht gesetzt sind, landet die Mail nur im Log statt beim
// Empfänger (siehe readEmailEnv: null statt Exception).

import { env as privateEnv } from '$env/dynamic/private';

export type EmailEnv = { resendApiKey: string; mailFrom: string };

function fromPlatform(platform: App.Platform | undefined, key: string): string {
	const value = (platform?.env as Record<string, unknown> | undefined)?.[key];
	return typeof value === 'string' ? value.trim() : '';
}

function fromPrivateEnv(key: string): string {
	const value = (privateEnv as Record<string, unknown>)[key];
	return typeof value === 'string' ? value.trim() : '';
}

export function readEmailEnv(platform?: App.Platform): EmailEnv | null {
	const resendApiKey = fromPlatform(platform, 'RESEND_API_KEY') || fromPrivateEnv('RESEND_API_KEY');
	const mailFrom = fromPlatform(platform, 'MAIL_FROM') || fromPrivateEnv('MAIL_FROM');
	if (!resendApiKey || !mailFrom) return null;
	return { resendApiKey, mailFrom };
}

export async function sendEmail(
	env: EmailEnv | null,
	input: { to: string; subject: string; html: string }
): Promise<{ ok: boolean }> {
	if (!env) {
		console.warn(`E-Mail nicht gesendet (RESEND_API_KEY/MAIL_FROM fehlt): "${input.subject}" an ${input.to}`);
		return { ok: false };
	}

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.resendApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: env.mailFrom,
				to: input.to,
				subject: input.subject,
				html: input.html
			})
		});
		if (!res.ok) {
			console.error('Resend-Fehler', res.status, await res.text().catch(() => ''));
			return { ok: false };
		}
		return { ok: true };
	} catch (e) {
		console.error('E-Mail-Versand fehlgeschlagen', e);
		return { ok: false };
	}
}
