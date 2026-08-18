// Sitemap als Endpunkt statt statischer Datei: die Vereinsseiten kommen
// aus der Datenbank und sollen mitwachsen, ohne dass jemand daran denkt.
//
// Aufgenommen wird nur, was auch indexiert werden darf — /konto,
// /anmelden, /embed und die Beanspruchen-Seiten tragen noindex und
// bleiben deshalb draußen.

import type { RequestHandler } from './$types';
import { supabaseAnon } from '$lib/server/supabase';

const ORIGIN = 'https://padelindex.de';

const STATIC_PAGES = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
	{ path: '/impressum', priority: '0.3', changefreq: 'yearly' }
];

export const GET: RequestHandler = async ({ platform, setHeaders }) => {
	const urls = STATIC_PAGES.map((p) => ({
		loc: ORIGIN + p.path,
		priority: p.priority,
		changefreq: p.changefreq
	}));

	// Vereinsseiten sind öffentlich und lohnen sich im Index.
	try {
		const sb = supabaseAnon(platform);
		if (sb) {
			const { data } = await sb.from('clubs').select('slug').limit(500);
			for (const club of data ?? []) {
				urls.push({
					loc: `${ORIGIN}/c/${club.slug}`,
					priority: '0.8',
					changefreq: 'daily'
				});
			}
		}
	} catch {
		// Ohne Datenbank bleibt die Sitemap eben kürzer, statt zu scheitern.
	}

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) =>
			`\t<url>\n\t\t<loc>${u.loc}</loc>\n\t\t<changefreq>${u.changefreq}</changefreq>\n\t\t<priority>${u.priority}</priority>\n\t</url>`
	)
	.join('\n')}
</urlset>
`;

	setHeaders({
		'content-type': 'application/xml',
		'cache-control': 'public, max-age=3600'
	});

	return new Response(body);
};
