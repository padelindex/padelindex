// ============================================================
// PadelIndex — Session pro Request
// ============================================================
//
// Zwei Hooks nacheinander:
//   1. attachSupabase — baut den cookie-gebundenen Supabase-Client.
//      @supabase/ssr übernimmt dabei das Lesen/Schreiben der Auth-Cookies
//      (Set-Cookie beim Login/Logout, Refresh bei abgelaufenem Token).
//   2. attachSession  — verifiziert die Session und lädt bei Bedarf das
//      verknüpfte Spielerprofil (players.user_id = auth.uid(), per RLS).
//
// Ohne Supabase-Keys (siehe README, „Ohne Supabase-Keys läuft die Landing
// trotzdem") bleibt locals.supabase null und alle Felder leer, statt die
// Seite hart abstürzen zu lassen.

import { createServerClient } from '@supabase/ssr';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { readAppEnv } from '$lib/server/env';
import { loadSessionPlayer } from '$lib/server/session';

const attachSupabase: Handle = async ({ event, resolve }) => {
	const env = readAppEnv(event.platform);

	if (!env) {
		event.locals.supabase = null;
		event.locals.safeGetSession = async () => ({ session: null, user: null });
		return resolve(event);
	}

	const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});
	event.locals.supabase = supabase;

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range'
	});
};

const attachSession: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	event.locals.player =
		user && event.locals.supabase ? await loadSessionPlayer(event.locals.supabase, user.id) : null;

	return resolve(event);
};

export const handle: Handle = sequence(attachSupabase, attachSession);
