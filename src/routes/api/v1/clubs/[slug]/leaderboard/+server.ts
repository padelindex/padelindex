import { json, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getClubLeaderboard } from '$lib/server/leaderboard';

const cors = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'GET, OPTIONS',
	'access-control-allow-headers': 'accept, content-type'
};

export const OPTIONS: RequestHandler = () => new Response(null, { headers: cors });

export const GET: RequestHandler = async ({ params, url }) => {
	const raw = Number(url.searchParams.get('limit'));
	try {
		const board = await getClubLeaderboard(params.slug, Number.isFinite(raw) ? raw : undefined);
		return json(board, {
			headers: {
				...cors,
				'cache-control': 'public, max-age=60, s-maxage=300'
			}
		});
	} catch (err) {
		if (isHttpError(err)) {
			const message =
				typeof err.body === 'object' && err.body && 'message' in err.body
					? String(err.body.message)
					: 'Fehler';
			return json({ message }, { status: err.status, headers: cors });
		}
		throw err;
	}
};
