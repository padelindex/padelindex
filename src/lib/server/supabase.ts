import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readAppEnv, requireAppEnv, requireServiceRole } from './env';

const clientOptions = {
	auth: { persistSession: false, autoRefreshToken: false }
} as const;

export function supabaseAnon(): SupabaseClient | null {
	const env = readAppEnv();
	if (!env) return null;
	return createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
}

export function supabaseAdmin(): SupabaseClient {
	const env = requireServiceRole();
	return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions);
}

export function supabasePublic(): SupabaseClient {
	const env = requireAppEnv();
	return createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
}
