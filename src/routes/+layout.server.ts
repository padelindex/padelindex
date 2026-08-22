// Stellt die öffentliche Supabase-Konfiguration allen Seiten als Page-Data
// zur Verfügung — für den Browser-Client, der Magic-Link-Fragmente
// konsumiert (siehe konto/+page.svelte). Bewusst aus platform.env statt
// $env/static/public: auf Cloudflare Workers sind Runtime-Vars zur
// Build-Zeit nicht zuverlässig im Client-Bundle verfügbar. anon key ist
// public by design, unbedenklich im Seiten-Payload.

import type { LayoutServerLoad } from './$types';
import { readAppEnv, readCfBeaconToken } from '$lib/server/env';

export const load: LayoutServerLoad = ({ platform }) => {
	const env = readAppEnv(platform);
	return {
		supabaseConfig: env ? { url: env.supabaseUrl, anonKey: env.supabaseAnonKey } : null,
		cfBeaconToken: readCfBeaconToken(platform)
	};
};
