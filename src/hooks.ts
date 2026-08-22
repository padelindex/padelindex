/**
 * Copyright (c) 2025–2026 Alec Hahn / Sportcenter Hahn GmbH
 * All rights reserved.
 * Proprietary and confidential.
 * See LICENSE for details.
 */

// ============================================================
// PadelIndex — universeller Hook (läuft auf Client UND Server)
// ============================================================
// reroute() muss in einer eigenen src/hooks.ts stehen, nicht in
// hooks.server.ts: SvelteKit ruft ihn vor dem Routing sowohl im
// Browser (Client-Navigation) als auch auf dem Server auf. Er "delokalisiert"
// die angefragte URL (z. B. /en/ratgeber/x -> /ratgeber/x), bevor SvelteKit
// entscheidet, welche Routen-Datei zuständig ist — die Datei bleibt für
// alle drei Sprachen dieselbe, nur event.url (siehe hooks.server.ts)
// behält die ursprüngliche, lokalisierte URL für Meta-Tags/hreflang.

import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = ({ url }) => deLocalizeUrl(url).pathname;
