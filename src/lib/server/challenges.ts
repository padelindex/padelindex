// ============================================================
// PadelIndex — Challenges (Datenzugriff + Regelanwendung)
// ============================================================
// Ränge werden bei JEDEM Aufruf frisch aus der Rangliste abgeleitet, nie
// aus der Challenge-Zeile gelesen (siehe Migration 0013, Annahme 2) —
// zwischen Erstellen und Annehmen kann sich das Rating beider Seiten
// geändert haben. challenger_rank_at_creation ist reine Dokumentation.
//
// Die Rangliste ist club_leaderboard (0005), sortiert nach rating desc.
// Es gibt bewusst kein eigenes "leaderboards"-Konstrukt: die Rangliste
// eines Vereins IST der Verein.
//
// WICHTIG: Eine gewonnene Challenge tauscht keine Plätze. Sie verschafft
// nur Zugang zu stärkeren Gegnern; das Rating ändert sich ausschließlich
// über den normalen Match-Flow (apply_match_rating, 0002).

import type { SupabaseClient } from '@supabase/supabase-js';
import { abbreviateName } from '$lib/claim-match';
import {
	CHALLENGE_EXPIRY_DAYS,
	MAX_ACTIVE_OUTGOING_CHALLENGES,
	canChallenge,
	canTransitionChallenge,
	getChallengeRange,
	isExpired,
	type ChallengeStatus
} from '$lib/challenge-rules';
import { notify } from './notification-store';
import { sendEmail, type EmailEnv } from './email';
import { challengeReceivedEmail } from '$lib/notifications';
import { loadPlayerNames } from './play-requests';

export type RankedPlayer = {
	playerId: string;
	handle: string;
	name: string;
	rank: number;
	rating: number;
	claimed: boolean;
	lastMatchAt: string | null;
};

/**
 * Die Rangliste eines Vereins in Ranglisten-Reihenfolge. Bewusst über die
 * View club_leaderboard statt über players — dort ist die Maskierung
 * unbeanspruchter Namen und der profile_public-Filter schon drin.
 */
export async function loadClubRanking(
	sb: SupabaseClient,
	clubId: string
): Promise<RankedPlayer[]> {
	const { data, error } = await sb
		.from('club_leaderboard')
		.select('player_id, handle, name, rating, claimed, last_match_at')
		.eq('club_id', clubId)
		.order('rating', { ascending: false })
		.order('matches', { ascending: false });

	if (error || !data) return [];

	return data.map((row, i) => ({
		playerId: row.player_id,
		handle: row.handle,
		name: row.name,
		rank: i + 1,
		rating: Number(row.rating),
		claimed: row.claimed,
		lastMatchAt: row.last_match_at
	}));
}

/** Inaktiv = seit über 90 Tagen kein Match. Solche Spieler sind nicht herausforderbar. */
const INACTIVE_AFTER_DAYS = 90;

function isInactive(lastMatchAt: string | null, now: Date): boolean {
	if (!lastMatchAt) return true;
	return (now.getTime() - new Date(lastMatchAt).getTime()) / 86_400_000 > INACTIVE_AFTER_DAYS;
}

export type ChallengeableTarget = RankedPlayer & { placesAbove: number };

export type ChallengeableResult = {
	myRank: number | null;
	totalPlayers: number;
	rangeStart: number | null;
	rangeEnd: number | null;
	targets: ChallengeableTarget[];
	activeOutgoing: number;
	maxOutgoing: number;
};

