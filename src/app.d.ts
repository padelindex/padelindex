import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { SessionPlayer } from '$lib/server/session';

declare global {
	namespace App {
		interface Locals {
			/** null, solange Supabase nicht konfiguriert ist (siehe env.ts). */
			supabase: SupabaseClient | null;
			/**
			 * getSession() liest nur das Cookie, ohne das JWT zu prüfen.
			 * safeGetSession() verifiziert es serverseitig via getUser(),
			 * bevor irgendetwas dem Inhalt vertraut.
			 */
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			/** Das mit dem eingeloggten Auth-User verknüpfte Spielerprofil, falls vorhanden. */
			player: SessionPlayer | null;
		}
		interface Platform {
			env: {
				PUBLIC_SUPABASE_URL?: string;
				PUBLIC_SUPABASE_ANON_KEY?: string;
				SUPABASE_SERVICE_ROLE_KEY?: string;
				/** Transaktions-E-Mail (Resend), siehe lib/server/email.ts. Beide optional — ohne sie wird nur geloggt statt versendet. */
				RESEND_API_KEY?: string;
				MAIL_FROM?: string;
				/** /admin — siehe lib/server/platform-owner.ts. Fehlt sie, ist /admin für niemanden erreichbar (fail closed). */
				PLATFORM_OWNER_EMAIL?: string;
				/** "true" schaltet die "12 Monate kostenlos"-Aktion im Vereins-Bereich frei, siehe lib/server/env.ts. */
				PUBLIC_TRIAL_OFFER_ENABLED?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
