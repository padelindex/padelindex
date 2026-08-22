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
import { abbreviateName, matchClaimName, type NameCandidate } from '$lib/claim-match';
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
