<script lang="ts">
	// ============================================================
	// Sicherheit: warum dein Wert steigt, ohne dass du besser wirst
	// ============================================================
	// PadelIndex speichert keine Zahl, sondern eine Verteilung. Angezeigt
	// wird bewusst nicht die Mitte, sondern der vorsichtige Rand
	// (mu − 2·sigma) — wer wenig gespielt hat, wird eher unter- als
	// überschätzt.
	//
	// Daraus folgt etwas Unerwartetes, das sich gut zeigen lässt: Ein
	// Spieler mit gleichbleibendem Können sieht seinen Wert trotzdem
	// steigen, weil die Unsicherheit schrumpft. Genau das läuft hier ab.
	//
	// Alle Zahlen kommen aus dem Produktivmodell: sigma stammt aus
	// sigmaAfterMatches() (echte OpenSkill-Updates), der angezeigte Wert
	// aus toDisplayRating() — derselben Funktion, die auch die Rangliste
	// füllt.

	import { whenVisible } from '$lib/landing/reveal';
	import { tween, prefersReducedMotion } from '$lib/landing/motion';
	import { m } from '$lib/paraglide/messages.js';
	import AnimatedNumber from './AnimatedNumber.svelte';

	type Mod = typeof import('$lib/landing/rating-demo');
	let mod = $state<Mod | null>(null);

	/** Konstantes wahres Können. Nur sigma bewegt sich. */
	const TRUE_MU = 45;

	let matches = $state(0);
	let played = $state(false);
	let stop: (() => void) | undefined;

	async function begin() {
		if (!mod) mod = await import('$lib/landing/rating-demo');
		if (played) return;
		played = true;
		if (prefersReducedMotion()) {
			matches = 30;
			return;
		}
		stop = tween(0, 30, 2600, (v) => (matches = Math.round(v)));
	}

	$effect(() => () => stop?.());

	const sigma = $derived(mod ? mod.sigmaAfterMatches(matches) : 8.3333);
	const shown = $derived(mod ? mod.toDisplayRating(TRUE_MU, sigma) : 0);
	/** ±2 sigma, in Anzeigepunkten. */
	const span = $derived(Number(((2 * sigma * 7) / 50).toFixed(2)));

	// --- Zeichnung ---
	// Fenster in Anzeigepunkten. Bewusst ohne Zahlen-Ticks: gezeigt wird
	// die Form der Überzeugung, nicht eine ablesbare Skala.
	const X0 = 2;
	const X1 = 10;
	const W = 600;
	const BASE = 150;
	const TOP = 26;

	const toX = (v: number) => ((v - X0) / (X1 - X0)) * W;

	const curve = $derived.by(() => {
		const centre = (TRUE_MU * 7) / 50;
		const sd = (sigma * 7) / 50;
		const amp = BASE - TOP;
		let d = '';
		for (let i = 0; i <= 140; i++) {
			const v = X0 + ((X1 - X0) * i) / 140;
			const y = BASE - amp * Math.exp(-((v - centre) ** 2) / (2 * sd * sd));
			d += (i === 0 ? 'M' : 'L') + toX(v).toFixed(1) + ' ' + y.toFixed(1);
		}
		return d;
	});

	const centreX = $derived(toX((TRUE_MU * 7) / 50));
	const shownX = $derived(toX(shown));

	const stage = $derived(
		matches < 4
			? m.cc_stage_unknown()
			: matches < 14
				? m.cc_stage_narrowing()
				: m.cc_stage_settled()
	);
</script>

