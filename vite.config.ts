/**
 * Copyright (c) 2025–2026 Alec Hahn / Sportcenter Hahn GmbH
 * All rights reserved.
 * Proprietary and confidential.
 * See LICENSE for details.
 */

import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

// i18n-Routing: nur die ~15 öffentlichen/SEO-Seiten bekommen /en, /es
// (siehe Plan "i18n & SEO-Lokalisierung"). Alles, was hier NICHT
// gelistet ist (/konto, /admin, /anmelden, /liga/[slug]/verwaltung/*,
// /c/[slug]/beanspruchen, …), taucht in keinem urlPatterns-Eintrag auf —
// laut Paraglide-Quellcode (localize-url.js: "If no match found, return
// the original url") bleibt so ein Pfad unverändert deutsch, ganz ohne
// eigene Ausschlussliste. `/c/:slug` und `/liga/:slug` matchen bewusst
// nur genau EIN Pfadsegment (kein Catch-all), treffen also nie die
// tieferen Transaktionsseiten wie /c/[slug]/beanspruchen.
const IN_SCOPE_PATHS = [
	'/',
	'/rating',
	'/vereine',
	'/karte',
	'/ratgeber/:path(.*)?',
	'/quiz/:path(.*)?',
	'/faq',
	'/ueber',
	'/c/:slug',
	'/p/:handle',
	'/liga/:slug/box/:boxId',
	'/liga/:slug',
	'/datenschutz',
	'/impressum'
];

const urlPatterns = IN_SCOPE_PATHS.map((path) => ({
	pattern: path,
	localized: [
		['de', path],
		['en', path === '/' ? '/en' : `/en${path}`],
		['es', path === '/' ? '/es' : `/es${path}`]
	] as [string, string][]
}));

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'baseLocale'],
			urlPatterns
		})
	],
	// resvg-wasm (Level-Schätzer OG-Bild, siehe lib/server/og-image.ts) importiert
	// sein .wasm-Modul direkt. Vite/Rolldown wüssten damit nichts anzufangen
	// (kein Wasm-Plugin) — der Import bleibt deshalb unangetastet im
	// Worker-Bundle stehen, Wrangler kompiliert ihn beim Deploy/Dev selbst
	// zu einem WebAssembly.Module (siehe Cloudflare-Doku "Import .wasm").
	build: {
		rollupOptions: {
			external: [/\.wasm$/]
		}
	},
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
