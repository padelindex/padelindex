<script lang="ts">
	// ============================================================
	// Für Vereine: dieselbe Liste, eingebettet auf der Vereinsseite
	// ============================================================
	// Zwei Zustände desselben Widgets: freistehend und eingebaut. Beim
	// Umschalten wächst eine Browser- und Seitenumgebung darum herum —
	// das ist die ganze Aussage des Abschnitts ("eine Zeile Code, und es
	// steht bei euch").
	//
	// Die Zeilen sind das ECHTE Ranking des Pilotvereins (Server-Load in
	// +page.server.ts, dieselbe Funktion wie das Embed). Fehlt es, greift
	// eine klar als Beispiel gekennzeichnete Liste.

	import { whenVisible } from '$lib/landing/reveal';
	import { prefersReducedMotion } from '$lib/landing/motion';
	import type { LeaderboardResponse } from '$lib/leaderboard';

	let { board }: { board: LeaderboardResponse | null } = $props();

	let embedded = $state(false);
	let auto = false;

	function begin() {
		if (auto) return;
		auto = true;
		if (prefersReducedMotion()) {
			embedded = true;
			return;
		}
		setTimeout(() => (embedded = true), 900);
	}

	const FALLBACK = [
		{
			rank: 1,
			name: 'Max M.',
			rating: 4.82,
			matches: 34,
			confidence: 0.84,
			trend: 0.14,
			provisional: false
		},
		{
			rank: 2,
			name: 'Jonas K.',
			rating: 4.61,
			matches: 41,
			confidence: 0.9,
			trend: 0.07,
			provisional: false
		},
		{
			rank: 3,
			name: 'Sofia B.',
			rating: 4.4,
			matches: 28,
			confidence: 0.75,
			trend: 0,
			provisional: false
		},
		{
			rank: 4,
			name: 'Tobias R.',
			rating: 3.95,
			matches: 6,
			confidence: 0.35,
			trend: 0.22,
			provisional: true
		},
		{
			rank: 5,
			name: 'Elena V.',
			rating: 3.88,
			matches: 52,
			confidence: 0.94,
			trend: -0.05,
			provisional: false
		}
	];

	const rows = $derived(board?.players?.length ? board.players : FALLBACK);
	const isReal = $derived(Boolean(board?.players?.length));
	const clubName = $derived(board?.club?.name ?? 'STC Oberland');

	const RING = 2 * Math.PI * 9;
	const dash = (c: number) => {
		const v = Math.max(0, Math.min(1, c));
		return `${(RING * v).toFixed(2)} ${RING.toFixed(2)}`;
	};
</script>

