// Sitemap als Endpunkt statt statischer Datei: die Vereins- und
// Spielerseiten kommen aus der Datenbank und sollen mitwachsen, ohne
// dass jemand daran denkt.
//
// Aufgenommen wird nur, was auch indexiert werden darf — /konto,
// /anmelden, /embed und die Beanspruchen-Seiten tragen noindex und
// bleiben deshalb draußen. /impressum und /datenschutz ebenfalls: die
// tragen seit Block 0 selbst noindex (siehe dort), ein noindex-Ziel in
// der Sitemap zu listen sendet Google widersprüchliche Signale.

import type { RequestHandler } from './$types';
import { supabaseAnon } from '$lib/server/supabase';
import { MIN_MATCHES_FOR_INDEXING } from '$lib/seo';

const ORIGIN = 'https://padelindex.de';

const STATIC_PAGES = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/rating', priority: '0.8', changefreq: 'monthly' },
	{ path: '/vereine', priority: '0.8', changefreq: 'monthly' },
	{ path: '/faq', priority: '0.6', changefreq: 'monthly' },
	{ path: '/ueber', priority: '0.5', changefreq: 'yearly' },
	{ path: '/level-schaetzen', priority: '0.6', changefreq: 'monthly' }
];

export const GET: RequestHandler = async ({ platform, setHeaders }) => {
	const urls = STATIC_PAGES.map((p) => ({
		loc: ORIGIN + p.path,
		priority: p.priority,
		changefreq: p.changefreq
	}));

	try {
		const sb = supabaseAnon(platform);
		if (sb) {
			// Vereinsseiten sind öffentlich und lohnen sich im Index.
			const { data: clubs } = await sb.from('clubs').select('slug').limit(500);
			for (const club of clubs ?? []) {
				urls.push({
					loc: `${ORIGIN}/c/${club.slug}`,
					priority: '0.8',
					changefreq: 'daily'
				});
			}

			// Ligaseiten sind ein eigenes öffentliches Produkt (0016).
			// Entwürfe bleiben draußen, die RLS-Policy filtert sie ohnehin.
			const { data: leagues } = await sb
				.from('leagues')
				.select('slug')
				.neq('status', 'draft')
				.limit(200);
			for (const league of leagues ?? []) {
				urls.push({
					loc: `${ORIGIN}/liga/${league.slug}`,
					priority: '0.7',
					changefreq: 'weekly'
				});
			}

			// Spielerprofile erst ab genug bestätigten Matches (lib/seo.ts) —
			// club_leaderboard ist die einzige für anon lesbare Projektion auf
			// players, players selbst ist seit 0005 für anon gesperrt.
			const { data: players } = await sb
				.from('club_leaderboard')
				.select('handle, matches')
				.gte('matches', MIN_MATCHES_FOR_INDEXING)
				.limit(2000);
			for (const p of players ?? []) {
				urls.push({
					loc: `${ORIGIN}/p/${p.handle}`,
					priority: '0.5',
					changefreq: 'weekly'
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
