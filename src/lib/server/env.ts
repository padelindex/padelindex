import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

export type AppEnv = {
	supabaseUrl: string;
	supabaseAnonKey: string;
	supabaseServiceRoleKey: string;
};

type PlatformEnv = App.Platform['env'] | undefined;

function pick(platform: PlatformEnv, key: keyof NonNullable<PlatformEnv>, fallback: string | undefined) {
	return (platform?.[key] || fallback || '').trim();
}

export function readAppEnv(platform?: App.Platform): AppEnv | null {
	const fromCf = platform?.env;
	const supabaseUrl = pick(fromCf, 'PUBLIC_SUPABASE_URL', publicEnv.PUBLIC_SUPABASE_URL);
	const supabaseAnonKey = pick(fromCf, 'PUBLIC_SUPABASE_ANON_KEY', publicEnv.PUBLIC_SUPABASE_ANON_KEY);
	const supabaseServiceRoleKey = pick(
		fromCf,
		'SUPABASE_SERVICE_ROLE_KEY',
		privateEnv.SUPABASE_SERVICE_ROLE_KEY
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
