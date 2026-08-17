declare global {
	namespace App {
		interface Platform {
			env: {
				PUBLIC_SUPABASE_URL?: string;
				PUBLIC_SUPABASE_ANON_KEY?: string;
				SUPABASE_SERVICE_ROLE_KEY?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
