// ============================================================
// PadelIndex — E-Mail-Inhalte (reine Funktionen)
// ============================================================
// Nimmt bereits aufgelöste, maskierte Namen entgegen (siehe
// abbreviateName in claim-match.ts) — keine eigenen Datenbankzugriffe,
// deshalb ohne Mock einfach testbar. Namen kommen aus frei wählbaren
// Anzeigenamen, deshalb escapeHtml() vor jedem Einsetzen ins HTML.

export type SetScore = { team1Games: number; team2Games: number };

export type MatchReportedInput = {
	reporterName: string;
	partnerName: string;
	sets: SetScore[];
	kontoUrl: string;
};

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function formatScore(sets: SetScore[]): string {
	return sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ');
}

export type PlayRequestEmailInput = {
	senderName: string;
	date: string;
	startTime: string;
	endTime: string;
	url: string;
};

export function playRequestEmail(input: PlayRequestEmailInput): { subject: string; html: string } {
	const when = `${formatGermanDate(input.date)}, ${input.startTime}–${input.endTime}`;
	return {
		subject: `Neue Spielanfrage von ${input.senderName} — PadelIndex`,
		html: `
			<p><strong>${escapeHtml(input.senderName)}</strong> möchte mit dir spielen:</p>
			<p>${escapeHtml(when)}</p>
			<p><a href="${input.url}">Anfrage ansehen</a></p>
		`.trim()
	};
}

export type ChallengeEmailInput = {
	challengerName: string;
	challengerRank: number;
	yourRank: number;
	url: string;
};

export function challengeReceivedEmail(input: ChallengeEmailInput): {
	subject: string;
	html: string;
} {
	return {
		subject: `${input.challengerName} fordert dich heraus — PadelIndex`,
		html: `
			<p><strong>${escapeHtml(input.challengerName)}</strong> (Platz ${input.challengerRank}) fordert dich als Platz ${input.yourRank} heraus.</p>
			<p>Nimmst du an? Die Challenge läuft nach 7 Tagen automatisch ab.</p>
			<p><a href="${input.url}">Challenge ansehen</a></p>
		`.trim()
	};
}

export type PlayRequestAnsweredInput = {
	responderName: string;
	date: string;
	startTime: string;
	endTime: string;
	url: string;
};

export function playRequestAcceptedEmail(input: PlayRequestAnsweredInput): {
	subject: string;
	html: string;
} {
	const when = `${formatGermanDate(input.date)}, ${input.startTime}–${input.endTime}`;
	return {
		subject: `${input.responderName} hat deine Spielanfrage angenommen — PadelIndex`,
		html: `
			<p><strong>${escapeHtml(input.responderName)}</strong> hat deine Spielanfrage angenommen:</p>
			<p>${escapeHtml(when)}</p>
			<p>Meldet das Ergebnis danach wie gewohnt über „Match melden".</p>
			<p><a href="${input.url}">Anfrage ansehen</a></p>
		`.trim()
	};
}

export function playRequestDeclinedEmail(input: { responderName: string; url: string }): {
	subject: string;
	html: string;
} {
	return {
		subject: `${input.responderName} hat deine Spielanfrage abgelehnt — PadelIndex`,
		html: `
			<p><strong>${escapeHtml(input.responderName)}</strong> hat deine Spielanfrage leider abgelehnt.</p>
			<p><a href="${input.url}">Neue Vorschläge ansehen</a></p>
		`.trim()
	};
}

export type ChallengeAcceptedEmailInput = {
	accepterName: string;
	date: string;
	startTime: string;
	endTime: string;
	url: string;
};

export function challengeAcceptedEmail(input: ChallengeAcceptedEmailInput): {
	subject: string;
	html: string;
} {
	const when = `${formatGermanDate(input.date)}, ${input.startTime}–${input.endTime}`;
	return {
		subject: `${input.accepterName} nimmt deine Challenge an — PadelIndex`,
		html: `
			<p><strong>${escapeHtml(input.accepterName)}</strong> nimmt deine Challenge an. Vereinbarter Termin:</p>
			<p>${escapeHtml(when)}</p>
			<p>Meldet das Ergebnis danach als „PadelIndex Challenge" — sobald es bestätigt ist, zählt es für die Challenge.</p>
			<p><a href="${input.url}">Challenge ansehen</a></p>
		`.trim()
	};
}

export function challengeDeclinedEmail(input: { declinerName: string; url: string }): {
	subject: string;
	html: string;
} {
	return {
		subject: `${input.declinerName} hat deine Challenge abgelehnt — PadelIndex`,
		html: `
			<p><strong>${escapeHtml(input.declinerName)}</strong> hat deine Challenge leider abgelehnt.</p>
			<p><a href="${input.url}">Zur Rangliste</a></p>
		`.trim()
	};
}

/** ISO-Datum -> "13.04.2026". Fällt bei Unsinn auf die Eingabe zurück, statt "Invalid Date" zu zeigen. */
function formatGermanDate(isoDate: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
	const [y, m, d] = isoDate.split('-');
	return `${d}.${m}.${y}`;
}

export type DelistingConfirmInput = { playerName: string; confirmUrl: string };

export function delistingConfirmEmail(input: DelistingConfirmInput): { subject: string; html: string } {
	return {
		subject: 'Bestätige, dass dein Profil aus der Rangliste soll — PadelIndex',
		html: `
			<p>Jemand hat für das Profil „${escapeHtml(input.playerName)}" auf PadelIndex angefragt, es aus der öffentlichen Rangliste zu nehmen.</p>
			<p>Wenn das dein Profil ist und du das möchtest, bestätige das hier — das Profil verschwindet danach sofort aus der öffentlichen Ansicht:</p>
			<p><a href="${input.confirmUrl}">Profil aus der Rangliste nehmen</a></p>
			<p>Wenn du das nicht angefragt hast, kannst du diese E-Mail einfach ignorieren — es passiert dann nichts.</p>
		`.trim()
	};
}

export function matchReportedEmail(input: MatchReportedInput): { subject: string; html: string } {
	const score = formatScore(input.sets);
	const reporterName = escapeHtml(input.reporterName);
	const partnerName = escapeHtml(input.partnerName);

	return {
		subject: `Neues Match zur Bestätigung (${score}) — PadelIndex`,
		html: `
			<p>${reporterName} und ${partnerName} haben ein Match gegen dich gemeldet: <strong>${escapeHtml(score)}</strong>.</p>
			<p>Wenn du nicht widersprichst, wird das Ergebnis nach 48 Stunden automatisch gewertet.</p>
			<p><a href="${input.kontoUrl}">Jetzt bestätigen oder ablehnen</a></p>
		`.trim()
	};
}
