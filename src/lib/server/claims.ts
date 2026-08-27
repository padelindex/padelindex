// ============================================================
// PadelIndex — Profil beanspruchen (Serverseite)
// ============================================================
//
// Ablauf:
//   1. lookupClaimableProfile() — Spieler tippt seinen Namen, wir suchen
//      das unbeanspruchte Profil. Genau ein Treffer oder keiner.
//   2. startProfileClaim() — pending Claim + Magic Link an die E-Mail.
//   3. Beim ersten Login löst der Trigger handle_new_user() (siehe
//      0005_claimable_profiles.sql) den Claim ein und verknüpft das
//      BESTEHENDE Profil, statt ein zweites anzulegen.
//
// Der service_role-Client ist hier zwingend: die Klarnamen der
// importierten Profile sind für anon absichtlich nicht lesbar.

import { error } from '@sveltejs/kit';
import {
	abbreviateName,
	formatPlayerName,
	isUsableClaimQuery,
	matchClaimName,
	normalizeName,
	similarity,
	CLAIM_MATCH_THRESHOLD,
	type NameCandidate
} from '$lib/claim-match';
import { supabaseAdmin, supabasePublic } from './supabase';

export interface ClaimableProfile {
	handle: string;
	/** Abgekürzt — der volle Name wird nie zurückgegeben. */
	name: string;
	rating: number;
	matches: number;
}

interface PlayerRow {
	id: string;
	handle: string;
	display_name: string;
	rating: number | string;
	matches_played: number;
}

async function unclaimedRoster(slug: string, platform?: App.Platform): Promise<PlayerRow[]> {
	const sb = supabaseAdmin(platform);

	const { data: club, error: clubErr } = await sb
		.from('clubs')
		.select('id')
		.eq('slug', slug)
		.maybeSingle();

	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');

	const { data, error: rowsErr } = await sb
		.from('club_memberships')
		.select('players!inner(id, handle, display_name, rating, matches_played, claim_status)')
		.eq('club_id', club.id)
		.eq('players.claim_status', 'unclaimed');

	if (rowsErr) throw error(500, rowsErr.message);

	return (data ?? []).map((row) => (row as unknown as { players: PlayerRow }).players);
}

/**
 * Sucht das unbeanspruchte Profil zu einem eingetippten Namen.
 * Gibt bewusst nie eine Liste zurück — sonst wäre der Namensbestand
 * durchprobierbar.
 */
export async function lookupClaimableProfile(
	slug: string,
	name: string,
	platform?: App.Platform
): Promise<ClaimableProfile | null> {
	const roster = await unclaimedRoster(slug, platform);

	const candidates: (NameCandidate & { row: PlayerRow })[] = roster.map((row) => ({
		id: row.id,
		displayName: row.display_name,
		row
	}));

	const hit = matchClaimName(name, candidates);
	if (!hit) return null;

	const row = hit.match.row;
	return {
		handle: row.handle,
		name: abbreviateName(row.display_name),
		rating: Number(row.rating),
		matches: row.matches_played
	};
}

export type ClaimStartResult =
	| { ok: true; email: string }
	| { ok: false; reason: 'not_found' | 'already_claimed' | 'pending_exists' };

/**
 * Legt den Claim an und schickt den Magic Link. Der Claim wird erst beim
 * bestätigten Login wirksam — bis dahin bleibt das Profil unbeansprucht.
 */
export async function startProfileClaim(
	slug: string,
	handle: string,
	email: string,
	origin: string,
	platform?: App.Platform
): Promise<ClaimStartResult> {
	const sb = supabaseAdmin(platform);

	const { data: club, error: clubErr } = await sb
		.from('clubs')
		.select('id')
		.eq('slug', slug)
		.maybeSingle();
	if (clubErr) throw error(500, clubErr.message);
	if (!club) throw error(404, 'Verein nicht gefunden');

	// Profil muss zu diesem Verein gehören und noch frei sein
	const { data: rows, error: rowErr } = await sb
		.from('club_memberships')
		.select('players!inner(id, display_name, claim_status)')
		.eq('club_id', club.id)
		.eq('players.handle', handle);

	if (rowErr) throw error(500, rowErr.message);

	const player = (rows ?? [])
		.map(
			(r) =>
				(r as unknown as { players: { id: string; display_name: string; claim_status: string } })
					.players
		)
		.at(0);

	if (!player) return { ok: false, reason: 'not_found' };
	if (player.claim_status !== 'unclaimed') return { ok: false, reason: 'already_claimed' };

	const { error: insErr } = await sb.from('profile_claims').insert({
		player_id: player.id,
		email,
		requested_name: player.display_name
	});

	if (insErr) {
		// unique index profile_claims_one_pending_idx
		if (insErr.code === '23505') return { ok: false, reason: 'pending_exists' };
		throw error(500, insErr.message);
	}

	// Magic Link über den öffentlichen Client — Supabase legt den Auth-User
	// beim ersten Klick an, der Trigger löst dann den Claim ein.
	//
	// signInWithOtp() läuft hier server-seitig, ohne den Browser des
	// Spielers — deshalb bewusst KEIN PKCE-Redirect (dessen code_verifier
	// bräuchte denselben Cookie-Storage, den erst der spätere Klick auf den
	// Link hat). emailRedirectTo landet im E-Mail-Template als
	// {{ .RedirectTo }} und wird dort als next-Parameter an
	// /auth/confirm weitergereicht (token_hash-Flow, siehe dort).
	const { error: otpErr } = await supabasePublic(platform).auth.signInWithOtp({
		email,
		options: { shouldCreateUser: true, emailRedirectTo: `${origin}/konto` }
	});

	if (otpErr) throw error(502, `Magic Link konnte nicht gesendet werden: ${otpErr.message}`);

	return { ok: true, email };
}

