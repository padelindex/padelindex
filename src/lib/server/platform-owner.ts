// ============================================================
// PadelIndex — Super-Admin: Zugriffskontrolle für /admin
// ============================================================
// Bewusst kein Rollensystem — nur eine feste E-Mail
// (PLATFORM_OWNER_EMAIL), solange eine einzelne Person die Plattform
// administriert. Fehlt die Umgebungsvariable, ist /admin für niemanden
// erreichbar (fail closed), nicht etwa offen.

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
	const ownerEmail = fromPlatform(platform, 'PLATFORM_OWNER_EMAIL') || fromPrivateEnv('PLATFORM_OWNER_EMAIL');
	if (!ownerEmail) return false;
	return email.trim().toLowerCase() === ownerEmail.toLowerCase();
}
