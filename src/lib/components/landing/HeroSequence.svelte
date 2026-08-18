<script lang="ts">
	// ============================================================
	// Hero-Sequenz: Match -> Bestätigung -> Rating
	// ============================================================
	// Der Kern der ersten 20 Sekunden. Statt zu erklären, wie PadelIndex
	// funktioniert, läuft es einmal ab: gespielt, vom Gegnerteam bestätigt,
	// Wert neu berechnet.
	//
	// Die Zahlen sind KEINE Fantasiewerte: sie stammen aus einem Lauf von
	// computeMatchRatings() (dem Produktivmodell) mit den unten stehenden
	// Spielern und werden hier fest hinterlegt, damit die Startseite
	// openskill nicht schon beim ersten Rendern laden muss. Der Simulator
	// weiter unten rechnet dann live mit demselben Code.
	//
	// Läuft bewusst EINMAL beim Sichtbarwerden und bietet danach eine
	// Wiederholung an — keine Dauerschleife im Hintergrund.

	import { sequence, prefersReducedMotion } from '$lib/landing/motion';
	import { whenVisible } from '$lib/landing/reveal';
	import AnimatedNumber from './AnimatedNumber.svelte';

	const TEAM_YOU = [
		{ label: 'Du', rating: 4.41, after: 4.68, delta: 0.27 },
		{ label: 'Partner', rating: 4.35, after: 4.59, delta: 0.24 }
	];
	const TEAM_OPP = [
		{ label: 'Gegner', rating: 4.78, after: 4.6, delta: -0.18 },
		{ label: 'Gegner', rating: 4.71, after: 4.51, delta: -0.2 }
	];
	const SETS = [
		{ a: 6, b: 4 },
		{ a: 6, b: 3 }
	];

	// Schritt 0 Aufstellung · 1 Ergebnis · 2 Bestätigungen · 3 Rating
	let step = $state(0);
	let confirmed = $state(0);
	let started = $state(false);
	let stop: (() => void) | undefined;

	const STAGE_LABEL = [
		'Match gespielt',
		'Ergebnis eingetragen',
		'Vom Gegnerteam bestätigt',
		'Rating aktualisiert'
	];

	function play() {
		stop?.();
		step = 0;
		confirmed = 0;

		if (prefersReducedMotion()) {
			step = 3;
			confirmed = 4;
			return;
		}

		stop = sequence([420, 900, 380, 380, 380, 420, 700], (i) => {
			// Indizes: 0 Aufstellung, 1 Ergebnis, 2–5 die vier Haken, 6 Rating
			if (i === 0) step = 0;
			else if (i === 1) step = 1;
			else if (i >= 2 && i <= 5) {
				step = 2;
				confirmed = i - 1;
			} else if (i === 6) step = 3;
		});
	}

	function start() {
		if (started) return;
		started = true;
		play();
	}

	$effect(() => () => stop?.());
</script>

