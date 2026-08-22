import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

export type AppEnv = {
	supabaseUrl: string;
	supabaseAnonKey: string;
	supabaseServiceRoleKey: string;
};

function asString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function fromPlatform(platform: App.Platform | undefined, key: string): string {
	const env = platform?.env as Record<string, unknown> | undefined;
	return asString(env?.[key]);
}

function first(...values: string[]): string {
	return values.find((value) => value.length > 0) ?? '';
}

export function readAppEnv(platform?: App.Platform): AppEnv | null {
	const supabaseUrl = first(
		fromPlatform(platform, 'PUBLIC_SUPABASE_URL'),
		asString(publicEnv.PUBLIC_SUPABASE_URL)
	);
	const supabaseAnonKey = first(
		fromPlatform(platform, 'PUBLIC_SUPABASE_ANON_KEY'),
		asString(publicEnv.PUBLIC_SUPABASE_ANON_KEY)
	);
	const supabaseServiceRoleKey = first(
		fromPlatform(platform, 'SUPABASE_SERVICE_ROLE_KEY'),
		asString(privateEnv.SUPABASE_SERVICE_ROLE_KEY)
	);

	if (!supabaseUrl || !supabaseAnonKey) return null;

	return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export function requireAppEnv(platform?: App.Platform): AppEnv {
	const env = readAppEnv(platform);
	if (!env) {
		throw new Error('Supabase ist nicht konfiguriert (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY).');
	}
	return env;
}

export function requireServiceRole(platform?: App.Platform): AppEnv {
	const env = requireAppEnv(platform);
	if (!env.supabaseServiceRoleKey) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt.');
	}
	return env;
}

/**
 * Schaltet die "12 Monate kostenlos"-Einführungsaktion für Vereine ein/aus
 * (Website-Audit Block 2, Entscheidung vom 19.08.: Flag statt Preisliste).
 * Kein Preis behauptet, solange keiner feststeht — einfacher An/Aus-Schalter
 * über wrangler.toml [vars]/.env, keine neue Abhängigkeit.
 */
export function readTrialOfferEnabled(platform?: App.Platform): boolean {
	const value = first(
		fromPlatform(platform, 'PUBLIC_TRIAL_OFFER_ENABLED'),
		asString(publicEnv.PUBLIC_TRIAL_OFFER_ENABLED)
	);
	return value === 'true';
}

/**
 * Cloudflare Web Analytics (Website-Audit Block 6): cookiefreies Beacon-Script,
 * ohne eigenes Deployment. Leer, bis das Team es im Cloudflare-Dashboard
 * unter "Web Analytics" aktiviert und den Site-Token hier einträgt — bis
 * dahin wird gar kein Script eingebunden (siehe +layout.svelte).
 */
export function readCfBeaconToken(platform?: App.Platform): string {
	return first(
		fromPlatform(platform, 'PUBLIC_CF_BEACON_TOKEN'),
		asString(publicEnv.PUBLIC_CF_BEACON_TOKEN)
	);
}
