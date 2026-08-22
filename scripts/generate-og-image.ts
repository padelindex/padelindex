// ============================================================
// PadelIndex — Standard-Share-Bild (og:image) pro Sprache
// ============================================================
// Bislang hatte nur /level-schaetzen ein og:image (dynamisch, siehe
// lib/server/og-image.ts). Jede andere Seite — Startseite, /rating,
// /vereine, Vereins- und Spielerseiten, Ratgeber, Quiz, /roadmap, …
// — hatte gar kein Vorschaubild, wenn ein Link in Slack/WhatsApp/
// X/iMessage geteilt wurde.
//
// Anders als das Level-Ergebnis ist dieses Bild für jede Sprache
// identisch und ändert sich nie pro Request — ein Build-Zeit-Skript
// mit statischem PNG unter static/ ist hier die richtige Wahl, kein
// Worker-Endpunkt (kein Grund, Satori+resvg bei jedem Seitenaufruf
// im Isolate zu laden, wenn dasselbe Bild immer wieder rauskommt).
//
// Dieselben Bibliotheken wie og-image.ts (Satori für den Layoutbaum,
// resvg-wasm fürs Rastern) und dieselben Marken-Assets (Logo-Pfade aus
// LandingNav.svelte, Fonts aus static/fonts) — nur hier direkt aus
// node_modules geladen, weil das Skript in echtem Node läuft, nicht im
// Worker (siehe og-image.ts-Kommentar zum dynamischen Wasm-Import, der
// dort aus Cloudflare-Gründen nötig ist, hier aber nicht gebraucht wird).
//
// Aufruf: node scripts/run.mjs scripts/generate-og-image.ts
// Ergebnis liegt unter static/og/*.png und wird eingecheckt — ändert
// sich nur, wenn sich Marke oder Kernaussage ändern.

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const WIDTH = 1200;
const HEIGHT = 630;

const NIGHT = '#0B1E26';
const NIGHT_2 = '#0F2A33';
const COURT = '#16A394';
const CHALK = '#EFF2ED';
const MUTED = 'rgba(239,242,237,.66)';
const LINE = 'rgba(239,242,237,.13)';

type Locale = 'de' | 'en' | 'es';

const COPY: Record<Locale, { line1: string; emphasis: string; line2: string; sub: string }> = {
	de: {
		line1: 'Dein Level.',
		emphasis: 'Belegt,',
		line2: 'nicht behauptet.',
		sub: 'Rating für Padel-Doppel aus bestätigten Matches: Gegnerstärke, Satzverlauf und Sicherheit statt Selbsteinschätzung.'
	},
	en: {
		line1: 'Your level.',
		emphasis: 'Proven,',
		line2: 'not claimed.',
		sub: 'A padel doubles rating from confirmed matches: opponent strength, score margin and confidence — not self-assessment.'
	},
	es: {
		line1: 'Tu nivel.',
		emphasis: 'Demostrado,',
		line2: 'no declarado.',
		sub: 'Un rating de pádel de dobles a partir de partidos confirmados: nivel del rival, marcador y fiabilidad, en lugar de una autoevaluación.'
	}
};

// Exakt dieselben Pfade wie das Logo in LandingNav.svelte, damit das
// Share-Bild und die echte Seite dieselbe Marke zeigen.
const LOGO_MARK = {
	type: 'svg',
	props: {
		viewBox: '0 0 40 40',
		width: 52,
		height: 52,
		style: { display: 'flex' },
		children: [
			{
				type: 'circle',
				props: {
					cx: 20,
					cy: 20,
					r: 13,
					fill: 'none',
					stroke: COURT,
					strokeWidth: 3,
					strokeDasharray: '63.7 81.68',
					strokeLinecap: 'round',
					transform: 'rotate(-90 20 20)',
					opacity: 0.9
				}
			},
			{
				type: 'g',
				props: {
					fill: COURT,
					children: [
						{ type: 'rect', props: { x: 12.6, y: 21.5, width: 3, height: 6, rx: 1.5 } },
						{ type: 'rect', props: { x: 18.5, y: 17.5, width: 3, height: 10, rx: 1.5 } },
						{ type: 'rect', props: { x: 24.4, y: 13.5, width: 3, height: 14, rx: 1.5 } }
					]
				}
			},
			{ type: 'circle', props: { cx: 7.2, cy: 17.6, r: 2.9, fill: COURT } }
		]
	}
};

