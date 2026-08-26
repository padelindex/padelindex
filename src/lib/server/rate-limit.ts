// ============================================================
// PadelIndex — Rate Limiting für Registrierung/Login/Passwort-Reset
// ============================================================
// Zusätzlich zu Supabase Auths eigenen, projektweiten Limits
// (auth.rate_limit in supabase/config.toml) eine eigene Bremse pro
// Aktion+Schlüssel, siehe check_rate_limit() in
// supabase/migrations/0019_password_auth.sql. Läuft über den
// service_role-Client (RPC ist service_role-only), unabhängig vom
// Session-Client des jeweiligen Requests.
//
// Fail-open bei einem unerwarteten DB-Fehler: würde die Prüfung selbst
// scheitern, ist Postgres ohnehin nicht erreichbar — dann schlägt gleich
// danach signUp()/signInWithPassword() genauso fehl. Ein Fail-closed hier
// würde nur einen zusätzlichen, verwirrenden Fehlerpfad schaffen, ohne
// echten Sicherheitsgewinn (siehe sendEmail() in server/email.ts für
// dasselbe Prinzip: nie den Hauptvorgang wegen einer Nebensache blockieren).

import type { SupabaseClient } from '@supabase/supabase-js';

export type RateLimitBucket =
	| 'register:ip'
	| 'login:ip'
	| 'login:email'
	| 'password-reset:email'
	| 'resend-confirmation:email'
	| 'claim-lookup:ip'
	| 'claim:ip'
	| 'claim:email';

const LIMITS: Record<RateLimitBucket, { max: number; windowSeconds: number }> = {
	'register:ip': { max: 8, windowSeconds: 60 * 60 }, // 8 Registrierungen / Stunde / IP
	'login:ip': { max: 20, windowSeconds: 15 * 60 }, // 20 Loginversuche / 15 min / IP
	'login:email': { max: 8, windowSeconds: 15 * 60 }, // 8 Loginversuche / 15 min / Adresse (Brute-Force auf ein Konto)
	'password-reset:email': { max: 3, windowSeconds: 60 * 60 }, // 3 Reset-Mails / Stunde / Adresse
	'resend-confirmation:email': { max: 3, windowSeconds: 60 * 60 },
	// /api/claim/lookup verrät ohne Bremse per Trial-and-Error, welcher
	// abgekürzte Profilname ("Robin K.") zu welchem vollen Namen gehört.
	'claim-lookup:ip': { max: 20, windowSeconds: 15 * 60 },
	// /api/claim verschickt eine Magic-Link-Mail an eine vom Aufrufer
	// angegebene Adresse (nicht zwingend die eigene) — ohne Bremse ließe
	// sich eine fremde Adresse mit einem Mail pro unbeanspruchtem Profil
	// im selben Verein zuspammen. IP zusätzlich zur E-Mail, gegen breit
	// automatisiertes Durchprobieren aus einer Quelle.
	'claim:ip': { max: 10, windowSeconds: 60 * 60 },
	'claim:email': { max: 3, windowSeconds: 60 * 60 }
};

/**
 * true = erlaubt (Versuch wurde gezählt), false = Limit erreicht.
 * `admin` muss der service_role-Client sein (supabaseAdmin()) — die RPC
 * ist absichtlich für anon/authenticated gesperrt.
 */
export async function checkRateLimit(
	admin: SupabaseClient,
	bucket: RateLimitBucket,
	key: string
): Promise<boolean> {
	const { max, windowSeconds } = LIMITS[bucket];

	const { data, error } = await admin.rpc('check_rate_limit', {
		p_bucket: bucket,
		p_key: key,
		p_max: max,
		p_window: `${windowSeconds} seconds`
	});

	if (error) {
		console.error('Rate-Limit-Prüfung fehlgeschlagen', bucket, error.message);
		return true;
	}

	return data === true;
}
