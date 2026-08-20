import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
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