export async function getChallengeablePlayers(
	admin: SupabaseClient,
	playerId: string,
	clubId: string
): Promise<ChallengeableResult> {
	const now = new Date();
	const ranking = await loadClubRanking(admin, clubId);
	const me = ranking.find((r) => r.playerId === playerId);

	const empty: ChallengeableResult = {
		myRank: me?.rank ?? null,
		totalPlayers: ranking.length,
		rangeStart: null,
		rangeEnd: null,
		targets: [],
		activeOutgoing: 0,
		maxOutgoing: MAX_ACTIVE_OUTGOING_CHALLENGES
	};

	if (!me) return empty;

	const range = getChallengeRange(me.rank, ranking.length);
	const [{ count: activeOutgoing }, { data: openRows }] = await Promise.all([
		admin
			.from('challenges')
			.select('id', { count: 'exact', head: true })
			.eq('challenger_id', playerId)
			.in('status', ['pending', 'accepted']),
		admin
			.from('challenges')
			.select('challenged_player_id')
			.eq('challenger_id', playerId)
			.in('status', ['pending', 'accepted'])
	]);

	const alreadyOpen = new Set((openRows ?? []).map((r) => r.challenged_player_id));

	if (range.startRank === null || range.endRank === null) {
		return { ...empty, activeOutgoing: activeOutgoing ?? 0 };
	}

	const targets = ranking
		.filter((p) => p.rank >= range.startRank! && p.rank <= range.endRank!)
		.filter((p) => p.playerId !== playerId)
		// Unbeanspruchte Profile können sich nicht einloggen und damit auch
		// nicht antworten — eine Challenge dorthin liefe garantiert ins Leere.
		.filter((p) => p.claimed)
		.filter((p) => !isInactive(p.lastMatchAt, now))
		.filter((p) => !alreadyOpen.has(p.playerId))
		.map((p) => ({ ...p, placesAbove: me.rank - p.rank }));

	return {
		myRank: me.rank,
		totalPlayers: ranking.length,
		rangeStart: range.startRank,
		rangeEnd: range.endRank,
		targets,
		activeOutgoing: activeOutgoing ?? 0,
		maxOutgoing: MAX_ACTIVE_OUTGOING_CHALLENGES
	};
}

export type Challenge = {
	id: string;
	direction: 'incoming' | 'outgoing';
	counterpartId: string;
	counterpartHandle: string;
	counterpartName: string;
	challengerRank: number;
	challengedRank: number;
	proposedTimeSlots: { date: string; startTime: string; endTime: string }[];
	selectedTimeSlot: { date: string; startTime: string; endTime: string } | null;
	message: string | null;
	status: ChallengeStatus;
	expiresAt: string;
	resultMatchId: string | null;
	createdAt: string;
};

type ChallengeRow = {
	id: string;
	challenger_id: string;
	challenged_player_id: string;
	club_id: string;
	challenger_rank_at_creation: number;
	challenged_rank_at_creation: number;
	proposed_time_slots: { date: string; startTime: string; endTime: string }[] | null;
	selected_time_slot: { date: string; startTime: string; endTime: string } | null;
	message: string | null;
	status: ChallengeStatus;
	expires_at: string;
	result_match_id: string | null;
	created_at: string;
};

const CHALLENGE_COLUMNS =
	'id, challenger_id, challenged_player_id, club_id, challenger_rank_at_creation, challenged_rank_at_creation, proposed_time_slots, selected_time_slot, message, status, expires_at, result_match_id, created_at';

export async function getChallenges(
	supabase: SupabaseClient,
	admin: SupabaseClient,
	playerId: string
): Promise<{ incoming: Challenge[]; outgoing: Challenge[] }> {
	const { data, error } = await supabase
		.from('challenges')
		.select(CHALLENGE_COLUMNS)
		.order('created_at', { ascending: false })
		.limit(100);

	if (error || !data) return { incoming: [], outgoing: [] };

	const rows = data as unknown as ChallengeRow[];
	const counterpartIds = [
		...new Set(
			rows.map((r) => (r.challenger_id === playerId ? r.challenged_player_id : r.challenger_id))
		)
	];
	const names = await loadPlayerNames(admin, counterpartIds);

	const toChallenge = (row: ChallengeRow): Challenge => {
		const outgoing = row.challenger_id === playerId;
		const counterpartId = outgoing ? row.challenged_player_id : row.challenger_id;
		const counterpart = names.get(counterpartId);

		return {
			id: row.id,
			direction: outgoing ? 'outgoing' : 'incoming',
			counterpartId,
			counterpartHandle: counterpart?.handle ?? '',
			counterpartName: counterpart?.name ?? 'Unbekannt',
			challengerRank: row.challenger_rank_at_creation,
			challengedRank: row.challenged_rank_at_creation,
			proposedTimeSlots: row.proposed_time_slots ?? [],
			selectedTimeSlot: row.selected_time_slot,
			message: row.message,
			status: row.status,
			expiresAt: row.expires_at,
			resultMatchId: row.result_match_id,
			createdAt: row.created_at
		};
	};

	return {
		incoming: rows.filter((r) => r.challenged_player_id === playerId).map(toChallenge),
		outgoing: rows.filter((r) => r.challenger_id === playerId).map(toChallenge)
	};
}

