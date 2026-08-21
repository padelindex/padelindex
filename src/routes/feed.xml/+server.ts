// ============================================================
// PadelIndex — RSS 2.0 Feed für den Live-Ticker
// ============================================================
// Dieselbe Feed-Engine wie api/ticker/+server.ts, nur als valides
// RSS-2.0-XML statt JSON — Cache-Control wie bei sitemap.xml, nur
// kürzer (10 statt 60 Minuten): der Ticker soll spürbar aktuell wirken.

import type { RequestHandler } from './$types';
import { buildFeed } from '$lib/server/feed';
import { absoluteLink, escapeXml, FEED_ORIGIN } from '$lib/feed';

const CHANNEL_TITLE = 'PadelIndex — Live-Ticker';
const CHANNEL_DESCRIPTION =
	'Ergebnisse, neue Vereine, Spieler-Spotlights und Neuigkeiten von PadelIndex, der unabhängigen Rangliste für Padel-Amateure.';

export const GET: RequestHandler = async ({ platform, setHeaders }) => {
	const items = await buildFeed(platform);

	const itemsXml = items
		.map(
			(item) => `\t<item>
\t\t<title>${escapeXml(item.title)}</title>
\t\t<link>${escapeXml(absoluteLink(item.link))}</link>
\t\t<guid isPermaLink="false">${escapeXml(item.id)}</guid>
\t\t<category>${escapeXml(item.category)}</category>
\t\t<pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
\t\t<description>${escapeXml(item.description)}</description>
\t</item>`
		)
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
\t<title>${escapeXml(CHANNEL_TITLE)}</title>
\t<link>${FEED_ORIGIN}/</link>
\t<description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
\t<language>de-DE</language>
\t<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
</channel>
</rss>
`;

	setHeaders({
		'content-type': 'application/xml',
		'cache-control': 'public, max-age=600, s-maxage=600'
	});

	return new Response(body);
};
