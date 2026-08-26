// ============================================================
// PadelIndex — Challenge-Regeln (reine Funktionen)
// ============================================================
// Wer darf wen herausfordern, wie viele Challenges gleichzeitig, wann
// wieder nach einer Absage. Keine Datenbankzugriffe — lib/server/
// challenges.ts lädt die Zahlen und ruft diese Funktionen auf.
//
// Grundsatz (siehe Migration 0013, Annahme 3): Eine Challenge tauscht
// NIEMALS Ranglistenplätze. Sie verschafft nur Zugang zu stärkeren Gegnern;
// das Ergebnis wirkt ausschließlich über die bestehende Rating-Logik.

export type ChallengeRangeConfig = {
	defaultPlacesAbove: number;
	maxPlacesAbove: number;
	minPlacesAbove: number;
	percentageOfLeaderboard: number;
};

export const CHALLENGE_RANGE_CONFIG: ChallengeRangeConfig = {
	defaultPlacesAbove: 10,
	maxPlacesAbove: 15,
	minPlacesAbove: 3,
	percentageOfLeaderboard: 0.2
};

/** Maximal gleichzeitig offene ausgehende Challenges pro Spieler. */
export const MAX_ACTIVE_OUTGOING_CHALLENGES = 3;

/** Nach einer Absage ist derselbe Gegner erst nach dieser Frist wieder herausforderbar. */
export const RECHALLENGE_COOLDOWN_DAYS = 14;

/** Challenges laufen nach dieser Frist automatisch ab (siehe expires_at-Default in 0013). */
export const CHALLENGE_EXPIRY_DAYS = 7;

export type ChallengeRange = {
	/** null = niemand herausforderbar (Rang 1 oder Rangliste zu klein). */
	startRank: number | null;
	endRank: number | null;
	placesAbove: number;
};

/**
 * Welche Ränge darf jemand auf Platz `rank` herausfordern?
 *
 * placesAbove = max(minPlacesAbove, ceil(totalPlayers * percentage)),
 * danach gedeckelt auf default/max. Der Deckel ist bewusst
 * min(default, max) und nicht nur max: in einer großen Rangliste wären 20 %
 * sonst weit mehr als die gewollten 10 Plätze.
 */
export function getChallengeRange(
	rank: number,
	totalPlayers: number,
	config: ChallengeRangeConfig = CHALLENGE_RANGE_CONFIG
): ChallengeRange {
	if (!Number.isFinite(rank) || rank <= 1 || totalPlayers <= 1) {
		return { startRank: null, endRank: null, placesAbove: 0 };
	}

	const byPercentage = Math.ceil(totalPlayers * config.percentageOfLeaderboard);
	let placesAbove = Math.max(config.minPlacesAbove, byPercentage);
	placesAbove = Math.min(placesAbove, config.defaultPlacesAbove, config.maxPlacesAbove);

	const endRank = rank - 1;
	const startRank = Math.max(1, rank - placesAbove);

	return { startRank, endRank, placesAbove };
}

/** Liegt `targetRank` in der erlaubten Range von `rank`? */
export function isRankChallengeable(
	rank: number,
	targetRank: number,
	totalPlayers: number,
	config: ChallengeRangeConfig = CHALLENGE_RANGE_CONFIG
): boolean {
	const range = getChallengeRange(rank, totalPlayers, config);
	if (range.startRank === null || range.endRank === null) return false;
	return targetRank >= range.startRank && targetRank <= range.endRank;
}

export type ChallengeEligibilityInput = {
	challengerRank: number;
	challengedRank: number;
	totalPlayers: number;
	activeOutgoingChallenges: number;
	/** Gibt es bereits eine offene (pending/accepted) Challenge gegen genau diesen Gegner? */
	hasOpenChallengeAgainstTarget: boolean;
	/** Zeitpunkt der letzten Absage DIESES Gegners, falls vorhanden. */
	lastDeclinedAt?: string | null;
	/** Gegner hat sich als nicht challengebereit markiert bzw. wurde so markiert. */
	targetAcceptsChallenges?: boolean;
	now?: Date;
	config?: ChallengeRangeConfig;
};

export type EligibilityResult = { ok: true } | { ok: false; message: string };

