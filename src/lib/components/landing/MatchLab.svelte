<script lang="ts">
	// ============================================================
	// Match-Simulator — das Herzstück der Seite
	// ============================================================
	// Rechnet mit computeMatchRatings() aus $lib/rating-core, also mit
	// GENAU dem Code, der auch produktiv die Ratings vergibt. Keine
	// nachgebaute Formel, keine geschätzten Werte: was hier steht, würde
	// ein echtes Match auch auslösen.
	//
	// Frei einstellbar sind die Ausgangswerte (Rating und Matchzahl der
	// vier Spieler) und das Ergebnis. Die Matchzahl steuert sigma — die
	// Unsicherheit — und ist damit der Hebel, der den Doppel-Effekt
	// sichtbar macht: wen das System schlechter kennt, dessen Wert bewegt
	// sich stärker.
	//
	// openskill (~11 kB gzip) wird erst geladen, wenn der Abschnitt in
	// Sichtweite kommt — die Startseite soll davon nichts merken.

	import { whenVisible } from '$lib/landing/reveal';
	import type { DemoOutcome, DemoPlayer, SetScore } from '$lib/landing/rating-demo';
	import AnimatedNumber from './AnimatedNumber.svelte';

	type Mod = typeof import('$lib/landing/rating-demo');

	let mod = $state<Mod | null>(null);
	let loading = $state(false);

	async function loadModel() {
		if (mod || loading) return;
		loading = true;
		mod = await import('$lib/landing/rating-demo');
		loading = false;
		preview();
	}

	// --- Eingaben ---
	let team1 = $state<DemoPlayer[]>([
		{ id: 'you', name: 'Du', display: 4.2, matches: 14 },
		{ id: 'partner', name: 'Partner', display: 4.1, matches: 26 }
	]);
	let team2 = $state<DemoPlayer[]>([
		{ id: 'opp1', name: 'Gegner 1', display: 4.7, matches: 22 },
		{ id: 'opp2', name: 'Gegner 2', display: 4.6, matches: 18 }
	]);
	let sets = $state<{ a: number; b: number }[]>([
		{ a: 6, b: 4 },
		{ a: 6, b: 3 }
	]);

	const asSets = (): SetScore[] => sets.map((s) => ({ team1Games: s.a, team2Games: s.b }));

	// --- Ausgaben ---
	let result = $state<DemoOutcome[] | null>(null);
	let winProb = $state(0.5);
	let dominance = $state(0);
	let computed = $state(false);

	/** Läuft bei jeder Änderung: zeigt Siegchance/Deutlichkeit schon vorab. */
	function preview() {
		if (!mod) return;
		const out = mod.simulateMatch(team1, team2, asSets());
		winProb = out[0]?.factors.expectedWinProb ?? 0.5;
		dominance = out[0]?.factors.dominance ?? 0;
	}

	function calculate() {
		if (!mod) return;
		result = mod.simulateMatch(team1, team2, asSets());
		computed = true;
	}

	// Eingaben ändern -> altes Ergebnis ist nicht mehr gültig.
	function touched() {
		computed = false;
		result = null;
		preview();
	}

	function setGames(i: number, side: 'a' | 'b', delta: number) {
		const next = Math.max(0, Math.min(9, sets[i][side] + delta));
		sets[i][side] = next;
		touched();
	}

	function addSet() {
		if (sets.length >= 3) return;
		sets.push({ a: 6, b: 4 });
		touched();
	}

	function removeSet() {
		if (sets.length <= 1) return;
		sets.pop();
		touched();
	}

	const winner = $derived(mod ? mod.winnerOf(asSets()) : 1);

	// Wie weit ist der Balken? Delta auf 0..1, 0.5 = keine Änderung.
	const maxAbs = $derived(result ? Math.max(0.05, ...result.map((r) => Math.abs(r.delta))) : 0.05);

	/** Sicherheit des Spielers: aus der Matchzahl über das echte sigma. */
	function confidenceOf(p: DemoPlayer): number {
		if (!mod) return 0;
		const s = mod.sigmaAfterMatches(p.matches);
		// 0 Matches -> BASE_SIGMA, viel gespielt -> klein. Auf 0..1 normiert.
		return Math.max(0, Math.min(1, 1 - (s - 3) / (mod.BASE_SIGMA - 3)));
	}
</script>