// ============================================================
// PadelIndex — Registrierung: Namensabgleich gegen unbeanspruchte Profile
// ============================================================
// Andere Baustelle als lookupClaimableProfile() oben: dort gilt "genau ein
// Treffer oder keiner" (Selbstbedienungsseite, EIN Verein schon bekannt).
// Bei der Registrierung kennen wir den Verein nicht zuverlässig (clubName
// im Formular ist Freitext, keine Fremdschlüsselbeziehung) und wollen
// bewusst MEHRERE Kandidaten zeigen können (z.B. derselbe Name an zwei
// Vereinen) — ein Mensch entscheidet in der UI, nicht der Algorithmus.
// Deshalb ohne matchClaimName()s "Vorsprung vor dem Zweitplatzierten"-Regel,
// aber mit demselben Schwellwert (CLAIM_MATCH_THRESHOLD).

export type SignupClaimCandidate = {
	id: string;
	handle: string;
	/** Abgekürzt, wie überall sonst (formatPlayerName) — nie der volle Name. */
	name: string;
	clubName: string;
	clubSlug: string;
	rating: number;
	matches: number;
};

interface SignupCandidateRow {
	clubs: { name: string; slug: string } | null;
	players: {
		id: string;
		handle: string;
		display_name: string;
		rating: number | string;
		matches_played: number;
	};
}

/**
 * Sucht unbeanspruchte Profile, deren Name zum bei der Registrierung
 * eingetippten Namen passt — site-weit (nicht auf einen Verein beschränkt,
 * siehe oben). Zeigt dieselben Felder, die club_leaderboard
 * (0014_block0_privacy.sql) für unbeanspruchte Profile ohnehin öffentlich
 * zeigt: keine neue Exposition, nur derselbe Ausschnitt an einer zweiten
 * Stelle.
 */
export async function findClaimableProfilesByName(
	fullName: string,
	platform?: App.Platform
): Promise<SignupClaimCandidate[]> {
	if (!isUsableClaimQuery(fullName)) return [];

	const sb = supabaseAdmin(platform);
	const { data, error: err } = await sb
		.from('club_memberships')
		.select(
			'clubs(name, slug), players!inner(id, handle, display_name, rating, matches_played, claim_status)'
		)
		.eq('players.claim_status', 'unclaimed');

	if (err) throw error(500, err.message);

	const query = normalizeName(fullName);
	const seen = new Set<string>();
	const scored: { candidate: SignupClaimCandidate; score: number }[] = [];

	for (const row of (data ?? []) as unknown as SignupCandidateRow[]) {
		const p = row.players;
		if (!p || !row.clubs || seen.has(p.id)) continue;

		const score = similarity(query, normalizeName(p.display_name));
		if (score < CLAIM_MATCH_THRESHOLD) continue;

		seen.add(p.id);
		scored.push({
			score,
			candidate: {
				id: p.id,
				handle: p.handle,
				name: formatPlayerName(p.display_name, 'unclaimed', false),
				clubName: row.clubs.name,
				clubSlug: row.clubs.slug,
				rating: Number(p.rating),
				matches: p.matches_played
			}
		});
	}

	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, 5)
		.map((s) => s.candidate);
}

export type SignupClaimResult = { ok: true } | { ok: false; reason: 'pending_exists' };

/**
 * Legt direkt einen Claim an, ohne einen Magic Link zu verschicken — die
 * klassische Registrierung (signUp() gleich im Anschluss, siehe
 * routes/registrieren) übernimmt die E-Mail-Bestätigung selbst.
 * handle_new_user() (0019_password_auth.sql) verknüpft beim ersten Login
 * automatisch mit diesem Profil, genau wie beim Magic-Link-Claim oben —
 * KEINE Änderung am Trigger nötig, der Pfad "offener Claim für diese
 * E-Mail" existiert dort bereits.
 */
export async function createPendingClaimForSignup(
	playerId: string,
	email: string,
	requestedName: string,
	platform?: App.Platform
): Promise<SignupClaimResult> {
	const sb = supabaseAdmin(platform);

	const { error: insErr } = await sb.from('profile_claims').insert({
		player_id: playerId,
		email,
		requested_name: requestedName
	});

	if (insErr) {
		// unique index profile_claims_one_pending_idx
		if (insErr.code === '23505') return { ok: false, reason: 'pending_exists' };
		throw error(500, insErr.message);
	}

	return { ok: true };
}