export function canChallenge(input: ChallengeEligibilityInput): EligibilityResult {
	const config = input.config ?? CHALLENGE_RANGE_CONFIG;
	const now = input.now ?? new Date();

	if (input.challengerRank === input.challengedRank) {
		return { ok: false, message: 'Du kannst dich nicht selbst herausfordern.' };
	}
	if (input.challengedRank > input.challengerRank) {
		return { ok: false, message: 'Du kannst nur höher platzierte Spieler herausfordern.' };
	}
	if (input.challengerRank <= 1) {
		return { ok: false, message: 'Als Erstplatzierter kannst du niemanden herausfordern.' };
	}

	if (!isRankChallengeable(input.challengerRank, input.challengedRank, input.totalPlayers, config)) {
		const range = getChallengeRange(input.challengerRank, input.totalPlayers, config);
		return {
			ok: false,
			message:
				range.startRank === null
					? 'Für dich ist aktuell niemand herausforderbar.'
					: `Du kannst nur die Plätze ${range.startRank} bis ${range.endRank} herausfordern.`
		};
	}

	if (input.hasOpenChallengeAgainstTarget) {
		return { ok: false, message: 'Gegen diesen Spieler läuft bereits eine Challenge.' };
	}

	if (input.activeOutgoingChallenges >= MAX_ACTIVE_OUTGOING_CHALLENGES) {
		return {
			ok: false,
			message: `Du hast bereits ${MAX_ACTIVE_OUTGOING_CHALLENGES} offene Challenges. Warte, bis eine davon beantwortet ist.`
		};
	}

	if (input.targetAcceptsChallenges === false) {
		return { ok: false, message: 'Dieser Spieler nimmt derzeit keine Challenges an.' };
	}

	if (input.lastDeclinedAt) {
		const daysSince = (now.getTime() - new Date(input.lastDeclinedAt).getTime()) / 86_400_000;
		if (daysSince < RECHALLENGE_COOLDOWN_DAYS) {
			const wait = Math.ceil(RECHALLENGE_COOLDOWN_DAYS - daysSince);
			return {
				ok: false,
				message: `Dieser Spieler hat kürzlich abgelehnt. Erneut möglich in ${wait} Tag(en).`
			};
		}
	}

	return { ok: true };
}

export type ChallengeStatus =
	| 'pending'
	| 'accepted'
	| 'declined'
	| 'cancelled'
	| 'expired'
	| 'completed';

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
	pending: 'Offen',
	accepted: 'Angenommen',
	declined: 'Abgelehnt',
	cancelled: 'Zurückgezogen',
	expired: 'Abgelaufen',
	completed: 'Gespielt'
};

/**
 * Erlaubte Statusübergänge. Alles, was hier nicht steht, wird serverseitig
 * abgelehnt — insbesondere jeder Übergang AUS einem Endzustand heraus
 * ("abgelaufene Challenge kann nicht angenommen werden").
 */
const CHALLENGE_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
	pending: ['accepted', 'declined', 'cancelled', 'expired'],
	accepted: ['completed', 'cancelled'],
	declined: [],
	cancelled: [],
	expired: [],
	completed: []
};

export function canTransitionChallenge(from: ChallengeStatus, to: ChallengeStatus): boolean {
	return CHALLENGE_TRANSITIONS[from]?.includes(to) ?? false;
}

export type PlayRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export const PLAY_REQUEST_STATUS_LABELS: Record<PlayRequestStatus, string> = {
	pending: 'Offen',
	accepted: 'Angenommen',
	declined: 'Abgelehnt',
	cancelled: 'Zurückgezogen',
	expired: 'Abgelaufen'
};

const PLAY_REQUEST_TRANSITIONS: Record<PlayRequestStatus, PlayRequestStatus[]> = {
	pending: ['accepted', 'declined', 'cancelled', 'expired'],
	accepted: [],
	declined: [],
	cancelled: [],
	expired: []
};

export function canTransitionPlayRequest(from: PlayRequestStatus, to: PlayRequestStatus): boolean {
	return PLAY_REQUEST_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Abgelaufen ist abgelaufen — auch wenn der Cron-Lauf noch nicht durch ist. */
export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
	return new Date(expiresAt).getTime() <= now.getTime();
}

/**
 * Verhindert sofortiges erneutes Anfragen an dieselbe Person nach einer
 * Ablehnung. Ohne das blockiert play_requests_one_open_idx (0013) nur
 * eine ZWEITE OFFENE Anfrage gleichzeitig — eine Kette aus
 * Anfrage -> Ablehnung -> sofort neue Anfrage -> ... bliebe beliebig oft
 * möglich (Spam-/Belästigungsvektor). Kürzer als
 * RECHALLENGE_COOLDOWN_DAYS bei Challenges: eine Spielanfrage ist ein
 * einzelner, formloser Terminvorschlag, keine Rangfolge-Challenge.
 */
export const PLAY_REQUEST_RESEND_COOLDOWN_HOURS = 24;

/** 0 = keine Sperre (mehr); sonst die noch verbleibenden ganzen Stunden. */
export function playRequestResendCooldownHoursLeft(
	lastDeclinedAt: string | null,
	now: Date = new Date()
): number {
	if (!lastDeclinedAt) return 0;
	const hoursSince = (now.getTime() - new Date(lastDeclinedAt).getTime()) / 3_600_000;
	return Math.max(0, Math.ceil(PLAY_REQUEST_RESEND_COOLDOWN_HOURS - hoursSince));
}
