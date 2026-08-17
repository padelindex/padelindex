import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readAppEnv, requireAppEnv, requireServiceRole } from './env';

const clientOptions = {
	auth: { persistSession: false, autoRefreshToken: false }
} as const;

export function supabaseAnon(platform?: App.Platform): SupabaseClient | null {
	const env = readAppEnv(platform);
	if (!env) return null;
	return createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
}

export function supabaseAdmin(platform?: App.Platform): SupabaseClient {
	const env = requireServiceRole(platform);
	return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions);
}

export function supabasePublic(platform?: App.Platform): SupabaseClient {
	const env = requireAppEnv(platform);
	return createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
}