<div class="cs" use:whenVisible={{ onVisible: begin, threshold: 0.3 }}>
	<div class="cs-stage">
		<!-- Vereinsseite, die um das Widget herum entsteht -->
		<div class="cs-site" class:on={embedded} aria-hidden="true">
			<div class="cs-chrome">
				<span class="cs-dot"></span><span class="cs-dot"></span><span class="cs-dot"></span>
				<span class="cs-url num">{clubName.toLowerCase().replace(/\s+/g, '-')}.de</span>
			</div>
			<div class="cs-sitenav">
				<span class="cs-brandbar"></span>
				<span class="cs-links"><i></i><i></i><i></i></span>
			</div>
			<div class="cs-sitehead"></div>
		</div>

		<!-- Das Widget selbst -->
		<div class="cs-widget" class:embedded>
			<div class="cs-whead">
				<span class="cs-wn">{clubName}</span>
				<span class="cs-we">Level-Ranking</span>
			</div>
			<ol class="cs-list">
				{#each rows as p (p.rank)}
					<li>
						<span class="cs-r num">{p.rank}</span>
						<span class="cs-nmw">
							<span class="cs-nm">{p.name}</span>
							<span class="cs-mt" class:prov={p.provisional}>
								{p.provisional ? `provisorisch · ${p.matches} Matches` : `${p.matches} Matches`}
							</span>
						</span>
						<span class="cs-mv num" class:up={p.trend > 0.005} class:down={p.trend < -0.005}>
							{#if p.trend > 0.005}↑ +{p.trend.toFixed(2)}
							{:else if p.trend < -0.005}↓ −{Math.abs(p.trend).toFixed(2)}
							{:else if p.matches === 0}neu
							{:else}→ 0.00{/if}
						</span>
						<span class="cs-sc">
							<svg class="cs-ring" viewBox="0 0 22 22" aria-hidden="true">
								<circle class="t" cx="11" cy="11" r="9" />
								<circle class="f" cx="11" cy="11" r="9" stroke-dasharray={dash(p.confidence)} />
							</svg>
							<span class="cs-v num">{p.rating.toFixed(2)}</span>
						</span>
					</li>
				{/each}
			</ol>
			<div class="cs-wfoot">
				<span>{isReal ? 'Live aus der Pilotphase' : 'Beispielliste'}</span>
				<span>PadelIndex</span>
			</div>
		</div>
	</div>

	<div class="cs-right">
		<div class="cs-toggle" role="group" aria-label="Darstellung">
			<button
				type="button"
				class:on={!embedded}
				onclick={() => (embedded = false)}
				aria-pressed={!embedded}
			>
				Widget
			</button>
			<button
				type="button"
				class:on={embedded}
				onclick={() => (embedded = true)}
				aria-pressed={embedded}
			>
				Auf eurer Seite
			</button>
		</div>

		<div class="cs-snippet">
			<span class="cs-slabel">Eine Zeile</span>
			<pre><code
					>&lt;<span class="t">script</span> <span class="at">src</span>=<span class="s"
						>"https://padelindex.de/embed.js"</span
					> <span class="at">async</span>&gt;&lt;/<span class="t">script</span>&gt;

&lt;<span class="t">padelindex-leaderboard</span>
  <span class="at">club</span>=<span class="s">"stc-oberland"</span>
  <span class="at">limit</span>=<span class="s">"10"</span>
  <span class="at">accent</span>=<span class="s">"#0F6E5C"</span>&gt;
&lt;/<span class="t">padelindex-leaderboard</span>&gt;</code
				></pre>
		</div>

		<p class="cs-note">
			Läuft in WordPress, Elementor, Wix und allem, was HTML erlaubt. Die Styles sind gekapselt —
			euer Theme kann das Widget nicht zerlegen und umgekehrt.
			{#if isReal}
				Die Liste links ist keine Attrappe: sie kommt live aus derselben Schnittstelle.
			{/if}
		</p>

		<a class="btn btn-ghost-light cs-cta" href="/c/stc-oberland">Live-Ranking ansehen</a>
	</div>
</div>

<style>
	.cs {
		display: grid;
		grid-template-columns: 1.08fr 0.92fr;
		gap: clamp(22px, 4vw, 56px);
		align-items: center;
		margin-top: 48px;
	}
	@media (max-width: 900px) {
		.cs {
			grid-template-columns: 1fr;
			gap: 30px;
		}
	}
	/* Ohne min-width:0 zieht die min-content-Breite des <pre>-Snippets die
	   ganze Grid-Spalte auf und schiebt die Seite seitlich raus. Grid-Items
	   haben per Default min-width:auto, nicht 0. */
	.cs-stage,
	.cs-right {
		min-width: 0;
	}

	/* --- Bühne: Widget + wachsende Vereinsseite --- */
	.cs-stage {
		position: relative;
		padding: 0;
		transition: padding 0.65s cubic-bezier(0.22, 0.61, 0.36, 1);
	}
	.cs-stage:has(.cs-widget.embedded) {
		padding: 96px 18px 18px;
	}

	.cs-site {
		position: absolute;
		inset: 0;
		border-radius: 12px;
		border: 1px solid var(--line-light);
		background: #fff;
		opacity: 0;
		transform: scale(0.97);
		transition:
			opacity 0.55s,
			transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
		overflow: hidden;
		box-shadow: 0 26px 60px -30px rgba(11, 30, 38, 0.35);
	}
	.cs-site.on {
		opacity: 1;
		transform: none;
	}
	.cs-chrome {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 9px 12px;
		background: #f1f3ef;
		border-bottom: 1px solid var(--line-light);
	}
	.cs-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--line-light);
	}
	.cs-url {
		margin-left: 10px;
		font-size: 10px;
		color: var(--muted-light);
	}
	.cs-sitenav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 11px 14px;
		border-bottom: 1px solid var(--line-light);
	}
	/* Neutraler Platzhalter statt des Vereinsnamens: der stand sonst
	   zweimal untereinander (Seitenkopf und Widget-Kopf). */
	.cs-brandbar {
		display: block;
		width: 76px;
		height: 9px;
		border-radius: 3px;
		background: var(--court-deep);
		opacity: 0.55;
	}
	.cs-links {
		display: flex;
		gap: 8px;
	}
	.cs-links i {
		display: block;
		width: 26px;
		height: 5px;
		border-radius: 3px;
		background: var(--line-light);
	}
	.cs-sitehead {
		height: 10px;
		margin: 14px 14px 0;
		width: 45%;
		border-radius: 3px;
		background: var(--line-light);
	}

	.cs-widget {
		position: relative;
		background: #fbfbf9;
		border: 1px solid var(--line-light);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 20px 50px -26px rgba(11, 30, 38, 0.28);
		transition:
			box-shadow 0.55s,
			transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
	}
	.cs-widget.embedded {
		box-shadow: 0 6px 18px -12px rgba(11, 30, 38, 0.4);
	}

	.cs-whead {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 13px 15px;
		border-bottom: 1px solid var(--line-light);
	}
	.cs-wn {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}
	.cs-we {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.cs-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.cs-list li {
		display: grid;
		grid-template-columns: 2.2ch 1fr auto auto;
		align-items: center;
		gap: 10px;
		padding: 10px 15px;
		border-bottom: 1px solid var(--line-light);
	}
	.cs-list li:last-child {
		border-bottom: 0;
	}
	.cs-r {
		font-size: 12px;
		color: var(--muted-light);
		text-align: right;
	}
	.cs-nmw {
		min-width: 0;
	}
	.cs-nm {
		display: block;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.cs-mt {
		display: block;
		font-size: 11px;
		color: var(--muted-light);
	}
	.cs-mt.prov {
		color: #b4711a;
	}
	.cs-mv {
		font-size: 11px;
		color: var(--muted-light);
		white-space: nowrap;
	}
	.cs-mv.up {
		color: var(--court-deep);
	}
	.cs-mv.down {
		color: #b4711a;
	}
	.cs-sc {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.cs-ring {
		width: 19px;
		height: 19px;
		flex: none;
	}
	.cs-ring circle {
		fill: none;
		stroke-width: 2.5;
	}
	.cs-ring .t {
		stroke: var(--line-light);
	}
	.cs-ring .f {
		stroke: var(--court-deep);
		stroke-linecap: round;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		transition: stroke-dasharray 0.5s;
	}
	.cs-v {
		font-size: 15px;
		font-weight: 500;
		color: var(--ink);
	}
	.cs-wfoot {
		display: flex;
		justify-content: space-between;
		padding: 9px 15px;
		border-top: 1px solid var(--line-light);
		font-size: 10.5px;
		color: var(--muted-light);
	}

	/* --- rechte Spalte --- */
	.cs-toggle {
		display: inline-flex;
		border: 1px solid var(--line-light);
		border-radius: 100px;
		padding: 3px;
	}
	.cs-toggle button {
		border: 0;
		background: transparent;
		color: var(--muted-light);
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
	.cs-toggle button.on {
		background: var(--court-deep);
		color: #fff;
	}

	.cs-snippet {
		margin-top: 18px;
		background: var(--night);
		border: 1px solid var(--line-dark);
		border-radius: 12px;
		padding: 16px 18px;
		overflow-x: auto;
	}
	.cs-slabel {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-dark);
		margin-bottom: 10px;
	}
	.cs-snippet pre {
		margin: 0;
	}
	.cs-snippet code {
		font-family: var(--mono);
		font-size: 12px;
		line-height: 1.65;
		color: var(--chalk);
		white-space: pre;
	}
	.cs-snippet .t {
		color: var(--court);
	}
	.cs-snippet .at {
		color: var(--sand);
	}
	.cs-snippet .s {
		color: #9fd8cf;
	}

	.cs-note {
		margin-top: 16px;
		font-size: 13px;
		line-height: 1.6;
		color: var(--muted-light);
	}
	.cs-cta {
		margin-top: 18px;
	}
</style>