<div class="cc" use:whenVisible={{ onVisible: begin, threshold: 0.35 }}>
	<div class="cc-chart">
		<svg
			viewBox="0 0 600 176"
			role="img"
			aria-label={m.cc_svg_aria({ matches, shown: shown.toFixed(2), span: span.toFixed(2) })}
		>
			<defs>
				<linearGradient id="ccGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#16A394" stop-opacity=".38" />
					<stop offset="100%" stop-color="#16A394" stop-opacity="0" />
				</linearGradient>
			</defs>

			<line class="cc-axis" x1="0" y1={BASE} x2={W} y2={BASE} />
			<path class="cc-fill" d="{curve} L{W} {BASE} L0 {BASE} Z" />
			<path class="cc-stroke" d={curve} />

			<!-- Marker erst zeichnen, wenn das Modell da ist: vorher ist `shown`
			     noch 0 und die Linie läge weit links außerhalb der Zeichenfläche. -->
			{#if mod}
				<!-- geschätztes Können: die Mitte der Verteilung -->
				<line class="cc-centre" x1={centreX} y1={TOP + 6} x2={centreX} y2={BASE} />
				<text class="cc-tag cc-tag-centre" x={centreX + 7} y={TOP + 12}
					>{m.cc_estimated_ability()}</text
				>
				<!-- angezeigter Wert: der vorsichtige Rand -->
				<line class="cc-shown" x1={shownX} y1={TOP - 8} x2={shownX} y2={BASE} />
				<text class="cc-tag cc-tag-shown" x={shownX + 7} y={TOP - 2}>
					{m.cc_shown_label()} · {shown.toFixed(2)}
				</text>
			{/if}
		</svg>
	</div>

	<div class="cc-side">
		<span class="cc-stage num">{stage}</span>

		<div class="cc-big">
			<AnimatedNumber value={shown} decimals={2} duration={260} />
		</div>
		<span class="cc-biglabel">{m.cc_shown_value_label()}</span>

		<dl class="cc-read">
			<div>
				<dt>{m.cc_matches_label()}</dt>
				<dd class="num">{matches}</dd>
			</div>
			<div>
				<dt>{m.cc_span_label()}</dt>
				<dd class="num">±{span.toFixed(2)}</dd>
			</div>
		</dl>

		<label class="cc-slider">
			<span>{m.cc_slider_label()}</span>
			<input
				type="range"
				min="0"
				max="60"
				step="1"
				bind:value={matches}
				oninput={() => (played = true)}
				aria-label={m.cc_matches_count_aria()}
			/>
		</label>

		<p class="cc-note">
			{m.cc_note_pre()} <b>{m.cc_note_bold()}</b>. {m.cc_note_post()}
		</p>
	</div>
</div>

<style>
	.cc {
		display: grid;
		grid-template-columns: 1.35fr 0.65fr;
		gap: clamp(20px, 3vw, 44px);
		align-items: center;
		margin-top: 46px;
	}
	@media (max-width: 860px) {
		.cc {
			grid-template-columns: 1fr;
			gap: 26px;
		}
	}

	.cc-chart,
	.cc-side {
		min-width: 0;
	}
	.cc-chart svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}
	.cc-fill {
		fill: url(#ccGrad);
	}
	.cc-stroke {
		fill: none;
		stroke: var(--court);
		stroke-width: 2.2;
		stroke-linejoin: round;
	}
	.cc-axis {
		stroke: var(--line-dark);
		stroke-width: 1;
	}
	.cc-centre {
		stroke: var(--sand);
		stroke-width: 1.2;
		stroke-dasharray: 3 4;
		opacity: 0.8;
	}
	.cc-shown {
		stroke: var(--chalk);
		stroke-width: 2;
	}
	.cc-tag {
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.cc-tag-shown {
		fill: var(--chalk);
	}
	.cc-tag-centre {
		fill: var(--sand);
	}

	.cc-stage {
		font-size: 10.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--court);
	}
	.cc-big {
		font-family: var(--mono);
		font-size: clamp(44px, 6vw, 62px);
		letter-spacing: -0.045em;
		line-height: 1;
		margin-top: 10px;
	}
	.cc-biglabel {
		display: block;
		font-size: 12px;
		color: var(--muted-dark);
		margin-top: 6px;
	}
	.cc-read {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin: 22px 0 0;
		padding-top: 16px;
		border-top: 1px solid var(--line-dark);
	}
	.cc-read dt {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.cc-read dd {
		margin: 4px 0 0;
		font-size: 17px;
	}
	.cc-slider {
		display: block;
		margin-top: 20px;
	}
	.cc-slider span {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.cc-slider input {
		width: 100%;
		height: 40px;
		margin-top: 0;
	}
	.cc-note {
		margin-top: 18px;
		font-size: 12.5px;
		line-height: 1.6;
		color: var(--muted-dark);
	}
	.cc-note b {
		color: var(--chalk);
		font-weight: 600;
	}
</style>