export type ChallengeInput = {
	challengedPlayerId: string;
	clubId: string;
	proposedTimeSlots: { date: string; startTime: string; endTime: string }[];
	message?: string | null;
};

export type ChallengeResult = { ok: true; id: string } | { ok: false; message: string };
export type ActionResult = { ok: true } | { ok: false; message: string };

const MAX_MESSAGE_LENGTH = 500;
const MAX_TIME_SLOTS = 5;

function cleanSlots(slots: ChallengeInput['proposedTimeSlots']) {
	const today = new Date().toISOString().slice(0, 10);
	return slots
		.filter(
			(s) =>
				/^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
				/^([01]\d|2[0-3]):[0-5]\d$/.test(s.startTime) &&
				/^([01]\d|2[0-3]):[0-5]\d$/.test(s.endTime) &&
				s.endTime > s.startTime &&
				s.date >= today
		)
		.slice(0, MAX_TIME_SLOTS);
}

export async function createChallenge(
	admin: SupabaseClient,
	challengerId: string,
	input: ChallengeInput,
	notifyCtx?: { emailEnv: EmailEnv | null; baseUrl: string; challengerName: string }
): Promise<ChallengeResult> {
	if (challengerId === input.challengedPlayerId) {
		return { ok: false, message: 'Du kannst dich nicht selbst herausfordern.' };
	}

	const ranking = await loadClubRanking(admin, input.clubId);
	const me = ranking.find((r) => r.playerId === challengerId);
	const target = ranking.find((r) => r.playerId === input.challengedPlayerId);

	if (!me) return { ok: false, message: 'Du bist kein Mitglied dieser Rangliste.' };
	if (!target) return { ok: false, message: 'Dieser Spieler ist nicht in dieser Rangliste.' };
	if (!target.claimed) {
		return { ok: false, message: 'Dieser Spieler hat sein Profil noch nicht übernommen.' };
	}
	if (isInactive(target.lastMatchAt, new Date())) {
		return { ok: false, message: 'Dieser Spieler ist derzeit nicht aktiv.' };
	}

	const [{ count: activeOutgoing }, { data: openAgainstTarget }, { data: lastDeclined }] =
		await Promise.all([
			admin
				.from('challenges')
				.select('id', { count: 'exact', head: true })
				.eq('challenger_id', challengerId)
				.in('status', ['pending', 'accepted']),
			admin
				.from('challenges')
				.select('id')
				.eq('challenger_id', challengerId)
				.eq('challenged_player_id', input.challengedPlayerId)
				.in('status', ['pending', 'accepted'])
				.limit(1),
			admin
				.from('challenges')
				.select('updated_at')
				.eq('challenger_id', challengerId)
				.eq('challenged_player_id', input.challengedPlayerId)
				.eq('status', 'declined')
				.order('updated_at', { ascending: false })
				.limit(1)
				.maybeSingle()
		]);

	const eligibility = canChallenge({
		challengerRank: me.rank,
		challengedRank: target.rank,
		totalPlayers: ranking.length,
		activeOutgoingChallenges: activeOutgoing ?? 0,
		hasOpenChallengeAgainstTarget: (openAgainstTarget?.length ?? 0) > 0,
		lastDeclinedAt: lastDeclined?.updated_at ?? null
	});
	if (!eligibility.ok) return eligibility;

	const slots = cleanSlots(input.proposedTimeSlots);
	if (slots.length === 0) {
		return { ok: false, message: 'Bitte mindestens einen gültigen Terminvorschlag angeben.' };
	}

	const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_DAYS * 86_400_000).toISOString();

	const { data, error } = await admin
		.from('challenges')
		.insert({
			challenger_id: challengerId,
			challenged_player_id: input.challengedPlayerId,
			club_id: input.clubId,
			challenger_rank_at_creation: me.rank,
			challenged_rank_at_creation: target.rank,
			proposed_time_slots: slots,
			message: (input.message ?? '').trim().slice(0, MAX_MESSAGE_LENGTH) || null,
			expires_at: expiresAt
		})
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			return { ok: false, message: 'Gegen diesen Spieler läuft bereits eine Challenge.' };
		}
		return { ok: false, message: error.message };
	}

	await notifyChallengeReceived(admin, {
		targetId: input.challengedPlayerId,
		challengerName: notifyCtx?.challengerName ?? 'Ein Spieler',
		challengerRank: me.rank,
		targetRank: target.rank,
		emailEnv: notifyCtx?.emailEnv ?? null,
		baseUrl: notifyCtx?.baseUrl ?? ''
	});

	return { ok: true, id: data.id };
}

