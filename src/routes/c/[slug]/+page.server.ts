import { isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClubLeaderboard } from '$lib/server/leaderboard';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const board = await getClubLeaderboard(params.slug, 25);
		return { board, unavailable: false };
	} catch (err) {
		if (isHttpError(err) && err.status === 503) {
			return { board: null, unavailable: true };
		}
		throw err;
	}
};
