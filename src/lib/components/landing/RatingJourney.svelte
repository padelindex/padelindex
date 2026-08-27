<script lang="ts">
	// ============================================================
	// Rating-Verlauf: eine Saison, Match für Match
	// ============================================================
	// Der Verlauf ist nicht gezeichnet, sondern gerechnet: die feste
	// Match-Folge unten läuft durch simulateCareer(), also durch 14
	// echte Aufrufe von computeMatchRatings() hintereinander. Startpunkt
	// ist BASE_MU/BASE_SIGMA — genau da, wo ein neuer Account anfängt.
	//
	// Deshalb sieht man auch Dinge, die man sich nicht ausdenken würde:
	// den steilen Anstieg am Anfang, die kleinen Dellen bei Niederlagen
	// gegen stärkere Gegner, und das Ende der provisorischen Phase nach
	// zwölf Matches.

	import { whenVisible } from '$lib/landing/reveal';
	import { tween, prefersReducedMotion } from '$lib/landing/motion';
	import type { CareerPoint } from '$lib/landing/rating-demo';
	import { SEASON } from '$lib/landing/season';
	import { m } from '$lib/paraglide/messages.js';

	type Mod = typeof import('$lib/landing/rating-demo');
	let mod = $state<Mod | null>(null);
	let points = $state<CareerPoint[]>([]);
	let drawn = $state(0);
	let selected = $state<number | null>(null);
	let stop: (() => void) | undefined;

	async function begin() {
		if (!mod) {
			mod = await import('$lib/landing/rating-demo');
			points = mod.simulateCareer(SEASON);
		}
		if (drawn > 0) return;
		if (prefersReducedMotion()) {
			drawn = points.length;
			return;
		}
		stop = tween(0, points.length, 1700, (v) => (drawn = v));
	}

	$effect(() => () => stop?.());

	// --- Geometrie ---
	const W = 620;
	const H = 210;
	const PAD_L = 6;
	const PAD_R = 6;
	const PAD_T = 14;
	const PAD_B = 26;

	const lo = $derived(points.length ? Math.min(...points.map((p) => p.rating)) - 0.35 : 0);
	const hi = $derived(points.length ? Math.max(...points.map((p) => p.rating)) + 0.35 : 1);

	const xOf = (i: number) => PAD_L + ((W - PAD_L - PAD_R) * i) / Math.max(1, SEASON.length - 1);
	const yOf = (r: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - (r - lo) / Math.max(0.01, hi - lo));

	const line = $derived(
		points.map((p, i) => (i === 0 ? 'M' : 'L') + xOf(i) + ' ' + yOf(p.rating).toFixed(1)).join(' ')
	);
	const area = $derived(
		points.length ? `${line} L${xOf(points.length - 1)} ${H - PAD_B} L${xOf(0)} ${H - PAD_B} Z` : ''
	);

	/** Grenze der provisorischen Phase (12 Matches, PROVISIONAL_MATCHES). */
	const provX = $derived(xOf(11));

	const active = $derived(
		selected !== null && points[selected] ? points[selected] : (points.at(-1) ?? null)
	);

	function pick(i: number) {
		selected = i;
	}
	function key(e: KeyboardEvent, i: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(i);
		} else if (e.key === 'ArrowRight' && i < points.length - 1) {
			e.preventDefault();
			pick(i + 1);
			(e.currentTarget as SVGElement).parentElement
				?.querySelectorAll<SVGElement>('.rj-hit')
				[i + 1]?.focus();
		} else if (e.key === 'ArrowLeft' && i > 0) {
			e.preventDefault();
			pick(i - 1);
			(e.currentTarget as SVGElement).parentElement
				?.querySelectorAll<SVGElement>('.rj-hit')
				[i - 1]?.focus();
		}
	}

	const score = (p: CareerPoint) => p.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join('  ');
</script>

