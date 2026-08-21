// ============================================================
// PadelIndex — JSON-API für den Header-Ticker
// ============================================================
// Dieselbe Feed-Engine wie feed.xml/+server.ts, nur als schlankes JSON
// fürs Frontend statt RSS-XML. Kürzeres Cache-Fenster als der RSS-Feed:
// der Ticker läuft im Browser, ein 5-Minuten-Takt reicht für "aktuell",
// ohne bei jedem Seitenaufruf neu zu laden.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildFeed } from '$lib/server/feed';

export const GET: RequestHandler = async ({ platform, setHeaders }) => {
	const items = await buildFeed(platform);

	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=300'
	});

	return json(items);
};
