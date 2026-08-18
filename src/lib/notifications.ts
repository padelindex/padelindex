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
