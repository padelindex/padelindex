// ============================================================
// PadelIndex — Vereins-Admin: Name & Akzentfarbe
// ============================================================
// Schreiben läuft über service_role wie überall in diesem Schema —
// die Autorisierung prüft der Aufrufer VOR jedem Call über
// isClubAdmin(), nie hier.

import type { SupabaseClient } from '@supabase/supabase-js';

export type ClubSettingsInput = {
	name: string;
	accent: string;
	/** null = löschen (Standort-Score fällt dann wieder auf "gleicher Verein" zurück, siehe lib/matchmaking.ts). */
	latitude: number | null;
	longitude: number | null;
};
export type ClubSettingsWriteResult = { ok: true } | { ok: false; message: string };

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function validateClubSettings(input: ClubSettingsInput): string | null {
	if (!input.name.trim()) return 'Vereinsname darf nicht leer sein.';
	if (input.name.length > 120) return 'Vereinsname ist zu lang.';
	if (!HEX_COLOR.test(input.accent)) return 'Akzentfarbe muss ein Hex-Code sein, z. B. #0F6E5C.';

	// Beide oder keine — ein halb gepflegter Standort wäre schlimmer als gar
	// keiner (distanceKm in lib/matchmaking.ts prüft ohnehin auf beide null).
	if ((input.latitude === null) !== (input.longitude === null)) {
		return 'Breiten- und Längengrad müssen beide gesetzt sein (oder beide leer).';
	}
	if (input.latitude !== null && (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90)) {
		return 'Breitengrad muss zwischen -90 und 90 liegen.';
	}
	if (input.longitude !== null && (!Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180)) {
		return 'Längengrad muss zwischen -180 und 180 liegen.';
	}

	return null;
}

export async function updateClubSettings(
	admin: SupabaseClient,
	clubId: string,
	input: ClubSettingsInput
): Promise<ClubSettingsWriteResult> {
	const validationError = validateClubSettings(input);
	if (validationError) return { ok: false, message: validationError };

	const { error } = await admin
		.from('clubs')
		.update({
			name: input.name.trim(),
			accent: input.accent,
			latitude: input.latitude,
			longitude: input.longitude
		})
		.eq('id', clubId);

	if (error) return { ok: false, message: error.message };
	return { ok: true };
}
