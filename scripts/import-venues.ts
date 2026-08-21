// ============================================================
// PadelIndex — Import fürs Anlagen-Verzeichnis (/karte)
// ============================================================
//
//   node scripts/run.mjs scripts/import-venues.ts <datei.csv|datei.json>
//
// Liest eine CSV- oder JSON-Datei mit Padel-Anlagen und schreibt
// supabase/seed-venues.local.sql — wie die übrigen Importe in diesem
// Projekt wird das erzeugte SQL von Hand im Supabase SQL Editor
// ausgeführt (siehe scripts/import-bavaro.ts).
//
// ERWARTETE SPALTEN (CSV-Kopfzeile) bzw. JSON-Schlüssel:
//   name        Pflicht
//   city        optional
//   postal_code optional
//   address     optional
//   website     optional
//   latitude    optional, Dezimalgrad (z. B. 47.9012)
//   longitude   optional, Dezimalgrad
//   source_ref  optional, aber dringend empfohlen — eine stabile Kennung
//               aus der Quelle (bei OSM z. B. "node/123456789").
//               Nur damit trifft ein erneuter Import dieselbe Zeile,
//               statt Dubletten anzulegen.
//
// OSM-EXPORT: eine Overpass-Abfrage wie
//   [out:json][timeout:180];
//   area["ISO3166-1"="DE"][admin_level=2]->.de;
//   nwr["sport"="padel"](area.de);
//   out tags center;
// liefert JSON, das dieses Skript direkt versteht (elements[] mit tags
// und lat/lon bzw. center) — siehe parseOverpass() unten.
//
// WAS DIESES SKRIPT NICHT TUT:
//   * Es geokodiert nicht. Adressen ohne Koordinaten werden importiert
//     und erscheinen auf /karte in der Liste, aber nicht auf der Karte —
//     die Seite weist die Zahl offen aus. Koordinaten zu schätzen wäre
//     schlimmer als sie wegzulassen.
//   * Es verknüpft nichts mit clubs. Wer Partner ist, entscheidet
//     padel_venues.club_id, und das wird bewusst von Hand gesetzt
//     (siehe unten, "Partner verknüpfen") — ein Namensabgleich würde
//     früher oder später den falschen Verein treffen.
//   * Es überschreibt keine Zeilen mit locked = true. Von Hand
//     korrigierte Einträge überleben damit jeden Re-Import.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'supabase/seed-venues.local.sql');

// Achtung beim Argument: aufgerufen über scripts/run.mjs steht in
// argv[2] bereits dieses Skript selbst, die Datei erst in argv[3]. Statt
// einen festen Index zu raten, die erste .csv/.json-Datei aus den
// Argumenten nehmen — funktioniert über run.mjs wie auch direkt.
const input = process.argv.slice(2).find((a) => /\.(csv|json|geojson)$/i.test(a));
if (!input) {
	console.error(
		'Aufruf: node scripts/run.mjs scripts/import-venues.ts <datei.csv|datei.json|datei.geojson>'
	);
	process.exit(1);
}

type VenueInput = {
	name: string;
	city?: string | null;
	postal_code?: string | null;
	address?: string | null;
	website?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	source_ref?: string | null;
};

