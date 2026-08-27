import adapter from '@sveltejs/adapter-cloudflare';

// CSP: script-src bewusst ohne 'unsafe-inline' — SvelteKit generiert dafür
// automatisch eine Nonce pro Request und hängt sie an seinen eigenen
// Hydration-Bootstrap (siehe app.html: das Support-Board-Script bekommt
// dieselbe Nonce manuell über %sveltekit.nonce%). style-src braucht
// 'unsafe-inline', weil etliche Komponenten style="..."-Attribute nutzen
// (CSP kann Inline-Attribute nicht per Nonce/Hash freigeben, nur
// <style>-Elemente) — Inline-CSS ist deutlich risikoärmer als Inline-JS,
// deshalb hier bewusst der übliche Kompromiss.
//
// Läuft zunächst als Report-Only (siehe reportOnly unten): diese Session
// konnte den Header nicht gegen die echte, live laufende Seite testen
// (kein Internetzugriff für einen echten Browser aus dieser Umgebung
// heraus). Nach dem Deploy in der Browser-Konsole prüfen, ob irgendetwas
// als "would have blocked" auftaucht — erst danach csp (statt
// reportOnly) scharf schalten.
const cspDirectives = {
	'default-src': ["'self'"],
	'base-uri': ["'self'"],
	'object-src': ["'none'"],
	'form-action': ["'self'"],
	'manifest-src': ["'self'"],
	'worker-src': ["'self'"],
	'script-src': ["'self'", 'https://cloud.board.support', 'https://*.board.support'],
	'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
	'font-src': ["'self'", 'https://fonts.gstatic.com'],
	'img-src': ["'self'", 'data:', 'https://tile.openstreetmap.org', 'https://tcpfkfsxsrbwsctepjni.supabase.co'],
	'connect-src': [
		"'self'",
		'https://tcpfkfsxsrbwsctepjni.supabase.co',
		'wss://tcpfkfsxsrbwsctepjni.supabase.co',
		'https://*.board.support',
		'wss://*.board.support',
		'https://static.cloudflareinsights.com',
		'https://fonts.googleapis.com'
	],
	'frame-ancestors': ["'none'"],
	// Pflicht für reportOnly (SvelteKit wirft sonst serverseitig einen
	// 500er auf JEDER Seite, siehe Kommentar oben) — sammelt Verstöße
	// unter src/routes/api/csp-report, sichtbar in den
	// Cloudflare-Worker-Logs, bis die CSP scharf geschaltet wird.
	'report-uri': ['/api/csp-report']
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			platformProxy: {
				persist: '.wrangler/state'
			}
		}),
		csp: {
			mode: 'auto',
			directives: {},
			reportOnly: cspDirectives
		}
	}
};

export default config;