<div class="lab" use:whenVisible={{ onVisible: loadModel, threshold: 0.15 }}>
	<div class="lab-grid">
		<!-- ---------- Eingabe ---------- -->
		<div class="lab-in">
			<div class="lab-teams">
				{#each [{ t: team1, key: 't1', label: 'Dein Team' }, { t: team2, key: 't2', label: 'Gegnerteam' }] as group (group.key)}
					<!-- Bewusst div + role="group" statt fieldset/legend: eine
					     Legende laesst sich nicht ueber die fieldset-Oberkante
					     legen, ohne sie zu floaten — und ein 100% breiter Float
					     nimmt den darunterliegenden Flex-Zeilen die gesamte
					     Breite (sie weichen Floats aus statt sie zu ueberlappen). -->
					<div
						class="lab-team"
						class:won={computed && winner === (group.key === 't1' ? 1 : 2)}
						role="group"
						aria-label={group.label}
					>
						<span class="lab-tlabel">{group.label}</span>
						{#each group.t as p (p.id)}
							<div class="lab-p">
								<div class="lab-prow">
									<label class="lab-nm" for="r-{p.id}">{p.name}</label>
									<span class="lab-val num">{p.display.toFixed(1)}</span>
								</div>
								<input
									id="r-{p.id}"
									class="lab-range"
									type="range"
									min="1"
									max="7"
									step="0.1"
									bind:value={p.display}
									oninput={touched}
									aria-label="{p.name}: Level"
								/>
								<div class="lab-prow lab-sub">
									<label class="lab-mlabel" for="m-{p.id}">
										{p.matches} Matches gespielt
									</label>
									<span class="lab-conf" aria-hidden="true">
										<i style="width:{confidenceOf(p) * 100}%"></i>
									</span>
								</div>
								<input
									id="m-{p.id}"
									class="lab-range lab-range-sm"
									type="range"
									min="0"
									max="60"
									step="1"
									bind:value={p.matches}
									oninput={touched}
									aria-label="{p.name}: Anzahl gespielter Matches"
								/>
							</div>
						{/each}
					</div>
				{/each}
			</div>

			<!-- Ergebnis -->
			<div class="lab-score">
				<div class="lab-srow">
					<span class="lab-slabel">Ergebnis</span>
					<div class="lab-sbtns">
						<button
							type="button"
							onclick={removeSet}
							disabled={sets.length <= 1}
							aria-label="Satz entfernen">−</button
						>
						<span class="num">{sets.length} {sets.length === 1 ? 'Satz' : 'Sätze'}</span>
						<button
							type="button"
							onclick={addSet}
							disabled={sets.length >= 3}
							aria-label="Satz hinzufügen">+</button
						>
					</div>
				</div>

				{#each sets as s, i (i)}
					<div class="lab-set">
						<span class="lab-setn num">{i + 1}</span>
						<div class="lab-stepper">
							<button
								type="button"
								onclick={() => setGames(i, 'a', -1)}
								aria-label="Satz {i + 1}, dein Team: ein Spiel weniger">−</button
							>
							<span class="num" aria-live="off">{s.a}</span>
							<button
								type="button"
								onclick={() => setGames(i, 'a', 1)}
								aria-label="Satz {i + 1}, dein Team: ein Spiel mehr">+</button
							>
						</div>
						<span class="lab-colon" aria-hidden="true">:</span>
						<div class="lab-stepper">
							<button
								type="button"
								onclick={() => setGames(i, 'b', -1)}
								aria-label="Satz {i + 1}, Gegnerteam: ein Spiel weniger">−</button
							>
							<span class="num">{s.b}</span>
							<button
								type="button"
								onclick={() => setGames(i, 'b', 1)}
								aria-label="Satz {i + 1}, Gegnerteam: ein Spiel mehr">+</button
							>
						</div>
					</div>
				{/each}
			</div>

			<button class="btn btn-primary lab-go" type="button" onclick={calculate} disabled={!mod}>
				{#if !mod}Modell wird geladen …{:else}Berechnen{/if}
			</button>
		</div>

		<!-- ---------- Ausgabe ---------- -->
		<div class="lab-out" aria-live="polite">
			{#if !computed}
				<div class="lab-idle">
					<div class="lab-pre">
						<span class="lab-plabel">Siegchance deines Teams</span>
						<span class="lab-pval num">{Math.round(winProb * 100)}%</span>
						<div class="lab-pbar" aria-hidden="true">
							<i style="width:{winProb * 100}%"></i>
						</div>
						<p class="lab-phint">
							{#if winProb < 0.42}
								Ihr geht als Außenseiter rein — ein Sieg wiegt entsprechend schwer.
							{:else if winProb > 0.58}
								Ihr seid favorisiert — ein Sieg bringt wenig, eine Niederlage kostet.
							{:else}
								Ausgeglichene Partie — das Ergebnis entscheidet.
							{/if}
						</p>
					</div>
					<p class="lab-wait">
						Stell die Werte ein und drück <b>Berechnen</b>. Gerechnet wird mit dem echten
						PadelIndex-Modell.
					</p>
				</div>
			{:else if result}
				<div class="lab-res">
					<span class="lab-rlabel">Neue Werte</span>
					{#each result as r (r.id)}
						<div class="lab-r" class:up={r.delta > 0} class:down={r.delta < 0}>
							<div class="lab-rtop">
								<span class="lab-rnm">{r.name}</span>
								<span class="lab-rd num">
									<AnimatedNumber value={r.delta} decimals={2} signed duration={800} />
								</span>
							</div>
							<div class="lab-rbar" aria-hidden="true">
								<i style="width:{(Math.abs(r.delta) / maxAbs) * 100}%"></i>
							</div>
							<div class="lab-rnum">
								<span class="num lab-rb">{r.before.toFixed(2)}</span>
								<span class="lab-rarrow" aria-hidden="true">→</span>
								<span class="num lab-ra">
									<AnimatedNumber value={r.after} decimals={2} duration={800} />
								</span>
								{#if r.provisional}
									<span class="lab-prov">provisorisch</span>
								{/if}
							</div>
						</div>
					{/each}

					<div class="lab-factors">
						<span class="lab-rlabel">Woraus sich das ergibt</span>
						{#each [{ k: 'Gegnerstärke', v: 1 - winProb, t: 'Wie stark war die Gegenseite im Verhältnis zu euch?' }, { k: 'Deutlichkeit', v: dominance, t: 'Wie klar war das Ergebnis über alle Sätze?' }, { k: 'Wie gut wir dich kennen', v: confidenceOf(team1[0]), t: 'Aus deiner Matchzahl. Je besser wir dich kennen, desto ruhiger dein Wert.' }] as f (f.k)}
							<div class="lab-f">
								<div class="lab-frow">
									<span>{f.k}</span>
									<span class="num">{Math.round(Math.max(0, Math.min(1, f.v)) * 100)}%</span>
								</div>
								<div class="lab-fbar" aria-hidden="true">
									<i style="width:{Math.max(0, Math.min(1, f.v)) * 100}%"></i>
								</div>
								<p class="lab-ft">{f.t}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.lab {
		margin-top: 46px;
	}
	.lab-grid {
		display: grid;
		grid-template-columns: 1.02fr 0.98fr;
		gap: clamp(18px, 2.6vw, 34px);
		align-items: start;
	}
	@media (max-width: 900px) {
		.lab-grid {
			grid-template-columns: 1fr;
		}
	}
	.lab-in,
	.lab-out {
		min-width: 0;
	}

	/* ---------- Eingabe ---------- */
	.lab-in {
		border: 1px solid var(--line-light);
		border-radius: 18px;
		padding: clamp(16px, 2vw, 24px);
		background: var(--chalk-2);
	}
	.lab-teams {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(12px, 2vw, 22px);
	}
	@media (max-width: 560px) {
		.lab-teams {
			grid-template-columns: 1fr;
		}
	}
	.lab-team {
		border: 0;
		border-top: 2px solid var(--line-light);
		margin: 0;
		padding: 12px 0 0;
		transition: border-color 0.35s;
		min-width: 0;
	}
	.lab-team.won {
		border-top-color: var(--court-deep);
	}
	.lab-tlabel {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-light);
		padding: 0;
		margin-bottom: 12px;
	}
	.lab-p + .lab-p {
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--line-light);
	}
	.lab-prow {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.lab-nm {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--ink);
		cursor: pointer;
	}
	.lab-val {
		font-size: 17px;
		color: var(--court-deep);
	}
	.lab-sub {
		margin-top: 8px;
		align-items: center;
	}
	.lab-mlabel {
		font-size: 11px;
		color: var(--muted-light);
		cursor: pointer;
	}
	.lab-conf {
		display: block;
		width: 42px;
		height: 3px;
		border-radius: 2px;
		background: var(--line-light);
		overflow: hidden;
		flex: none;
	}
	.lab-conf i {
		display: block;
		height: 100%;
		background: var(--court-deep);
		transition: width 0.3s;
	}

	.lab-range {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 40px;
		background: transparent;
		margin: 2px 0 0;
		cursor: pointer;
	}
	.lab-range::-webkit-slider-runnable-track {
		height: 2px;
		background: var(--line-light);
	}
	.lab-range::-moz-range-track {
		height: 2px;
		background: var(--line-light);
	}
	.lab-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--court-deep);
		margin-top: -8px;
		border: 3px solid var(--chalk-2);
		box-shadow: 0 1px 4px rgba(11, 30, 38, 0.3);
	}
	.lab-range::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--court-deep);
		border: 3px solid var(--chalk-2);
	}
	.lab-range-sm {
		height: 34px;
	}
	.lab-range-sm::-webkit-slider-thumb {
		width: 13px;
		height: 13px;
		margin-top: -5.5px;
		background: var(--muted-light);
	}
	.lab-range-sm::-moz-range-thumb {
		width: 13px;
		height: 13px;
		background: var(--muted-light);
	}

	/* Ergebnis-Eingabe */
	.lab-score {
		margin-top: 22px;
		padding-top: 18px;
		border-top: 1px solid var(--line-light);
	}
	.lab-srow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.lab-slabel {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.lab-sbtns {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--muted-light);
	}
	.lab-sbtns button,
	.lab-stepper button {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid var(--line-light);
		background: #fff;
		color: var(--ink);
		font-size: 15px;
		line-height: 1;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition:
			border-color 0.2s,
			color 0.2s;
	}
	.lab-sbtns button:hover:not(:disabled),
	.lab-stepper button:hover {
		border-color: var(--court-deep);
		color: var(--court-deep);
	}
	.lab-sbtns button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.lab-set {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
	}
	.lab-setn {
		font-size: 10px;
		color: var(--muted-light);
		width: 12px;
	}
	.lab-stepper {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.lab-stepper span {
		min-width: 1.4ch;
		text-align: center;
		font-size: 17px;
		color: var(--ink);
	}
	.lab-colon {
		color: var(--muted-light);
	}
	.lab-go {
		width: 100%;
		justify-content: center;
		margin-top: 20px;
	}
	.lab-go:disabled {
		opacity: 0.55;
		cursor: progress;
	}

	/* ---------- Ausgabe ---------- */
	.lab-out {
		border: 1px solid var(--line-light);
		border-radius: 18px;
		padding: clamp(16px, 2vw, 24px);
		background: #fff;
		min-height: 340px;
	}
	.lab-idle {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 20px;
	}
	.lab-plabel,
	.lab-rlabel {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.lab-pval {
		display: block;
		font-size: clamp(38px, 5vw, 52px);
		letter-spacing: -0.04em;
		line-height: 1.1;
		margin-top: 6px;
		color: var(--ink);
	}
	.lab-pbar {
		height: 5px;
		border-radius: 3px;
		background: var(--line-light);
		overflow: hidden;
		margin-top: 12px;
	}
	.lab-pbar i {
		display: block;
		height: 100%;
		background: var(--court-deep);
		transition: width 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
	}
	.lab-phint {
		margin-top: 12px;
		font-size: 13.5px;
		color: var(--muted-light);
		line-height: 1.5;
	}
	.lab-wait {
		margin-top: auto;
		font-size: 12.5px;
		color: var(--muted-light);
		padding-top: 16px;
		border-top: 1px solid var(--line-light);
	}
	.lab-wait b {
		color: var(--ink);
	}

	.lab-r {
		margin-top: 14px;
	}
	.lab-rtop {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
	}
	.lab-rnm {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--ink);
	}
	.lab-rd {
		font-size: 15px;
		color: var(--muted-light);
	}
	.lab-r.up .lab-rd {
		color: var(--court-deep);
	}
	.lab-r.down .lab-rd {
		color: #b4711a;
	}
	.lab-rbar {
		height: 4px;
		border-radius: 2px;
		background: var(--line-light);
		overflow: hidden;
		margin-top: 6px;
	}
	.lab-rbar i {
		display: block;
		height: 100%;
		background: var(--muted-light);
		transition: width 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
	}
	.lab-r.up .lab-rbar i {
		background: var(--court-deep);
	}
	.lab-r.down .lab-rbar i {
		background: #d89a3f;
	}
	.lab-rnum {
		display: flex;
		align-items: baseline;
		gap: 7px;
		margin-top: 5px;
		font-size: 12.5px;
	}
	.lab-rb {
		color: var(--muted-light);
	}
	.lab-rarrow {
		color: var(--muted-light);
	}
	.lab-ra {
		font-size: 15px;
		color: var(--ink);
	}
	.lab-prov {
		margin-left: auto;
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #b4711a;
	}

	.lab-factors {
		margin-top: 24px;
		padding-top: 18px;
		border-top: 1px solid var(--line-light);
	}
	.lab-f {
		margin-top: 12px;
	}
	.lab-frow {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font-size: 12.5px;
		color: var(--ink);
	}
	.lab-fbar {
		height: 4px;
		border-radius: 2px;
		background: var(--line-light);
		overflow: hidden;
		margin-top: 5px;
	}
	.lab-fbar i {
		display: block;
		height: 100%;
		background: var(--court-deep);
		transition: width 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
	}
	.lab-ft {
		margin-top: 5px;
		font-size: 11.5px;
		color: var(--muted-light);
		line-height: 1.45;
	}
</style>