const q = (v: string | null | undefined) =>
	v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`;

const num = (v: number | null | undefined) =>
	v === null || v === undefined || Number.isNaN(v) ? 'null' : String(v);

/**
 * Minimaler CSV-Parser mit Anführungszeichen-Unterstützung. Bewusst kein
 * Paket dafür: Adressdaten enthalten Kommas ("Musterweg 1, Halle 2"),
 * aber keine exotischen CSV-Feinheiten — das hier deckt Quoting und
 * verdoppelte Anführungszeichen ab, mehr braucht es nicht.
 */
function parseCsv(text: string): Record<string, string>[] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];

		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
			continue;
		}

		if (c === '"') inQuotes = true;
		else if (c === ',' || c === ';') {
			row.push(field);
			field = '';
		} else if (c === '\n') {
			row.push(field);
			field = '';
			if (row.some((f) => f.trim() !== '')) rows.push(row);
			row = [];
		} else if (c !== '\r') {
			field += c;
		}
	}
	row.push(field);
	if (row.some((f) => f.trim() !== '')) rows.push(row);

	if (rows.length === 0) return [];
	const header = rows[0].map((h) => h.trim().toLowerCase());
	return rows.slice(1).map((r) => {
		const obj: Record<string, string> = {};
		header.forEach((h, i) => (obj[h] = (r[i] ?? '').trim()));
		return obj;
	});
}

/**
 * Ein OSM-Objekt, formatunabhängig eingelesen (Overpass-Rohformat ODER
 * GeoJSON aus overpass-turbo, das anders aufgebaut ist).
 */
type OsmThing = {
	ref: string | null;
	lat: number | null;
	lon: number | null;
	tags: Record<string, string>;
};

/** Overpass-Rohformat: elements[] mit tags + lat/lon oder center. */
function readOverpass(json: { elements?: unknown[] }): OsmThing[] {
	return (json.elements ?? []).map((raw) => {
		const el = raw as {
			type?: string;
			id?: number;
			lat?: number;
			lon?: number;
			center?: { lat: number; lon: number };
			tags?: Record<string, string>;
		};
		return {
			ref: el.type && el.id ? `${el.type}/${el.id}` : null,
			lat: el.lat ?? el.center?.lat ?? null,
			lon: el.lon ?? el.center?.lon ?? null,
			tags: el.tags ?? {}
		};
	});
}

/**
 * GeoJSON aus overpass-turbo ("Exportieren -> GeoJSON"). Anders als das
 * Rohformat stecken die Tags direkt in properties (inklusive
 * Meta-Schlüsseln wie "@id"), und die Koordinaten liegen als
 * [lon, lat] in geometry — in dieser Reihenfolge, nicht andersherum.
 */
function readGeoJson(json: { features?: unknown[] }): OsmThing[] {
	return (json.features ?? []).map((raw) => {
		const f = raw as {
			id?: string;
			properties?: Record<string, string>;
			geometry?: { type?: string; coordinates?: number[] };
		};
		const props = f.properties ?? {};
		const coords = f.geometry?.coordinates;
		const isPoint = f.geometry?.type === 'Point' && Array.isArray(coords) && coords.length >= 2;

		const tags: Record<string, string> = {};
		for (const [k, v] of Object.entries(props)) {
			if (!k.startsWith('@')) tags[k] = v;
		}

		return {
			ref: (props['@id'] ?? f.id ?? null) as string | null,
			lat: isPoint ? coords![1] : null,
			lon: isPoint ? coords![0] : null,
			tags
		};
	});
}

/**
 * Namen, die keine Anlage bezeichnen und deshalb nicht als Clubname auf
 * der Karte landen dürfen. Zwei Sorten, beide reichlich in OSM:
 *
 *   1. Einzelne PLÄTZE — "Platz 1", "Court 3", "1",
 *      "CUPRA Center Court 2". Ein Platz ist kein Club.
 *   2. Rein GENERISCHE Bezeichnungen — "Padel", "Padel-Anlage".
 *      Die sehen auf der Karte aus wie ein Eigenname, sagen aber nichts.
 *      Unser Platzhalter "Padelanlage (Name unbekannt)" ist ehrlicher.
 *
 * Nicht gefiltert wird alles, was zusätzliche Information trägt
 * ("Padel Oldenburg", "Padel Club One") — im Zweifel lieber den echten
 * OSM-Namen zeigen als ihn wegzuwerfen.
 */
function isNonVenueName(name: string): boolean {
	const n = name.trim().toLowerCase();

	// Reine Nummer.
	if (/^\d+$/.test(n)) return true;

	// Generische Bezeichnung ohne Zusatz.
	if (/^(padel|padel[- ]?anlage|padelanlage|padelplatz|padelplätze|padel[- ]?court|court|platz)$/.test(n)) {
		return true;
	}

	// Platzbezeichnung mit Nummer ("Court 3", "Platz 1", "Feld 2").
	if (/\b(court|platz|feld|piste|bahn)\b/.test(n) && /\d/.test(n)) return true;

	// Beginnt mit einer Platzbezeichnung ("Padelplätze (2x fest, 1x Sand)").
	if (/^(court|platz|padel-?court|padel court|padelplatz|padelplätze)\b/.test(n)) return true;

	// Veranstaltung statt Anlage. In OSM stehen gelegentlich temporäre
	// Events auf Padelplätzen ("Padel Days 2026 im MAC Forum") — ein
	// Verzeichnis von Clubs sollte die nicht führen, und die CTA
	// "Betreibst du diesen Club?" ergibt dort keinen Sinn. Jahreszahl im
	// Namen ist dafür das verlässlichste Signal; ein Club heißt selten so.
	if (/\b20\d{2}\b/.test(n)) return true;

	// Durchnummerierter Platz ohne das Wort "Court"/"Platz" im Namen
	// ("Outdoor Spree 1", "Outdoor Spree 2"). Eine angehängte kleine Zahl
	// ist in OSM fast immer eine Platznummer.
	//
	// Bewusst in Kauf genommen: eine Anlage, die wirklich so heißt (etwa
	// eine zweite Filiale "… 2"), fällt damit ebenfalls raus. Lieber ein
	// Standort weniger als ein Platz, der sich als Club ausgibt — und die
	// Rohdaten sind ja nicht verloren.
	if (/\s\d{1,2}$/.test(n)) return true;

	return false;
}

/** Entfernung zweier Punkte in Metern (grob, reicht fürs Clustern). */
function metersBetween(a: OsmThing, b: OsmThing): number {
	if (a.lat === null || a.lon === null || b.lat === null || b.lon === null) return Infinity;
	const midLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
	const dx = (a.lon - b.lon) * 111320 * Math.cos(midLat);
	const dy = (a.lat - b.lat) * 110540;
	return Math.hypot(dx, dy);
}

const CLUSTER_RADIUS_M = 200;

/**
 * Fasst OSM-Objekte, die dicht beieinander liegen, zu EINER Anlage
 * zusammen.
 *
 * Warum überhaupt: eine Overpass-Abfrage auf sport=padel liefert
 * überwiegend einzelne Plätze (leisure=pitch). Eine Halle mit fünf
 * Courts erscheint als fünf Objekte. Ungefiltert stünden auf der Karte
 * fünf Pins mit Namen wie "CUPRA Court 3" — als wären das fünf Clubs.
 *
 * 200 m als Radius: groß genug, um Plätze, Halle und Gebäude derselben
 * Anlage einzusammeln, klein genug, um zwei echte Clubs im selben Ort
 * nicht zu verschmelzen.
 *
 * Der Anlagenname kommt bevorzugt von einem sports_centre/sports_hall
 * (das IST die Anlage), erst danach von einem Platz — und nie von einem
 * reinen Platznamen.
 */
function clusterToVenues(things: OsmThing[]): { venues: VenueInput[]; unnamed: number } {
	const relevant = things.filter((t) => t.lat !== null && t.lon !== null);
	const clusters: OsmThing[][] = [];

	for (const t of relevant) {
		const hit = clusters.find((c) => c.some((o) => metersBetween(t, o) < CLUSTER_RADIUS_M));
		if (hit) hit.push(t);
		else clusters.push([t]);
	}

	let unnamed = 0;
	const venues: VenueInput[] = [];

	for (const cluster of clusters) {
		const isVenueObject = (t: OsmThing) =>
			t.tags.leisure === 'sports_centre' || t.tags.leisure === 'sports_hall';

		// Name: Anlagen-Objekt schlägt Platz, echter Name schlägt Platzname.
		const nameFrom =
			cluster.find((t) => isVenueObject(t) && t.tags.name && !isNonVenueName(t.tags.name)) ??
			cluster.find((t) => t.tags.name && !isNonVenueName(t.tags.name));
		const name = nameFrom?.tags.name?.trim() ?? null;

		// Ohne Namen wird nicht importiert (Entscheidung 21.08.): ein Pin
		// "Padelanlage (Name unbekannt)" ohne Adresse und Website ist für
		// die Akquise wertlos und lässt das Verzeichnis unfertig wirken.
		// Die Rohdaten bleiben ja erhalten — sobald OSM einen Namen hat,
		// holt der nächste Import die Anlage nach.
		if (!name) {
			unnamed++;
			continue;
		}

		// Übrige Felder aus dem ganzen Cluster einsammeln — die Adresse
		// hängt oft am Gebäude, die Website am Platz.
		const pick = (fn: (t: OsmThing) => string | undefined) => {
			for (const t of cluster) {
				const v = fn(t)?.trim();
				if (v) return v;
			}
			return null;
		};

		// Stabile Referenz: bevorzugt das Anlagen-Objekt, sonst die
		// alphabetisch erste ID — damit ein zweiter Import dieselbe Zeile
		// trifft, solange sich der Cluster nicht grundlegend ändert.
		const refCandidate =
			cluster.find((t) => isVenueObject(t) && t.ref)?.ref ??
			cluster
				.map((t) => t.ref)
				.filter((r): r is string => Boolean(r))
				.sort()[0] ??
			null;

		const anchor = nameFrom ?? cluster.find((t) => isVenueObject(t)) ?? cluster[0];

		venues.push({
			name,
			city: pick((t) => t.tags['addr:city']),
			postal_code: pick((t) => t.tags['addr:postcode']),
			address:
				pick((t) =>
					[t.tags['addr:street'], t.tags['addr:housenumber']].filter(Boolean).join(' ') || undefined
				) ?? null,
			website: pick((t) => t.tags.website ?? t.tags['contact:website']),
			latitude: anchor.lat,
			longitude: anchor.lon,
			source_ref: refCandidate
		});
	}

	return { venues, unnamed };
}

// ---------- Einlesen ----------
const rawText = readFileSync(resolve(process.cwd(), input), 'utf8');
let venues: VenueInput[];
let source: 'osm' | 'import';

let clusterReport: { raw: number; unnamed: number } | null = null;

if (input.endsWith('.json') || input.endsWith('.geojson')) {
	const parsed = JSON.parse(rawText);
	const things =
		parsed && typeof parsed === 'object' && Array.isArray(parsed.elements)
			? readOverpass(parsed)
			: parsed && typeof parsed === 'object' && Array.isArray(parsed.features)
				? readGeoJson(parsed)
				: null;

	if (things) {
		const result = clusterToVenues(things);
		venues = result.venues;
		clusterReport = { raw: things.length, unnamed: result.unnamed };
		source = 'osm';
	} else if (Array.isArray(parsed)) {
		venues = parsed as VenueInput[];
		source = 'import';
	} else {
		throw new Error(
			'JSON muss ein Overpass-Ergebnis (elements[]), ein GeoJSON (features[]) oder ein Array sein.'
		);
	}
} else {
	venues = parseCsv(rawText).map((r) => ({
		name: r.name,
		city: r.city || null,
		postal_code: r.postal_code || r.plz || null,
		address: r.address || r.adresse || null,
		website: r.website || null,
		latitude: r.latitude ? Number(r.latitude.replace(',', '.')) : null,
		longitude: r.longitude ? Number(r.longitude.replace(',', '.')) : null,
		source_ref: r.source_ref || null
	}));
	source = 'import';
}

// ---------- Prüfen ----------
const named = venues.filter((v) => v.name && v.name.trim() !== '');
if (named.length === 0) {
	throw new Error('Keine Zeile mit Namen gefunden — stimmt die Kopfzeile (Spalte "name")?');
}

// Halbe Koordinaten verwirft die Datenbank ohnehin (CHECK-Constraint) —
// hier sauber auf "gar keine" normalisieren, damit der Import nicht an
// einer einzelnen Zeile scheitert.
for (const v of named) {
	const hasLat = typeof v.latitude === 'number' && !Number.isNaN(v.latitude);
	const hasLon = typeof v.longitude === 'number' && !Number.isNaN(v.longitude);
	if (!hasLat || !hasLon) {
		v.latitude = null;
		v.longitude = null;
	}
}

const withRef = named.filter((v) => v.source_ref);
const withCoords = named.filter((v) => v.latitude !== null);
const duplicateRefs = withRef.length - new Set(withRef.map((v) => v.source_ref)).size;
if (duplicateRefs > 0) {
	throw new Error(`${duplicateRefs} doppelte source_ref in der Eingabe — Datei bereinigen.`);
}

// ---------- SQL schreiben ----------
const L: string[] = [];
L.push('-- ============================================================');
L.push('-- PadelIndex — Anlagen-Verzeichnis');
L.push(`-- ERZEUGT von scripts/import-venues.ts aus ${input}`);
L.push(`-- ${named.length} Anlagen, davon ${withCoords.length} mit Koordinaten.`);
L.push('--');
L.push('-- Setzt voraus: 0017_padel_venues.sql ist bereits gelaufen.');
L.push('-- Zeilen mit locked = true werden NICHT überschrieben.');
L.push('-- ============================================================');
L.push('');
L.push('begin;');
L.push('');
L.push(
	'insert into padel_venues (name, city, postal_code, address, website, latitude, longitude, source, source_ref) values'
);
L.push(
	named
		.map(
			(v) =>
				`  (${q(v.name)}, ${q(v.city)}, ${q(v.postal_code)}, ${q(v.address)}, ${q(v.website)}, ` +
				`${num(v.latitude)}, ${num(v.longitude)}, ${q(source)}, ${q(v.source_ref)})`
		)
		.join(',\n')
);
L.push('on conflict (source, source_ref) where source_ref is not null do update set');
L.push('  name        = excluded.name,');
L.push('  city        = coalesce(excluded.city, padel_venues.city),');
L.push('  postal_code = coalesce(excluded.postal_code, padel_venues.postal_code),');
L.push('  address     = coalesce(excluded.address, padel_venues.address),');
L.push('  website     = coalesce(excluded.website, padel_venues.website),');
L.push('  latitude    = coalesce(excluded.latitude, padel_venues.latitude),');
L.push('  longitude   = coalesce(excluded.longitude, padel_venues.longitude)');
L.push('where padel_venues.locked = false;');
L.push('');
L.push('commit;');
L.push('');
L.push('-- ---------- Partner verknüpfen (von Hand) ----------');
L.push('-- Eine Anlage gilt als PadelIndex-Partner, sobald club_id gesetzt');
L.push('-- ist. Bewusst kein Namensabgleich im Skript — der würde früher');
L.push('-- oder später den falschen Verein treffen. Beispiel:');
L.push('--');
L.push("--   update padel_venues set club_id = (select id from clubs where slug = 'stc-oberland')");
L.push("--   where name = 'HIER DEN EXAKTEN ANLAGENNAMEN EINSETZEN';");
L.push('');

writeFileSync(OUT, L.join('\n'), 'utf8');

console.log(`Geschrieben: ${OUT}`);
if (clusterReport) {
	console.log(
		`${clusterReport.raw} OSM-Objekte (meist einzelne Plätze) -> ${named.length} Anlagen zusammengefasst.`
	);
	if (clusterReport.unnamed > 0) {
		console.log(
			`${clusterReport.unnamed} weitere Standorte übersprungen: in OSM ohne Namen (siehe clusterToVenues).`
		);
	}
}
console.log(`${named.length} Anlagen (${withCoords.length} mit Koordinaten, ${withRef.length} mit source_ref).`);
if (withCoords.length < named.length) {
	console.log(
		`Hinweis: ${named.length - withCoords.length} Anlagen ohne Koordinaten erscheinen in der Liste, aber nicht auf der Karte.`
	);
}
if (withRef.length < named.length) {
	console.log(
		`Warnung: ${named.length - withRef.length} Anlagen ohne source_ref — ein erneuter Import legt diese als Dubletten erneut an.`
	);
}