async function loadChallengeForTransition(
	admin: SupabaseClient,
	challengeId: string,
	playerId: string,
	role: 'challenger' | 'challenged',
	target: ChallengeStatus
): Promise<{ ok: true; row: ChallengeRow } | { ok: false; message: string }> {
	const { data, error } = await admin
		.from('challenges')
		.select(CHALLENGE_COLUMNS)
		.eq('id', challengeId)
		.maybeSingle();

	if (error) return { ok: false, message: error.message };
	if (!data) return { ok: false, message: 'Challenge nicht gefunden.' };

	const row = data as unknown as ChallengeRow;
	const allowedId = role === 'challenger' ? row.challenger_id : row.challenged_player_id;
	if (allowedId !== playerId) return { ok: false, message: 'Challenge nicht gefunden.' };

	if (!canTransitionChallenge(row.status, target)) {
		return { ok: false, message: 'Diese Challenge kann nicht mehr geändert werden.' };
	}
	if (row.status === 'pending' && target !== 'expired' && isExpired(row.expires_at)) {
		return { ok: false, message: 'Diese Challenge ist abgelaufen.' };
	}

	return { ok: true, row };
}

async function setChallengeStatus(
	admin: SupabaseClient,
	challengeId: string,
	from: ChallengeStatus,
	to: ChallengeStatus,
	extra: Record<string, unknown> = {}
): Promise<boolean> {
	const { data } = await admin
		.from('challenges')
		.update({ status: to, updated_at: new Date().toISOString(), ...extra })
		.eq('id', challengeId)
		.eq('status', from)
		.select('id');

	return (data?.length ?? 0) > 0;
}

export async function acceptChallenge(
	admin: SupabaseClient,
	challengeId: string,
	playerId: string,
	accepterName: string,
	selectedSlotIndex: number
): Promise<ActionResult> {
	const loaded = await loadChallengeForTransition(admin, challengeId, playerId, 'challenged', 'accepted');
	if (!loaded.ok) return loaded;

	const slots = loaded.row.proposed_time_slots ?? [];
	const selected = slots[selectedSlotIndex];
	if (!selected) return { ok: false, message: 'Bitte einen der vorgeschlagenen Termine auswählen.' };

	if (!(await setChallengeStatus(admin, challengeId, 'pending', 'accepted', { selected_time_slot: selected }))) {
		return { ok: false, message: 'Diese Challenge wurde bereits beantwortet.' };
	}

	await notify(admin, {
		playerId: loaded.row.challenger_id,
		kind: 'challenge_accepted',
		title: `${accepterName} nimmt deine Challenge an`,
		body: `${selected.date}, ${selected.startTime}–${selected.endTime}. Meldet das Ergebnis als „PadelIndex Challenge".`,
		link: '/challenges'
	});

	return { ok: true };
}

export async function declineChallenge(
	admin: SupabaseClient,
	challengeId: string,
	playerId: string,
	declinerName: string
): Promise<ActionResult> {
	const loaded = await loadChallengeForTransition(admin, challengeId, playerId, 'challenged', 'declined');
	if (!loaded.ok) return loaded;

	if (!(await setChallengeStatus(admin, challengeId, 'pending', 'declined'))) {
		return { ok: false, message: 'Diese Challenge wurde bereits beantwortet.' };
	}

	await notify(admin, {
		playerId: loaded.row.challenger_id,
		kind: 'challenge_declined',
		title: `${declinerName} hat deine Challenge abgelehnt`,
		link: '/challenges'
	});

	return { ok: true };
}

export async function cancelChallenge(
	admin: SupabaseClient,
	challengeId: string,
	playerId: string
): Promise<ActionResult> {
	const loaded = await loadChallengeForTransition(admin, challengeId, playerId, 'challenger', 'cancelled');
	if (!loaded.ok) return loaded;

	if (!(await setChallengeStatus(admin, challengeId, loaded.row.status, 'cancelled'))) {
		return { ok: false, message: 'Diese Challenge wurde bereits geändert.' };
	}
	return { ok: true };
}

