import type { CapacitorConfig } from '@capacitor/cli';

// PadelIndex ist serverseitig gerendert (SvelteKit + Cloudflare Workers,
// Supabase-Login-Sessions, Formulare, Live-Ratings) — kein statischer
// Build, der sinnvoll in eine App gebündelt werden könnte. Die App lädt
// deshalb direkt die Produktions-Website in der WebView, siehe
// capacitor-shell/index.html für die Begründung des Platzhalter-webDir.
const config: CapacitorConfig = {
	appId: 'de.padelindex.app',
	appName: 'PadelIndex',
	webDir: 'capacitor-shell',
	server: {
		url: 'https://padelindex.de',
		// Nur HTTPS — kein Klartext-HTTP für die produktiv genutzte App.
		cleartext: false
	}
};

export default config;
