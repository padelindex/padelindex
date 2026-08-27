// ============================================================
// PadelIndex — CSP-Report-Only-Sammelstelle
// ============================================================
// Nimmt die Verstoß-Reports entgegen, die Browser wegen
// content-security-policy-report-only (siehe svelte.config.js) senden,
// solange die CSP noch nicht scharf geschaltet ist. Loggt nur — kein
// Speicherbedarf für ein paar Wochen Rollout-Beobachtung, die
// Cloudflare-Worker-Logs reichen, um vor dem Umschalten auf eine
// enforced CSP zu sehen, ob irgendetwas fälschlich geblockt würde.
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		console.warn('CSP report-only violation', body);
	} catch {
		// Ein unlesbarer Report darf den Browser nicht mit einem Fehler verwirren.
	}
	return new Response(null, { status: 204 });
};