<div class="rj" use:whenVisible={{ onVisible: begin, threshold: 0.25 }}>
	<div class="rj-chart">
		<svg
			viewBox="0 0 {W} {H}"
			role="img"
			aria-label={m.rj_svg_aria({
				count: SEASON.length,
				from: points[0]?.rating.toFixed(2) ?? '',
				to: points.at(-1)?.rating.toFixed(2) ?? ''
			})}
		>
			<defs>
				<linearGradient id="rjGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#16A394" stop-opacity=".30" />
					<stop offset="100%" stop-color="#16A394" stop-opacity="0" />
				</linearGradient>
				<clipPath id="rjClip">
					<rect x="0" y="0" width={(drawn / SEASON.length) * W} height={H} />
				</clipPath>
			</defs>

			<!-- provisorische Phase -->
			{#if points.length}
				<rect class="rj-prov" x="0" y={PAD_T - 6} width={provX} height={H - PAD_T - PAD_B + 6} />
				<line class="rj-provline" x1={provX} y1={PAD_T - 6} x2={provX} y2={H - PAD_B} />
				<text class="rj-provtxt" x={provX - 8} y={PAD_T + 4} text-anchor="end"
					>{m.lab_provisional()}</text
				>
			{/if}

			<line class="rj-axis" x1="0" y1={H - PAD_B} x2={W} y2={H - PAD_B} />

			{#if points.length}
				<g clip-path="url(#rjClip)">
					<path class="rj-area" d={area} />
					<path class="rj-line" d={line} />
				</g>

				{#each points as p, i (p.index)}
					{#if i < drawn}
						<g
							class="rj-hit"
							class:on={active?.index === p.index}
							role="button"
							tabindex="0"
							aria-label={m.rj_hit_aria({
								index: p.index,
								result: p.won ? m.rj_won() : m.rj_lost(),
								score: score(p),
								rating: p.rating.toFixed(2)
							})}
							onclick={() => pick(i)}
							onkeydown={(e) => key(e, i)}
							onmouseenter={() => pick(i)}
						>
							<circle class="rj-halo" cx={xOf(i)} cy={yOf(p.rating)} r="13" />
							<circle
								class="rj-dot"
								class:lost={!p.won}
								cx={xOf(i)}
								cy={yOf(p.rating)}
								r={active?.index === p.index ? 5.5 : 3.6}
							/>
						</g>
					{/if}
				{/each}

				<!-- Endpunkt-Markierung -->
				{#if drawn >= points.length}
					<text
						class="rj-here"
						x={xOf(points.length - 1)}
						y={yOf(points.at(-1)!.rating) - 16}
						text-anchor="end"
					>
						{m.rj_here()}
					</text>
				{/if}
			{/if}
		</svg>
	</div>

	<aside class="rj-detail" aria-live="polite">
		{#if active}
			<div class="rj-dhead">
				<span class="rj-dnum num">{m.rj_match_number({ index: active.index })}</span>
				<span class="rj-dres num" class:won={active.won}>
					{active.won ? m.rj_won_label() : m.rj_lost_label()}
				</span>
			</div>

			<div class="rj-drow">
				<span>{m.lab_result_label()}</span>
				<span class="num">{score(active)}</span>
			</div>
			<div class="rj-drow">
				<span>{m.rj_opponent_label()}</span>
				<span class="num">{active.opponents[0].toFixed(2)} · {active.opponents[1].toFixed(2)}</span>
			</div>
			<div class="rj-drow">
				<span>{m.hseq_partner()}</span>
				<span class="num">{active.partner.toFixed(2)}</span>
			</div>

			<div class="rj-dout">
				<div>
					<span class="rj-dlabel">{m.rj_after_label()}</span>
					<span class="rj-dbig num">{active.rating.toFixed(2)}</span>
				</div>
				<span class="rj-ddelta num" class:up={active.delta > 0} class:down={active.delta < 0}>
					{active.delta > 0 ? '+' : active.delta < 0 ? '−' : ''}{Math.abs(active.delta).toFixed(2)}
				</span>
			</div>

			{#if active.provisional}
				<p class="rj-dnote">
					{m.rj_provisional_note()}
				</p>
			{/if}
		{/if}
		<p class="rj-hint">{m.rj_hint()}</p>
	</aside>
</div>

<style>
	.rj {
		display: grid;
		grid-template-columns: 1.5fr 0.5fr;
		gap: clamp(18px, 3vw, 38px);
		align-items: center;
		margin-top: 46px;
	}
	@media (max-width: 860px) {
		.rj {
			grid-template-columns: 1fr;
			gap: 22px;
		}
	}

	.rj-chart,
	.rj-detail {
		min-width: 0;
	}
	.rj-chart svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}
	.rj-axis {
		stroke: var(--line-light);
		stroke-width: 1;
	}
	.rj-area {
		fill: url(#rjGrad);
	}
	.rj-line {
		fill: none;
		stroke: var(--court-deep);
		stroke-width: 2.4;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.rj-prov {
		fill: rgba(180, 113, 26, 0.06);
	}
	.rj-provline {
		stroke: rgba(180, 113, 26, 0.4);
		stroke-width: 1;
		stroke-dasharray: 3 4;
	}
	.rj-provtxt {
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		fill: #8f5a15;
	}
	.rj-here {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		fill: var(--court-deep);
	}

	.rj-hit {
		cursor: pointer;
		outline: none;
	}
	.rj-halo {
		fill: transparent;
	}
	.rj-dot {
		fill: #fff;
		stroke: var(--court-deep);
		stroke-width: 2.2;
		transition: r 0.18s ease;
	}
	.rj-dot.lost {
		stroke: #c98a2e;
	}
	.rj-hit:focus-visible .rj-halo {
		fill: color-mix(in srgb, var(--court-deep) 16%, transparent);
		stroke: var(--court-deep);
		stroke-width: 1.5;
	}

	/* --- Detail --- */
	.rj-detail {
		border: 1px solid var(--line-light);
		border-radius: 16px;
		padding: 18px;
		background: #fff;
	}
	.rj-dhead {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--line-light);
	}
	.rj-dnum {
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.rj-dres {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8f5a15;
	}
	.rj-dres.won {
		color: var(--court-deep);
	}
	.rj-drow {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		margin-top: 10px;
		font-size: 12.5px;
		color: var(--muted-light);
	}
	.rj-drow .num {
		color: var(--ink);
	}
	.rj-dout {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 10px;
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--line-light);
	}
	.rj-dlabel {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.rj-dbig {
		display: block;
		font-size: 30px;
		letter-spacing: -0.04em;
		line-height: 1.1;
		margin-top: 4px;
		color: var(--ink);
	}
	.rj-ddelta {
		font-size: 16px;
		padding-bottom: 4px;
		color: var(--muted-light);
	}
	.rj-ddelta.up {
		color: var(--court-deep);
	}
	.rj-ddelta.down {
		color: #8f5a15;
	}
	.rj-dnote {
		margin-top: 12px;
		font-size: 11.5px;
		line-height: 1.5;
		color: #8f5a15;
	}
	.rj-hint {
		margin-top: 14px;
		padding-top: 12px;
		border-top: 1px solid var(--line-light);
		font-size: 11px;
		color: var(--muted-light);
	}
</style>
