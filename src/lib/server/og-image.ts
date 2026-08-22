// ============================================================
// PadelIndex — OG-Bild für das Level-Schätzer-Ergebnis
// ============================================================
// Cloudflare Workers haben kein <canvas> und kein Node-`sharp`. Satori
// (SVG aus einem JSX-artigen Objektbaum, MPL-2.0) + resvg-wasm
// (SVG -> PNG, MPL-2.0) ist der Standardweg für serverseitig gerenderte
// Social-Share-Bilder auf Workers. Beide sind neue Abhängigkeiten,
// begründet dadurch, dass es dafür keinen leichteren Weg auf dieser
// Plattform gibt.
//
// Schriften liegen unter static/ und werden wie jede andere statische
// Datei über fetch() geladen (siehe static/embed.js). Das resvg-wasm-Modul
// dagegen NICHT: Cloudflare Workers verbieten WebAssembly.instantiate()
// aus zur Laufzeit geladenen Bytes ("Wasm code generation disallowed by
// embedder", getestet in wrangler pages dev) — Wasm muss als Modul-Import
// im Worker-Bundle stehen, das Wrangler beim Deploy selbst kompiliert
// (siehe Cloudflare-Doku "Import .wasm": import mod from "./x.wasm").
//
// Wasm-Init und Font-Bytes werden modulweit zwischengespeichert: ein
// warmer Worker-Isolate darf sie über mehrere Requests hinweg wiederverwenden.
//
// Der Wasm-Import steht bewusst als DYNAMISCHES import() in einer Funktion,
// nicht als top-level import: SvelteKits eigener Build lädt den kompilierten
// Server-Code kurz in einer echten Node-Umgebung, um Routen zu erfassen —
// dort gibt es kein "wbg"-Importobjekt, das der Wasm-Bindgen-Glue-Code
// braucht, und ein top-level Import würde diesen Analyse-Schritt zum
// Absturz bringen. Ein import() in einer nie beim Build aufgerufenen
// Funktion umgeht das; zur Laufzeit im Worker greift Wranglers eigenes
// Bundling trotzdem, weil es denselben Import wieder findet.
//
// Satoris Standardbuild bettet sein Yoga-Layout-Wasm base64-kodiert ein
// und instanziiert es selbst zur Laufzeit — daran scheitert es auf Workers
// aus demselben Grund wie resvg. Der "/standalone"-Export verzichtet
// darauf und lässt uns das kompilierte Modul selbst reinreichen (siehe
// Satori-README, Abschnitt "Standalone Build").

import satori, { init as initSatori } from 'satori/standalone';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { levelBand } from '$lib/level-estimator';

type OgFont = { name: string; data: ArrayBuffer; weight: 500 | 600 | 800 };

let wasmReady: Promise<void> | null = null;
let yogaReady: Promise<void> | null = null;
let fontsReady: Promise<OgFont[]> | null = null;

function initResvgOnce(): Promise<void> {
	if (!wasmReady) {
		wasmReady = import('@resvg/resvg-wasm/index_bg.wasm')
			.then((mod) => initWasm(mod.default as WebAssembly.Module))
			.catch((err) => {
				wasmReady = null; // nächster Request darf es erneut versuchen
				throw err;
			});
	}
	return wasmReady;
}

function initSatoriOnce(): Promise<void> {
	if (!yogaReady) {
		yogaReady = import('satori/yoga.wasm')
			.then((mod) => initSatori(mod.default as WebAssembly.Module))
			.catch((err) => {
				yogaReady = null;
				throw err;
			});
	}
	return yogaReady;
}

function loadFontsOnce(fetchFn: typeof fetch) {
	if (!fontsReady) {
		fontsReady = Promise.all([
			fetchFn('/fonts/BricolageGrotesque-800.ttf').then((r) => r.arrayBuffer()),
			fetchFn('/fonts/Manrope-600.ttf').then((r) => r.arrayBuffer()),
			fetchFn('/fonts/IBMPlexMono-500.ttf').then((r) => r.arrayBuffer())
		]).then(([display, body, mono]) => [
			{ name: 'Bricolage Grotesque', data: display, weight: 800 },
			{ name: 'Manrope', data: body, weight: 600 },
			{ name: 'IBM Plex Mono', data: mono, weight: 500 }
		]);
	}
	return fontsReady;
}

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Rendert das Share-Bild für ein geschätztes Level (0–7) als PNG.
 * `fetchFn` ist SvelteKits event.fetch, damit relative Asset-URLs
 * (/resvg.wasm, /fonts/...) unabhängig vom Deploy-Ziel aufgelöst werden.
 */
export async function renderLevelOgImage(level: number, fetchFn: typeof fetch): Promise<Uint8Array> {
	const [fonts] = await Promise.all([loadFontsOnce(fetchFn), initResvgOnce(), initSatoriOnce()]);
	const band = levelBand(level);
	const levelText = level.toFixed(1);

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: `${WIDTH}px`,
					height: `${HEIGHT}px`,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '72px',
					background: '#0B1E26',
					color: '#EFF2ED',
					fontFamily: 'Manrope'
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								gap: '10px',
								fontFamily: 'IBM Plex Mono',
								fontSize: '24px',
								letterSpacing: '0.06em',
								textTransform: 'uppercase',
								color: '#16A394'
							},
							children: 'PadelIndex · Level-Schätzer'
						}
					},
					{
						type: 'div',
						props: {
							style: { display: 'flex', flexDirection: 'column', gap: '18px' },
							children: [
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											alignItems: 'baseline',
											gap: '20px'
										},
										children: [
											{
												type: 'div',
												props: {
													style: {
														display: 'flex',
														fontFamily: 'Bricolage Grotesque',
														fontSize: '176px',
														fontWeight: 800,
														lineHeight: 1,
														letterSpacing: '-0.03em'
													},
													children: levelText
												}
											},
											{
												type: 'div',
												props: {
													style: { display: 'flex', fontSize: '40px', color: 'rgba(239,242,237,.62)' },
													children: 'von 7'
												}
											}
										]
									}
								},
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											fontFamily: 'Bricolage Grotesque',
											fontSize: '44px',
											fontWeight: 800,
											letterSpacing: '-0.02em'
										},
										children: `Geschätztes Level: ${band.label}`
									}
								}
							]
						}
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								fontSize: '26px',
								color: 'rgba(239,242,237,.62)',
								maxWidth: '900px'
							},
							children:
								'Eigene Einschätzung, kein bestätigtes Rating. Das echte Level entsteht auf padelindex.de aus bestätigten Matches.'
						}
					}
				]
			}
		},
		{
			width: WIDTH,
			height: HEIGHT,
			fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: 'normal' as const }))
		}
	);

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	const rendered = resvg.render();
	return rendered.asPng();
}