/**
 * Verknüpft ein gemeldetes Match mit der Challenge und schließt sie ab.
 * Bewusst KEIN Rating-Eingriff — das Rating läuft vollständig über
 * apply_match_rating (0002); die Challenge dokumentiert nur, dass dieses
 * Match ihr Ergebnis war.
 */
export async function completeChallengeWithMatch(
	admin: SupabaseClient,
	challengeId: string,
	playerId: string,
	matchId: string
): Promise<ActionResult> {
	const { data } = await admin
		.from('challenges')
		.select('id, challenger_id, challenged_player_id, status')
		.eq('id', challengeId)
		.maybeSingle();

	if (!data) return { ok: false, message: 'Challenge nicht gefunden.' };
	if (data.challenger_id !== playerId && data.challenged_player_id !== playerId) {
		return { ok: false, message: 'Challenge nicht gefunden.' };
	}
	if (!canTransitionChallenge(data.status as ChallengeStatus, 'completed')) {
		return { ok: false, message: 'Nur angenommene Challenges können abgeschlossen werden.' };
	}

	// Beide Beteiligten müssen wirklich in diesem Match gespielt haben —
	// sonst ließe sich ein beliebiges fremdes Match anhängen.
	const { data: participants } = await admin
		.from('match_participants')
		.select('player_id')
		.eq('match_id', matchId);

	const ids = new Set((participants ?? []).map((p) => p.player_id));
	if (!ids.has(data.challenger_id) || !ids.has(data.challenged_player_id)) {
		return { ok: false, message: 'In diesem Match haben nicht beide Challenge-Beteiligten gespielt.' };
	}

	if (!(await setChallengeStatus(admin, challengeId, 'accepted', 'completed', { result_match_id: matchId }))) {
		return { ok: false, message: 'Diese Challenge wurde bereits abgeschlossen.' };
	}
	return { ok: true };
}

async function notifyChallengeReceived(
	admin: SupabaseClient,
	input: {
		targetId: string;
		challengerName: string;
		challengerRank: number;
		targetRank: number;
		emailEnv: EmailEnv | null;
		baseUrl: string;
	}
): Promise<void> {
	await notify(admin, {
		playerId: input.targetId,
		kind: 'challenge_received',
		title: `${input.challengerName} fordert dich heraus`,
		body: `Platz ${input.challengerRank} gegen deinen Platz ${input.targetRank}.`,
		link: '/challenges'
	});

	if (!input.baseUrl) return;

	try {
		const { data: player } = await admin
			.from('players')
			.select('user_id')
			.eq('id', input.targetId)
			.maybeSingle();
		if (!player?.user_id) return;

		const { data: userRes } = await admin.auth.admin.getUserById(player.user_id);
		const address = userRes?.user?.email;
		if (!address) return;

		const { subject, html } = challengeReceivedEmail({
			challengerName: input.challengerName,
			challengerRank: input.challengerRank,
			yourRank: input.targetRank,
			url: `${input.baseUrl}/challenges`
		});
		await sendEmail(input.emailEnv, { to: address, subject, html });
	} catch (e) {
		console.error('E-Mail zur Challenge fehlgeschlagen', e);
	}
}

/** Wird vom bestehenden 15-Minuten-Cron aufgerufen (siehe api/cron/confirm-matches). */
export async function expireOldRequestsAndChallenges(
	admin: SupabaseClient
): Promise<{ expiredRequests: number; expiredChallenges: number; warned: number }> {
	const { data, error } = await admin.rpc('expire_stale_requests_and_challenges');
	if (error || !data) return { expiredRequests: 0, expiredChallenges: 0, warned: 0 };

	const result = data as {
		expired_requests: number;
		expired_challenges: number;
		expiring_soon: { challenge_id: string; challenged_player_id: string; expires_at: string }[];
	};

	let warned = 0;
	for (const soon of result.expiring_soon ?? []) {
		await notify(admin, {
			playerId: soon.challenged_player_id,
			kind: 'challenge_expiring',
			title: 'Eine Challenge läuft bald ab',
			body: 'Du hast noch weniger als 24 Stunden, um zu antworten.',
			link: '/challenges'
		});
		warned++;
	}

	return {
		expiredRequests: result.expired_requests ?? 0,
		expiredChallenges: result.expired_challenges ?? 0,
		warned
	};
}
