<script lang="ts">
	// ============================================================
	// "Warum sinkt mein Level, wenn mein Partner einen schlechten Tag hat?"
	// ============================================================
	// Der Einwand, den man auf jedem Platz hört — hier nicht beantwortet,
	// sondern vorgerechnet. Zweimal dasselbe Ergebnis gegen dieselben
	// Gegner, einmal mit schwächerem und einmal mit stärkerem Partner.
	//
	// Die Zahlen kommen live aus computeMatchRatings(), dem Produktivmodell.
	// Sie sind nicht illustrativ: mit schwachem Partner zu gewinnen bringt
	// mehr, mit schwachem Partner zu verlieren kostet weniger — weil das
	// Modell die Siegwahrscheinlichkeit des ganzen Teams kennt.

	import { whenVisible } from '$lib/landing/reveal';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import { m } from '$lib/paraglide/messages.js';

	type Mod = typeof import('$lib/landing/rating-demo');
	let mod = $state<Mod | null>(null);

	async function loadModel() {
		if (mod) return;
		mod = await import('$lib/landing/rating-demo');
	}

	let won = $state(true);

	const WIN = [
		{ team1Games: 6, team2Games: 4 },
		{ team1Games: 6, team2Games: 3 }
	];
	const LOSS = [
		{ team1Games: 4, team2Games: 6 },
		{ team1Games: 3, team2Games: 6 }
	];

	const OPPONENTS = [
		{ id: 'o1', name: 'Gegner 1', display: 4.5, matches: 20 },
		{ id: 'o2', name: 'Gegner 2', display: 4.6, matches: 20 }
	];

	const SCENARIOS = [
		{ key: 'weak', partner: 3.2, label: m.pp_scenario_weak() },
		{ key: 'strong', partner: 5.6, label: m.pp_scenario_strong() }
	];

	function outcome(partnerRating: number) {
		if (!mod) return null;
		const res = mod.simulateMatch(
			[
				{ id: 'you', name: 'Du', display: 4.8, matches: 20 },
				{ id: 'p', name: 'Partner', display: partnerRating, matches: 20 }
			],
			OPPONENTS,
			won ? WIN : LOSS
		);
		return res.find((r) => r.id === 'you') ?? null;
	}

	const results = $derived(SCENARIOS.map((s) => ({ ...s, out: outcome(s.partner) })));
</script>

