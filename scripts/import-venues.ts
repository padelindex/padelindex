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
const input = process.argv.slice(2).find((a) => /\.(csv|json)$/i.test(a));
if (!input) {
	console.error('Aufruf: node scripts/run.mjs scripts/import-venues.ts <datei.csv|datei.json>');
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

/** Overpass-JSON (elements[] mit tags + lat/lon oder center). */
function parseOverpass(json: { elements?: unknown[] }): VenueInput[] {
	const out: VenueInput[] = [];
	for (const raw of json.elements ?? []) {
		const el = raw as {
			type?: string;
			id?: number;
			lat?: number;
			lon?: number;
			center?: { lat: number; lon: number };
			tags?: Record<string, string>;
		};
		const tags = el.tags ?? {};
		const name = tags.name?.trim();
		// Ohne Namen ist ein Kartenpunkt für Nutzer wertlos — OSM hat
		// viele unbenannte Plätze, die zu einer Anlage gehören.
		if (!name) continue;

		const lat = el.lat ?? el.center?.lat ?? null;
		const lon = el.lon ?? el.center?.lon ?? null;

		out.push({
			name,
			city: tags['addr:city'] ?? null,
			postal_code: tags['addr:postcode'] ?? null,
			address: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || null,
			website: tags.website ?? tags['contact:website'] ?? null,
			latitude: lat,
			longitude: lon,
			source_ref: el.type && el.id ? `${el.type}/${el.id}` : null
		});
	}
	return out;
}

// ---------- Einlesen ----------
const rawText = readFileSync(resolve(process.cwd(), input), 'utf8');
let venues: VenueInput[];
let source: 'osm' | 'import';

if (input.endsWith('.json')) {
	const parsed = JSON.parse(rawText);
	if (parsed && typeof parsed === 'object' && Array.isArray(parsed.elements)) {
		venues = parseOverpass(parsed);
		source = 'osm';
	} else if (Array.isArray(parsed)) {
		venues = parsed as VenueInput[];
		source = 'import';
	} else {
		throw new Error('JSON muss entweder ein Overpass-Ergebnis (elements[]) oder ein Array sein.');
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
