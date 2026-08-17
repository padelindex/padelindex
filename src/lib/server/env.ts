import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

export type AppEnv = {
	supabaseUrl: string;
	supabaseAnonKey: string;
	supabaseServiceRoleKey: string;
};

export function readAppEnv(): AppEnv | null {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL ?? '';
	const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY ?? '';
	const supabaseServiceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY ?? '';

	if (!supabaseUrl || !supabaseAnonKey) return null;

	return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export function requireAppEnv(): AppEnv {
	const env = readAppEnv();
	if (!env) {
		throw new Error('Supabase ist nicht konfiguriert (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY).');
	}
	return env;
}

export function requireServiceRole(): AppEnv {
	const env = requireAppEnv();
	if (!env.supabaseServiceRoleKey) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt.');
	}
	return env;
}
