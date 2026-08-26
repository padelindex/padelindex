// ============================================================
// PadelIndex — Super-Admin: Zugriffskontrolle für /admin
// ============================================================
// Bewusst kein Rollensystem — nur eine feste E-Mail
// (PLATFORM_OWNER_EMAIL), solange eine einzelne Person die Plattform
// administriert. Fehlt die Umgebungsvariable, ist /admin für niemanden
// erreichbar (fail closed), nicht etwa offen.

import { error, redirect } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

function fromPlatform(platform: App.Platform | undefined, key: string): string {
	const value = (platform?.env as Record<string, unknown> | undefined)?.[key];
	return typeof value === 'string' ? value.trim() : '';
}

function fromPrivateEnv(key: string): string {
	const value = (privateEnv as Record<string, unknown>)[key];
	return typeof value === 'string' ? value.trim() : '';
}

export function isPlatformOwner(
	platform: App.Platform | undefined,
	email: string | null | undefined
): boolean {
	if (!email) return false;
	const ownerEmail =
		fromPlatform(platform, 'PLATFORM_OWNER_EMAIL') || fromPrivateEnv('PLATFORM_OWNER_EMAIL');
	if (!ownerEmail) return false;
	return email.trim().toLowerCase() === ownerEmail.toLowerCase();
}

/**
 * Wirft redirect(303, /anmelden) ohne Session bzw. error(404) ohne
 * Platform-Owner-Rechte — 404 statt 403, damit ein regulärer User keinen
 * Hinweis bekommt, dass diese Seite überhaupt existiert. Von jeder
 * /admin/*-Route zu verwenden (siehe admin/+page.server.ts,
 * admin/advertising/+page.server.ts).
 */
export function requirePlatformOwner(
	locals: App.Locals,
	platform: App.Platform | undefined,
	url: URL
) {
	if (!locals.user) {
		throw redirect(303, `/anmelden?next=${encodeURIComponent(url.pathname)}`);
	}
	if (!isPlatformOwner(platform, locals.user.email)) {
		throw error(404, 'Seite nicht gefunden');
	}
}
