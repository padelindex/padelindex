// Führt ein TypeScript-Skript über Vites SSR-Loader aus.
//
//   node scripts/run.mjs scripts/import-bavaro.ts
//
// Node selbst besteht bei ESM auf Dateiendungen, die Codebase importiert
// aber endungslos (wie Vite es erwartet). Statt die Quellen dafür zu
// verbiegen, laden wir sie hier durch dieselbe Auflösung wie die App.

import { createServer } from 'vite';
import { resolve } from 'node:path';

const target = process.argv[2];
if (!target) {
	console.error('Aufruf: node scripts/run.mjs <skript.ts>');
	process.exit(1);
}

// configFile: false — die SvelteKit-Plugins werden hier nicht gebraucht.
const server = await createServer({
	configFile: false,
	logLevel: 'warn',
	server: { middlewareMode: true },
	optimizeDeps: { noDiscovery: true }
});

try {
	await server.ssrLoadModule(resolve(process.cwd(), target));
} finally {
	await server.close();
}
