// ============================================================
// PadelIndex — App-Icons für die PWA aus static/logo.svg erzeugen
// ============================================================
// Browser-Manifeste und Apple-Touch-Icons brauchen echte PNG-Dateien,
// kein SVG (iOS ignoriert SVG-Icons komplett). Statt eine neue
// Bildbearbeitungs-Abhängigkeit einzuführen, nutzt dieses Skript
// dasselbe resvg-wasm, das schon für die OG-Bilder (og-image.ts) im
// Projekt steckt — hier ohne Satori, weil nur ein fertiges SVG
// gerastert werden muss, keine Layout-Baum-Komposition.
//
// Aufruf: node scripts/run.mjs scripts/generate-icons.ts
// Ergebnis liegt unter static/icons/ und wird eingecheckt — die
// Icons ändern sich nur, wenn sich die Marke ändert, kein Grund,
// sie bei jedem Build neu zu rendern.

import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const BG = '#0B1E26';
const MARK = '#16A394';

// Die Logo-Maske (aus static/logo.svg, viewBox 0 0 40 40) auf einem
// quadratischen Hintergrund zentriert. `scale`/`translate` steuern den
// Rand: kleiner Wert für normale Icons, größerer für maskable (Android
// beschneidet dort bis zu einem zentrierten Sicherheitsbereich).
function iconSvg(size: number, markScale: number): string {
	const inner = 40 * markScale;
	const offset = (size - inner) / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${markScale})">
    <g fill="none" stroke="${MARK}" stroke-width="3">
      <circle cx="20" cy="20" r="13" stroke-dasharray="63.7 81.68" stroke-linecap="round"
              transform="rotate(-90 20 20)" opacity="0.9"/>
    </g>
    <g fill="${MARK}">
      <rect x="12.6" y="21.5" width="3" height="6" rx="1.5"/>
      <rect x="18.5" y="17.5" width="3" height="10" rx="1.5"/>
      <rect x="24.4" y="13.5" width="3" height="14" rx="1.5"/>
    </g>
    <circle cx="7.2" cy="17.6" r="2.9" fill="${MARK}"/>
  </g>
</svg>`;
}

async function initResvg() {
	const wasmPath = resolve(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm');
	const wasmBytes = await readFile(wasmPath);
	await initWasm(wasmBytes);
}

async function renderPng(svg: string, size: number): Promise<Uint8Array> {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
	return resvg.render().asPng();
}

async function main() {
	await initResvg();
	const outDir = resolve(ROOT, 'static/icons');
	await mkdir(outDir, { recursive: true });

	// `fill` = Anteil der Icon-Kantenlänge, den die Marke einnimmt.
	// Normale Icons: 78 % (kleiner Rand). Maskable: 62 % (größere
	// Sicherheitszone für runde/quadratische Launcher-Masken auf Android).
	const targets: Array<{ file: string; size: number; fill: number }> = [
		{ file: 'icon-192.png', size: 192, fill: 0.78 },
		{ file: 'icon-512.png', size: 512, fill: 0.78 },
		{ file: 'maskable-512.png', size: 512, fill: 0.62 },
		{ file: 'apple-touch-icon.png', size: 180, fill: 0.78 }
	];

	for (const t of targets) {
		const svg = iconSvg(t.size, (t.fill * t.size) / 40);
		const png = await renderPng(svg, t.size);
		await writeFile(resolve(outDir, t.file), png);
		console.log(`geschrieben: static/icons/${t.file} (${t.size}x${t.size})`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
