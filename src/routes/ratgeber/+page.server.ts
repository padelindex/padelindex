// ============================================================
// PadelIndex — /ratgeber (Übersicht)
// ============================================================
// Content ist lokal (src/lib/content/guides/{de,en,es}.ts, kein CMS) —
// der load lädt bewusst trotzdem über einen eigenen Server-Endpunkt statt
// per direktem Import in der Komponente, damit Suchbegriffe künftig auch
// serverseitig gefiltert werden könnten, ohne die Komponente anzufassen.

import type { PageServerLoad } from './$types';
import { guidesFor } from '$lib/guides';

export const load: PageServerLoad = ({ locals }) => {
	return { guides: guidesFor(locals.locale) };
};
