// ============================================================
// PadelIndex — Anlagen-Verzeichnis (Deutschlandkarte)
// ============================================================
// Liest padel_venues (0017) für /karte. Bewusst ohne Admin-Client:
// die Tabelle ist per RLS öffentlich lesbar, es gibt hier nichts zu
// anonymisieren — es sind Betriebsstätten, keine Personen.
//
// Partner-Status ist abgeleitet (club_id gesetzt), kein eigenes Feld —
// siehe Begründung in der Migration.

import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Venue = {
	id: string;
	name: string;
	city: string | null;
	postalCode: string | null;
	address: string | null;
	website: string | null;
	lat: number | null;
	lng: number | null;
	/** Nutzt diese Anlage PadelIndex? */
	isPartner: boolean;
	/** Nur für Partner: Link zur öffentlichen Vereinsseite. */
	clubSlug: string | null;
};

export type VenueDirectory = {
	venues: Venue[];
	/** Anlagen ohne Koordinaten erscheinen nicht auf der Karte — offen ausweisen. */
	unmappedCount: number;
	partnerCount: number;
};

type Row = {
	id: string;
	name: string;
	city: string | null;
	postal_code: string | null;
	address: string | null;
	website: string | null;
	latitude: number | string | null;
	longitude: number | string | null;
	club_id: string | null;
	clubs: { slug: string } | null;
};

/**
 * Das gesamte Verzeichnis. Kein Paging: die Karte braucht ohnehin alle
 * Punkte gleichzeitig, und bei realistischen Größenordnungen für
 * Deutschland (einige hundert Anlagen) ist das ein kleiner Payload.
 * Sollte das je vierstellig werden, wäre Clustering der nächste Schritt,
 * nicht Paging.
 */
export async function loadVenueDirectory(sb: SupabaseClient): Promise<VenueDirectory> {
	const { data, error: err } = await sb
		.from('padel_venues')
		.select('id, name, city, postal_code, address, website, latitude, longitude, club_id, clubs(slug)')
		.order('name');

	if (err) throw error(500, err.message);

	const venues: Venue[] = ((data ?? []) as unknown as Row[]).map((r) => ({
		id: r.id,
		name: r.name,
		city: r.city,
		postalCode: r.postal_code,
		address: r.address,
		website: normalizeWebsite(r.website),
		lat: r.latitude === null ? null : Number(r.latitude),
		lng: r.longitude === null ? null : Number(r.longitude),
		isPartner: r.club_id !== null,
		clubSlug: r.clubs?.slug ?? null
	}));

	return {
		venues,
		unmappedCount: venues.filter((v) => v.lat === null).length,
		partnerCount: venues.filter((v) => v.isPartner).length
	};
}

/**
 * Importierte Websites stehen mal mit, mal ohne Schema in den Daten.
 * Ohne Schema würde der Browser den Link relativ zu padelindex.de
 * auflösen — aus "example.de" würde padelindex.de/example.de.
 * Alles, was nicht sauber nach http(s) aussieht, fliegt raus, statt
 * einen kaputten Link anzuzeigen.
 */
function normalizeWebsite(raw: string | null): string | null {
	const value = raw?.trim();
	if (!value) return null;

	const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
	try {
		const url = new URL(withScheme);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		if (!url.hostname.includes('.')) return null;
		return url.toString();
	} catch {
		return null;
	}
}