// Vertikale "Mullions" wie im Hero/CTA der Startseite — Strukturmotiv
// statt Dekoration, siehe landing.css .mullions.
function mullions() {
	const positions = [10, 28, 50, 72, 90];
	return {
		type: 'div',
		props: {
			style: { position: 'absolute', inset: 0, display: 'flex' },
			children: positions.map((left) => ({
				type: 'div',
				props: {
					style: {
						position: 'absolute',
						top: 0,
						bottom: 0,
						left: `${left}%`,
						width: '1px',
						background: LINE,
						display: 'flex'
					}
				}
			}))
		}
	};
}

function cardTree(locale: Locale) {
	const c = COPY[locale];
	return {
		type: 'div',
		props: {
			style: {
				width: `${WIDTH}px`,
				height: `${HEIGHT}px`,
				display: 'flex',
				position: 'relative',
				flexDirection: 'column',
				justifyContent: 'space-between',
				padding: '68px 76px',
				background: `linear-gradient(155deg, ${NIGHT_2} 0%, ${NIGHT} 55%)`,
				fontFamily: 'Manrope'
			},
			children: [
				mullions(),
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							left: '58%',
							top: '-20%',
							width: '900px',
							height: '700px',
							display: 'flex',
							borderRadius: '9999px',
							background: `radial-gradient(circle, rgba(22,163,148,.22) 0%, rgba(22,163,148,0) 62%)`
						}
					}
				},
				{
					type: 'div',
					props: {
						style: { position: 'relative', display: 'flex', alignItems: 'center', gap: '14px' },
						children: [
							LOGO_MARK,
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										fontFamily: 'Bricolage Grotesque',
										fontWeight: 800,
										fontSize: '30px',
										letterSpacing: '-0.03em',
										color: CHALK
									},
									children: 'PadelIndex'
								}
							}
						]
					}
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'relative',
							display: 'flex',
							flexDirection: 'column',
							gap: '26px'
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										flexDirection: 'column',
										fontFamily: 'Bricolage Grotesque',
										fontWeight: 800,
										fontSize: '76px',
										lineHeight: 1.04,
										letterSpacing: '-0.03em'
									},
									children: [
										{
											type: 'div',
											props: {
												style: { display: 'flex', gap: '20px', color: CHALK },
												children: [
													{ type: 'span', props: { children: c.line1 } },
													{ type: 'span', props: { style: { color: COURT }, children: c.emphasis } }
												]
											}
										},
										{
											type: 'div',
											props: { style: { display: 'flex', color: CHALK }, children: c.line2 }
										}
									]
								}
							},
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										maxWidth: '760px',
										fontSize: '25px',
										lineHeight: 1.5,
										color: MUTED
									},
									children: c.sub
								}
							}
						]
					}
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'relative',
							display: 'flex',
							justifyContent: 'flex-end',
							fontFamily: 'IBM Plex Mono',
							fontWeight: 500,
							fontSize: '20px',
							letterSpacing: '0.08em',
							textTransform: 'uppercase',
							color: COURT
						},
						children: 'padelindex.de'
					}
				}
			]
		}
	};
}

async function loadFonts() {
	const [display, body, mono] = await Promise.all([
		readFile(resolve(ROOT, 'static/fonts/BricolageGrotesque-800.ttf')),
		readFile(resolve(ROOT, 'static/fonts/Manrope-600.ttf')),
		readFile(resolve(ROOT, 'static/fonts/IBMPlexMono-500.ttf'))
	]);
	return [
		{ name: 'Bricolage Grotesque', data: display, weight: 800 as const, style: 'normal' as const },
		{ name: 'Manrope', data: body, weight: 600 as const, style: 'normal' as const },
		{ name: 'IBM Plex Mono', data: mono, weight: 500 as const, style: 'normal' as const }
	];
}

async function initResvg() {
	const wasmPath = resolve(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm');
	await initWasm(await readFile(wasmPath));
}

async function main() {
	const [fonts] = await Promise.all([loadFonts(), initResvg()]);
	const outDir = resolve(ROOT, 'static/og');
	await mkdir(outDir, { recursive: true });

	for (const locale of Object.keys(COPY) as Locale[]) {
		const svg = await satori(cardTree(locale) as never, { width: WIDTH, height: HEIGHT, fonts });
		const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
		const png = resvg.render().asPng();
		const file = resolve(outDir, `share-${locale}.png`);
		await writeFile(file, png);
		console.log(`geschrieben: static/og/share-${locale}.png (${WIDTH}x${HEIGHT})`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
