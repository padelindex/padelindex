// ============================================================
// PadelIndex — Service Worker für die PWA
// ============================================================
// Ziel ist Installierbarkeit und ein schneller App-Shell-Neustart,
// NICHT Offline-Nutzung der Ranglisten/Ligen: Ratings, Boxen und
// Ligatabellen ändern sich laufend, ein gecachtes Ergebnis wäre
// falsche Daten mit dem Anschein von Aktualität. Deshalb:
//
//   - Build-Assets (JS/CSS) und statische Dateien (Icons, Fonts, Logo)
//     werden beim Install einmal vorab gecacht und danach cache-first
//     ausgeliefert — die Dateinamen sind ohnehin content-gehasht.
//   - Alles andere (Seiten, API/Remote-Functions, Supabase-Aufrufe)
//     geht ausschließlich über das Netz. Kein Fallback auf einen
//     alten Snapshot, wenn offline — lieber ein Fehler als ein
//     stilles veraltetes Rating.
//
// SvelteKit registriert dieses Skript automatisch (kit.serviceWorker
// .register ist standardmäßig an), siehe svelte.config.js.

import { build, files, version } from '$service-worker';

const CACHE = `padelindex-shell-${version}`;
const PRECACHE_URLS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// Nur exakt vorab gecachte Build-/Static-Assets dürfen aus dem Cache
	// kommen. Seitenaufrufe und alles Dynamische läuft immer über das Netz.
	if (!PRECACHE_URLS.includes(url.pathname)) return;

	event.respondWith(
		caches.open(CACHE).then(async (cache) => {
			const cached = await cache.match(request);
			return cached ?? fetch(request);
		})
	);
});
