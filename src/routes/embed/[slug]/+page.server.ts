import { isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClubLeaderboard } from '$lib/server/leaderboard';

export const load: PageServerLoad = async ({ params, url, platform }) => {
	const raw = Number(url.searchParams.get('limit'));
	try {
		const board = await getClubLeaderboard(
			params.slug,
			Number.isFinite(raw) ? raw : 10,
			platform
		);
		return { board, unavailable: false };
	} catch (err) {
		if (isHttpError(err) && err.status === 503) {
			return { board: null, unavailable: true };
		}
		throw err;
	}
};
