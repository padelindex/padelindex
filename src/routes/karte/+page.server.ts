// Öffentliche Deutschlandkarte der Padel-Anlagen. Läuft über den
// öffentlichen Client — padel_venues ist per RLS für alle lesbar, hier
// gibt es nichts zu anonymisieren (Betriebsstätten, keine Personen).

import type { PageServerLoad } from './$types';
import { supabasePublic } from '$lib/server/supabase';
import { loadVenueDirectory } from '$lib/server/venues';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	const directory = await loadVenueDirectory(supabasePublic(platform));

	// Das Verzeichnis ändert sich selten (Import, neuer Partner) — am Edge
	// zwischenspeichern und im Hintergrund erneuern, statt jede Anfrage
	// bis zur Datenbank durchzureichen.
	setHeaders({ 'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' });

	return directory;
};
