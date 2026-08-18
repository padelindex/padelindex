<script lang="ts">
	// ============================================================
	// Index Tokens — Spielen, sammeln, beim Verein einlösen
	// ============================================================
	// Bewusst als Sport-Bonusprogramm gezeigt, nicht als Währung: keine
	// Kurse, keine Wallets, kein Handel. Die Beträge sind keine
	// Marketingzahlen, sondern die Regeln aus computeTokenGrants() im
	// Produktivcode — die Tabelle unten spiegelt exakt, was nach einem
	// bestätigten Match gutgeschrieben wird.

	import { whenVisible } from '$lib/landing/reveal';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import { SEASON, SEASON_WINS, SEASON_MATCHES } from '$lib/landing/season';

	type Mod = typeof import('$lib/landing/rating-demo');
	let seasonTotal = $state(0);

	// Dieselbe Saison wie im Rating-Verlauf — geteilte Quelle, damit die
	// beiden Abschnitte nicht auseinanderlaufen.
	async function begin() {
		const mod: Mod = await import('$lib/landing/rating-demo');
		seasonTotal = mod.simulateSeasonTokens(SEASON);
	}

	const EARN = [
		{ label: 'Match gespielt', why: 'jedes bestätigte Ergebnis', amt: '+10' },
		{ label: 'Match gewonnen', why: 'zusätzlich zum Grundwert', amt: '+15' },
		{ label: 'Vereinsliga oder Turnier', why: 'offiziell erfasste Partie', amt: '+10' },
		{ label: '10., 25., 50. Match …', why: 'Meilenstein', amt: '+100' },
		{ label: 'Fünf Siege in Folge', why: 'Serie', amt: '+50' }
	];

	const NEVER = [
		'Kein Handel zwischen Spielern',
		'Keine Auszahlung, kein Kurs',
		'Niederlagen kosten nie Tokens',
		'Erst nach Bestätigung gutgeschrieben'
	];

	const STEPS = [
		{ n: '01', t: 'Spielen', d: 'Ergebnis eintragen, Gegnerteam bestätigt.' },
		{ n: '02', t: 'Sammeln', d: 'Tokens werden automatisch gutgeschrieben.' },
		{ n: '03', t: 'Einlösen', d: 'Beim eigenen Verein — Training, Bälle, Startgeld.' }
	];
</script>

<div class="tf" use:whenVisible={{ onVisible: begin, threshold: 0.2 }}>
	<!-- Ablauf -->
	<ol class="tf-steps">
		{#each STEPS as s, i (s.n)}
			<li class="tf-step">
				<span class="tf-n num">{s.n}</span>
				<h3>{s.t}</h3>
				<p>{s.d}</p>
				{#if i < STEPS.length - 1}
					<svg class="tf-arrow" viewBox="0 0 24 10" aria-hidden="true">
						<path d="M0 5h19M14.5 1L19 5l-4.5 4" />
					</svg>
				{/if}
			</li>
		{/each}
	</ol>

	<div class="tf-grid">
		<!-- Was es gibt -->
		<div class="tf-earn">
			<div class="tf-erow tf-ehead">
				<span>Gutschrift</span><span>Tokens</span>
			</div>
			{#each EARN as e (e.label)}
				<div class="tf-erow">
					<div>
						<div class="tf-el">{e.label}</div>
						<div class="tf-ew">{e.why}</div>
					</div>
					<div class="tf-ea num">{e.amt}</div>
				</div>
			{/each}
			<div class="tf-total">
				<div>
					<div class="tf-el">Eine Saison: {SEASON_MATCHES} Matches, {SEASON_WINS} Siege</div>
					<div class="tf-ew">gerechnet mit den Regeln oben</div>
				</div>
				<div class="tf-tval num">
					<AnimatedNumber value={seasonTotal} decimals={0} duration={1100} />
				</div>
			</div>
		</div>

		<!-- Was es nicht ist -->
		<div class="tf-side">
			<span class="tf-slabel">Was Tokens nicht sind</span>
			<ul class="tf-never">
				{#each NEVER as n (n)}
					<li>
						<svg viewBox="0 0 14 14" aria-hidden="true">
							<path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
						</svg>
						{n}
					</li>
				{/each}
			</ul>
			<p class="tf-note">
				Ein Guthaben bei deinem Verein — vergleichbar mit Bonusmeilen. Der Verein legt fest, was es
				dafür gibt; PadelIndex zählt nur mit.
			</p>
		</div>
	</div>
</div>

<style>
	.tf {
		margin-top: 46px;
	}

	.tf-steps {
		list-style: none;
		margin: 0 0 40px;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(14px, 2.6vw, 30px);
	}
	@media (max-width: 720px) {
		.tf-steps {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
	.tf-step {
		position: relative;
		padding-top: 16px;
		border-top: 2px solid var(--court-deep);
	}
	.tf-n {
		font-size: 10.5px;
		letter-spacing: 0.12em;
		color: var(--court);
	}
	.tf-step h3 {
		font-size: 20px;
		margin: 10px 0 8px;
	}
	.tf-step p {
		font-size: 13.5px;
		color: var(--muted-dark);
		line-height: 1.55;
	}
	.tf-arrow {
		position: absolute;
		top: -6px;
		right: calc(-1 * clamp(14px, 2.6vw, 30px) / 2 - 6px);
		width: 14px;
		height: 8px;
		fill: none;
		stroke: var(--line-dark);
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	@media (max-width: 720px) {
		.tf-arrow {
			display: none;
		}
	}

	.tf-grid {
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: clamp(20px, 3.4vw, 48px);
		align-items: start;
	}
	@media (max-width: 860px) {
		.tf-grid {
			grid-template-columns: 1fr;
		}
	}

	.tf-earn,
	.tf-side {
		min-width: 0;
	}
	.tf-earn {
		border: 1px solid var(--line-dark);
		border-radius: 16px;
		overflow: hidden;
	}
	.tf-erow {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
		padding: 13px 18px;
		border-bottom: 1px solid var(--line-dark);
		font-size: 14px;
	}
	.tf-ehead {
		background: rgba(239, 242, 237, 0.045);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.tf-ew {
		color: var(--muted-dark);
		font-size: 12px;
		margin-top: 2px;
	}
	.tf-ea {
		font-size: 15px;
		color: var(--court);
		white-space: nowrap;
	}
	.tf-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		background: color-mix(in srgb, var(--court) 10%, transparent);
	}
	.tf-total .tf-el {
		font-weight: 600;
	}
	.tf-tval {
		font-size: 26px;
		letter-spacing: -0.03em;
		color: var(--court);
		white-space: nowrap;
	}

	.tf-slabel {
		display: block;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.tf-never {
		list-style: none;
		padding: 0;
		margin: 16px 0 0;
	}
	.tf-never li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 9px 0;
		border-bottom: 1px solid var(--line-dark);
		font-size: 13.5px;
		color: var(--chalk);
	}
	.tf-never li:last-child {
		border-bottom: 0;
	}
	.tf-never svg {
		width: 13px;
		height: 13px;
		flex: none;
		margin-top: 3px;
		fill: none;
		stroke: var(--sand);
		stroke-width: 1.8;
		stroke-linecap: round;
	}
	.tf-note {
		margin-top: 16px;
		font-size: 12.5px;
		line-height: 1.6;
		color: var(--muted-dark);
	}
</style>
