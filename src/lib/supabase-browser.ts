// ============================================================
// PadelIndex — Supabase-Client im Browser
// ============================================================
//
// Nur für einen Zweck: nach einem Magic-Link-Klick die Session-Tokens
// aus dem URL-Fragment (#access_token=...&refresh_token=...) in ein
// Cookie übersetzen, das der Server danach lesen kann (siehe
// hooks.server.ts). Fragmente werden NIE an den Server geschickt — das
// muss zwingend im Browser passieren, deshalb reicht kein Server-Code.
//
// Grund, warum das überhaupt nötig ist: Supabases Standard-E-Mail-
// Templates ("Confirm signup", "Magic Link") verlinken auf
// {{ .ConfirmationURL }} → Supabases eigenen /auth/v1/verify-Endpunkt,
// der nach Prüfung mit #access_token=... auf unsere emailRedirectTo-URL
// zurückspringt. Die Templates auf token_hash umzustellen (siehe
// /auth/confirm) würde Custom-SMTP in Supabase voraussetzen — bis das
// eingerichtet ist, fängt dieser Weg die Standard-Mails trotzdem sauber ab.

import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabase(url: string, anonKey: string) {
	return createBrowserClient(url, anonKey);
}

export type MagicLinkTokens = {
	accessToken: string;
	refreshToken: string;
};

/** Liest #access_token=...&refresh_token=... aus dem URL-Fragment, falls vorhanden. */
export function readMagicLinkTokensFromHash(hash: string): MagicLinkTokens | null {
	const raw = hash.startsWith('#') ? hash.slice(1) : hash;
	if (!raw) return null;

	const params = new URLSearchParams(raw);
	const accessToken = params.get('access_token');
	const refreshToken = params.get('refresh_token');
	if (!accessToken || !refreshToken) return null;

	return { accessToken, refreshToken };
}
