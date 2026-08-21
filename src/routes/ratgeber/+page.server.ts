// ============================================================
// PadelIndex — /ratgeber (Übersicht)
// ============================================================
// Content ist lokal (guides-data.ts, kein CMS) — der load lädt bewusst
// trotzdem über einen eigenen Server-Endpunkt statt per direktem Import
// in der Komponente, damit Suchbegriffe künftig auch serverseitig
// gefiltert werden könnten, ohne die Komponente anzufassen.

import type { PageServerLoad } from './$types';
import { GUIDES } from '$lib/guides-data';

export const load: PageServerLoad = () => {
	return { guides: GUIDES };
};
