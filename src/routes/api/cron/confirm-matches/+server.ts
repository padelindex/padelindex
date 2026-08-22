// ============================================================
// PadelIndex — 48h-Auto-Bestätigung (per Supabase pg_cron aufgerufen)
// ============================================================
// @sveltejs/adapter-cloudflare generiert seinen Worker ohne scheduled()
// (überschreibt bei jedem Build unconditional, was auch immer wrangler.toml
// als `main` angibt — ein eigener Worker-Wrapper lässt sich also nicht
// dazwischenschieben). Deshalb läuft die 48h-Frist NICHT über einen
// Cloudflare Cron Trigger, sondern über Supabase selbst: pg_cron feuert
// alle 15 Minuten einen pg_net-HTTP-POST auf diese Route (siehe Migration
// 0007_auto_confirm_cron.sql). CRON_SECRET verhindert, dass Dritte den
// Endpoint von außen auslösen.
import { error, json } from '@sveltejs/kit';
import { requireServiceRole } from '$lib/server/env';
import { runConfirmCron } from '$lib/server/rating/confirm';
import { supabaseAdmin } from '$lib/server/supabase';
import { expireOldRequestsAndChallenges } from '$lib/server/challenges';

export const POST = async ({ request, platform }) => {
	const configuredSecret = (platform?.env as Record<string, unknown> | undefined)?.CRON_SECRET;
	const provided = request.headers.get('authorization');

	if (!configuredSecret || provided !== `Bearer ${configuredSecret}`) {
		throw error(401, 'Unauthorized');
	}

	const env = requireServiceRole(platform);
	const outcomes = await runConfirmCron({
		SUPABASE_URL: env.supabaseUrl,
		SUPABASE_SERVICE_ROLE_KEY: env.supabaseServiceRoleKey
	});

	// Läuft im selben 15-Minuten-Takt mit, statt einen zweiten Zeitplan
	// einzurichten: abgelaufene Spielanfragen/Challenges markieren und für
	// bald ablaufende Challenges erinnern. Ein Fehler hier darf die
	// Match-Bestätigung oben nicht nachträglich als fehlgeschlagen ausweisen.
	let expiry: unknown = null;
	try {
		expiry = await expireOldRequestsAndChallenges(supabaseAdmin(platform));
	} catch (e) {
		console.error('Ablauf-Lauf fehlgeschlagen', e);
		expiry = { error: (e as Error).message };
	}

	return json({ ok: true, outcomes, expiry });
};