<div class="hseq" use:whenVisible={{ onVisible: start, threshold: 0.35 }} data-step={step}>
	<div class="hseq-top">
		<span class="hseq-kicker">Ein Match, wie es zählt</span>
		<span class="hseq-stage num" aria-live="polite">{STAGE_LABEL[step]}</span>
	</div>

	<!-- Aufstellung -->
	<div class="hseq-teams">
		<div class="hseq-team" class:win={step >= 1}>
			<span class="hseq-tlabel">Dein Team</span>
			{#each TEAM_YOU as p, i (p.label)}
				<div class="hseq-p" class:hseq-me={i === 0}>
					<span class="hseq-nm">{p.label}</span>
					<span class="hseq-rt num">
						{#if step >= 3 && i === 0}
							<AnimatedNumber value={p.after} duration={900} />
						{:else}
							{p.rating.toFixed(2)}
						{/if}
					</span>
				</div>
			{/each}
		</div>

		<div class="hseq-vs" aria-hidden="true">
			{#if step >= 1}
				<div class="hseq-score">
					{#each SETS as s, i (i)}
						<span class="hseq-set num" style="animation-delay:{i * 90}ms">
							{s.a}<i>:</i>{s.b}
						</span>
					{/each}
				</div>
			{:else}
				<span class="hseq-vs-txt num">vs</span>
			{/if}
		</div>

		<div class="hseq-team" class:lose={step >= 1}>
			<span class="hseq-tlabel">Gegnerteam</span>
			{#each TEAM_OPP as p, i (i)}
				<div class="hseq-p">
					<span class="hseq-nm">{p.label}</span>
					<span class="hseq-rt num">{p.rating.toFixed(2)}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Bestätigung: vier Spieler, vier Haken -->
	<div class="hseq-confirm" class:on={step >= 2}>
		<span class="hseq-clabel">
			{step >= 3 ? 'Bestätigt' : 'Bestätigung'}
		</span>
		<div class="hseq-checks">
			{#each ['Du', 'Partner', 'Gegner', 'Gegner'] as name, i (i)}
				<span class="hseq-check" class:ok={confirmed > i}>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="M3.5 8.5l3 3 6-7" />
					</svg>
					{name}
				</span>
			{/each}
		</div>
	</div>

	<!-- Ergebnis der Rechnung -->
	<div class="hseq-out" class:on={step >= 3}>
		<div>
			<span class="hseq-olabel">Dein Level</span>
			<div class="hseq-oval">
				<span class="num hseq-old">4.41</span>
				<svg class="hseq-arrow" viewBox="0 0 24 12" aria-hidden="true">
					<path d="M0 6h20M15 1.5L20.5 6 15 10.5" />
				</svg>
				<span class="num hseq-new">
					{#if step >= 3}
						<AnimatedNumber value={4.68} duration={900} />
					{:else}
						4.41
					{/if}
				</span>
			</div>
		</div>
		<span class="hseq-delta num">+0.27</span>
	</div>

	<div class="hseq-foot">
		<p class="hseq-note">
			Gerechnet mit dem Modell, das auch produktiv läuft — Gegnerstärke, Satzverlauf und wie gut das
			System dich schon kennt.
		</p>
		<button class="hseq-replay" type="button" onclick={play}>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				<path d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 1.5V5H10" />
			</svg>
			Nochmal
		</button>
	</div>
</div>

<style>
	.hseq {
		position: relative;
		border-radius: 20px;
		padding: clamp(20px, 2.3vw, 28px);
		background: linear-gradient(168deg, rgba(239, 242, 237, 0.075), rgba(239, 242, 237, 0.02));
		border: 1px solid var(--line-dark);
		box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	.hseq-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 14px;
		margin-bottom: 20px;
	}
	.hseq-kicker {
		font-size: 13.5px;
		font-weight: 600;
	}
	.hseq-stage {
		font-size: 10.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--court);
	}

	/* --- Aufstellung --- */
	.hseq-teams {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: clamp(8px, 2vw, 18px);
		align-items: center;
	}
	.hseq-tlabel {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
		margin-bottom: 10px;
	}
	.hseq-p {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		padding: 7px 0;
		border-bottom: 1px solid var(--line-dark);
	}
	.hseq-p:last-child {
		border-bottom: 0;
	}
	.hseq-nm {
		font-size: 13px;
		color: var(--muted-dark);
	}
	.hseq-me .hseq-nm {
		color: var(--chalk);
		font-weight: 600;
	}
	.hseq-rt {
		font-size: 15px;
		transition: color 0.4s;
	}
	.hseq-me .hseq-rt {
		font-size: 17px;
	}
	.hseq-team.win .hseq-me .hseq-rt {
		color: var(--court);
	}

	.hseq-vs {
		display: grid;
		place-items: center;
		min-width: 62px;
		align-self: stretch;
	}
	.hseq-vs-txt {
		font-size: 11px;
		color: var(--muted-dark);
		letter-spacing: 0.1em;
	}
	.hseq-score {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.hseq-set {
		font-size: 15px;
		letter-spacing: -0.02em;
		animation: setIn 0.45s cubic-bezier(0.22, 0.61, 0.36, 1) both;
	}
	.hseq-set i {
		font-style: normal;
		color: var(--muted-dark);
		margin: 0 1px;
	}
	@keyframes setIn {
		from {
			opacity: 0;
			transform: scale(0.82);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* --- Bestätigung --- */
	.hseq-confirm {
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--line-dark);
		opacity: 0.4;
		transition: opacity 0.4s;
	}
	.hseq-confirm.on {
		opacity: 1;
	}
	.hseq-clabel {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.hseq-checks {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		margin-top: 10px;
	}
	.hseq-check {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px 5px 7px;
		border-radius: 100px;
		border: 1px solid var(--line-dark);
		font-size: 12px;
		color: var(--muted-dark);
		transition:
			border-color 0.3s,
			color 0.3s,
			background 0.3s;
	}
	.hseq-check svg {
		width: 13px;
		height: 13px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.1;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 16;
		stroke-dashoffset: 16;
		opacity: 0.35;
	}
	.hseq-check.ok {
		border-color: color-mix(in srgb, var(--court) 55%, transparent);
		color: var(--chalk);
		background: color-mix(in srgb, var(--court) 12%, transparent);
	}
	.hseq-check.ok svg {
		stroke: var(--court);
		opacity: 1;
		animation: tick 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
	}
	@keyframes tick {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* --- Rating --- */
	.hseq-out {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		margin-top: 18px;
		padding: 16px 18px;
		border-radius: 14px;
		background: color-mix(in srgb, var(--court) 9%, transparent);
		border: 1px solid color-mix(in srgb, var(--court) 22%, transparent);
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 0.5s,
			transform 0.5s;
	}
	.hseq-out.on {
		opacity: 1;
		transform: none;
	}
	.hseq-olabel {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.hseq-oval {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-top: 6px;
	}
	.hseq-old {
		font-size: 20px;
		color: var(--muted-dark);
	}
	.hseq-arrow {
		width: 22px;
		height: 11px;
		fill: none;
		stroke: var(--muted-dark);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
		align-self: center;
	}
	.hseq-new {
		font-size: clamp(30px, 4vw, 40px);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 1;
		color: var(--court);
	}
	.hseq-delta {
		font-size: 17px;
		color: var(--court);
		padding-bottom: 3px;
	}

	/* --- Fuß --- */
	.hseq-foot {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 14px;
		margin-top: 16px;
	}
	.hseq-note {
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted-dark);
		max-width: 42ch;
	}
	.hseq-replay {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--line-dark);
		color: var(--muted-dark);
		border-radius: 100px;
		padding: 9px 14px;
		min-height: 36px;
		font-family: var(--body);
		font-size: 12px;
		cursor: pointer;
		transition:
			color 0.2s,
			border-color 0.2s;
	}
	.hseq-replay:hover {
		color: var(--court);
		border-color: var(--court);
	}
	.hseq-replay svg {
		width: 12px;
		height: 12px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@media (max-width: 520px) {
		.hseq-teams {
			grid-template-columns: 1fr;
			gap: 14px;
		}
		.hseq-vs {
			order: 3;
			min-width: 0;
		}
		.hseq-score {
			flex-direction: row;
			gap: 14px;
		}
		.hseq-foot {
			flex-direction: column;
			align-items: stretch;
		}
		.hseq-replay {
			align-self: flex-start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hseq-set,
		.hseq-check.ok svg {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
