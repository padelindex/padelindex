import { isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClubLeaderboardPage } from '$lib/server/leaderboard';

export const load: PageServerLoad = async ({ params, url, platform }) => {
	const rawPage = Number(url.searchParams.get('page'));
	try {
		const board = await getClubLeaderboardPage(
			params.slug,
			Number.isFinite(rawPage) ? rawPage : undefined,
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
