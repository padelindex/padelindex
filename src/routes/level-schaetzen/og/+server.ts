// Teilbares Ergebnisbild für den Level-Schätzer, als PNG (siehe
// lib/server/og-image.ts für das Warum von Satori+resvg statt <canvas>).
// Nur 15 mögliche Level-Werte (0, 0.5, ... 7) -> lang cachebar.

import type { RequestHandler } from './$types';
import { parseLevelParam } from '$lib/level-estimator';
import { renderLevelOgImage } from '$lib/server/og-image';

export const GET: RequestHandler = async ({ url, fetch, setHeaders }) => {
	const level = parseLevelParam(url.searchParams.get('level')) ?? 0;
	const png = await renderLevelOgImage(level, fetch);

	setHeaders({
		'content-type': 'image/png',
		'cache-control': 'public, max-age=31536000, immutable'
	});

	return new Response(png as unknown as BodyInit);
};