<div class="pp" use:whenVisible={{ onVisible: loadModel, threshold: 0.15 }}>
	<div class="pp-head">
		<p class="pp-q">
			{m.pp_q_pre()} <em>{m.pp_q_em()}</em>
			{m.pp_q_post()}
		</p>
		<div class="pp-toggle" role="group" aria-label={m.pp_toggle_aria()}>
			<button type="button" class:on={won} onclick={() => (won = true)} aria-pressed={won}>
				{m.pp_won()}
			</button>
			<button type="button" class:on={!won} onclick={() => (won = false)} aria-pressed={!won}>
				{m.pp_lost()}
			</button>
		</div>
	</div>

	<p class="pp-setup">
		{m.pp_setup_p1()} <b class="num">4.80</b>{m.pp_setup_p2()}
		<b class="num">4.50</b>
		{m.pp_setup_and()} <b class="num">4.60</b>{m.pp_setup_p3()}
		<b class="num">{won ? '6:4 6:3' : '4:6 3:6'}</b>{m.pp_setup_p4()}
	</p>

	<div class="pp-grid">
		{#each results as s (s.key)}
			<div
				class="pp-card"
				class:pp-fav={s.out && !won ? s.out.delta > -0.17 : s.out && s.out.delta > 0.2}
			>
				<span class="pp-label">{s.label}</span>

				<div class="pp-pair">
					<div class="pp-pl pp-you">
						<span class="pp-nm">{m.pp_you_label()}</span>
						<span class="pp-rt num">4.80</span>
					</div>
					<span class="pp-plus" aria-hidden="true">+</span>
					<div class="pp-pl">
						<span class="pp-nm">{m.pp_partner_label()}</span>
						<span class="pp-rt num">{s.partner.toFixed(2)}</span>
					</div>
				</div>

				{#if s.out}
					<div class="pp-prob">
						<span>{m.pp_win_prob_label()}</span>
						<span class="num">{Math.round(s.out.factors.expectedWinProb * 100)}%</span>
					</div>
					<div class="pp-probbar" aria-hidden="true">
						<i style="width:{s.out.factors.expectedWinProb * 100}%"></i>
					</div>

					<div class="pp-out">
						<span class="pp-olabel">{m.pp_outcome_label()}</span>
						<span class="pp-delta num" class:up={s.out.delta > 0} class:down={s.out.delta < 0}>
							<AnimatedNumber value={s.out.delta} decimals={2} signed duration={650} />
						</span>
					</div>
				{:else}
					<div class="pp-skel" aria-hidden="true"></div>
				{/if}
			</div>
		{/each}
	</div>

	<p class="pp-verdict">
		{#if won}
			{m.pp_verdict_won()}
		{:else}
			{m.pp_verdict_lost()}
		{/if}
	</p>
</div>

<style>
	.pp {
		margin-top: 44px;
		border: 1px solid var(--line-dark);
		border-radius: 18px;
		padding: clamp(18px, 2.4vw, 28px);
		background: color-mix(in srgb, var(--chalk) 4%, transparent);
	}
	.pp-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 18px;
		flex-wrap: wrap;
	}
	.pp-q {
		font-family: var(--display);
		font-size: clamp(18px, 2.1vw, 24px);
		line-height: 1.3;
		letter-spacing: -0.02em;
		max-width: 34ch;
	}
	.pp-q em {
		font-style: normal;
		color: var(--court);
	}
	.pp-toggle {
		display: inline-flex;
		border: 1px solid var(--line-dark);
		border-radius: 100px;
		padding: 3px;
		flex: none;
	}
	.pp-toggle button {
		border: 0;
		background: transparent;
		color: var(--muted-dark);
		font-family: var(--body);
		font-size: 12.5px;
		font-weight: 600;
		padding: 10px 16px;
		min-height: 38px;
		border-radius: 100px;
		cursor: pointer;
		transition:
			background 0.25s,
			color 0.25s;
	}
	.pp-toggle button.on {
		background: var(--court);
		color: #04231f;
	}

	.pp-setup {
		margin-top: 16px;
		font-size: 13.5px;
		color: var(--muted-dark);
		line-height: 1.6;
	}
	.pp-setup b {
		color: var(--chalk);
		font-weight: 500;
	}

	.pp-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(12px, 2vw, 20px);
		margin-top: 22px;
	}
	@media (max-width: 620px) {
		.pp-grid {
			grid-template-columns: 1fr;
		}
	}

	.pp-card {
		min-width: 0;
		border: 1px solid var(--line-dark);
		border-radius: 14px;
		padding: 16px 18px 18px;
		transition:
			border-color 0.4s,
			background 0.4s;
	}
	.pp-card.pp-fav {
		border-color: color-mix(in srgb, var(--court) 45%, transparent);
		background: color-mix(in srgb, var(--court) 7%, transparent);
	}
	.pp-label {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
	}
	.pp-pair {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
	}
	.pp-pl {
		flex: 1;
		min-width: 0;
	}
	.pp-nm {
		display: block;
		font-size: 11.5px;
		color: var(--muted-dark);
	}
	.pp-you .pp-nm {
		color: var(--chalk);
		font-weight: 600;
	}
	.pp-rt {
		display: block;
		font-size: 21px;
		letter-spacing: -0.03em;
		margin-top: 2px;
	}
	.pp-plus {
		color: var(--muted-dark);
		font-size: 14px;
		flex: none;
	}

	.pp-prob {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		margin-top: 18px;
		font-size: 11.5px;
		color: var(--muted-dark);
	}
	.pp-probbar {
		height: 4px;
		border-radius: 2px;
		background: var(--line-dark);
		overflow: hidden;
		margin-top: 5px;
	}
	.pp-probbar i {
		display: block;
		height: 100%;
		background: var(--sand);
		transition: width 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
	}

	.pp-out {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 10px;
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--line-dark);
	}
	.pp-olabel {
		font-size: 11.5px;
		color: var(--muted-dark);
		padding-bottom: 4px;
	}
	.pp-delta {
		font-size: clamp(24px, 3.2vw, 32px);
		letter-spacing: -0.04em;
		line-height: 1;
	}
	.pp-delta.up {
		color: var(--court);
	}
	.pp-delta.down {
		color: var(--signal);
	}
	.pp-skel {
		height: 92px;
		margin-top: 16px;
		border-radius: 8px;
		background: var(--line-dark);
		opacity: 0.4;
	}

	.pp-verdict {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--line-dark);
		font-size: 14px;
		line-height: 1.6;
		color: var(--muted-dark);
		max-width: 68ch;
	}
</style>
