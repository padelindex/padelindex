<script lang="ts">
	import type { PageData } from './$types';
	import { MATCH_TYPE_LABELS } from '$lib/match-report';

	let { data }: { data: PageData } = $props();

	const RING = 2 * Math.PI * 22;
	const dash = (confidence: number) => {
		const c = Math.max(0, Math.min(1, confidence));
		return `${(RING * c).toFixed(2)} ${RING.toFixed(2)}`;
	};

	const handLabel: Record<string, string> = { rechts: 'Rechtshänder', links: 'Linkshänder' };
	const sideLabel: Record<string, string> = { rechts: 'Rechte Seite', links: 'Linke Seite' };
	const genderLabel: Record<string, string> = {
		maennlich: 'Männlich',
		weiblich: 'Weiblich',
		divers: 'Divers'
	};

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	const WINDOWS = [5, 10, 20] as const;
	let windowSize = $state<(typeof WINDOWS)[number]>(10);
	const curve = $derived(
		windowSize === 5 ? data.form.w5 : windowSize === 10 ? data.form.w10 : data.form.w20
	);

	// Rating-Verlauf als kleine Linie: chronologisch, aus der bereits
	// geladenen (neueste-zuerst) Historie.
	const series = $derived([...data.history].reverse().map((m) => m.ratingAfter));
	const W = 480;
	const H = 90;
	const PAD = 6;
	const seriesPath = $derived.by(() => {
		if (series.length < 2) return '';
		const lo = Math.min(...series) - 0.1;
		const hi = Math.max(...series) + 0.1;
		const x = (i: number) => PAD + ((W - 2 * PAD) * i) / (series.length - 1);
		const y = (v: number) => H - PAD - ((H - 2 * PAD) * (v - lo)) / Math.max(0.01, hi - lo);
		return series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
	});
</script>

<svelte:head>
	<title>{data.profile.name} — PadelIndex</title>
	<meta
		name="description"
		content="Spielerprofil von {data.profile.name} auf PadelIndex — Rating, Formkurve und Matchhistorie aus bestätigten Ergebnissen."
	/>
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		{#if data.club}
			<a class="btn btn-primary" href="/c/{data.club.slug}">Zum Vereinsranking</a>
		{/if}
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 720px">
		<div class="profile-head">
			<div class="ring-wrap">
				<svg class="ring" viewBox="0 0 48 48" aria-hidden="true">
					<circle class="t" cx="24" cy="24" r="22"></circle>
					<circle class="f" cx="24" cy="24" r="22" stroke-dasharray={dash(data.profile.confidence)}
					></circle>
				</svg>
				<span class="ring-v num">{data.profile.rating.toFixed(2)}</span>
			</div>
			<div>
				<span class="eyebrow">
					{data.profile.claimed ? 'Spielerprofil' : 'Unbeansprucht'}
					{#if data.club}· {data.club.name}{/if}
				</span>
				<h2>{data.profile.name}</h2>
				<p class="muted">
					{data.profile.matchesPlayed} Matches
					{#if data.profile.provisional}· provisorisch{/if}
					· Sicherheit {Math.round(data.profile.confidence * 100)} %
				</p>
			</div>
		</div>

		{#if data.profile.city || data.profile.playingHand || data.profile.preferredSide || data.profile.gender || data.profile.selfAssessedLevel !== null}
			<div class="chips">
				{#if data.profile.city}<span class="chip">{data.profile.city}</span>{/if}
				{#if data.profile.playingHand}<span class="chip">{handLabel[data.profile.playingHand]}</span>{/if}
				{#if data.profile.preferredSide}<span class="chip">{sideLabel[data.profile.preferredSide]}</span>{/if}
				{#if data.profile.gender}<span class="chip">{genderLabel[data.profile.gender]}</span>{/if}
				{#if data.profile.selfAssessedLevel !== null}
					<span class="chip">Selbsteinschätzung {data.profile.selfAssessedLevel.toFixed(1)}</span>
				{/if}
			</div>
		{/if}

		{#if data.badges.length > 0}
			<div class="badges">
				{#each data.badges as b (b.id)}
					<span class="badge" title={b.detail}>{b.label}</span>
				{/each}
			</div>
		{/if}

		{#if data.viewer && !data.viewer.isOwnProfile}
			<div class="viewer-actions">
				<a class="btn btn-primary" href="/spieler-finden">Spielanfrage senden</a>
				{#if data.viewer.challengeable}
					<a class="btn btn-ghost-light" href="/challenges">Herausfordern</a>
				{/if}
			</div>
		{/if}

		{#if data.history.length === 0}
			<div class="card">
				<p class="muted" style="margin: 0; font-size: 14px">
					Noch keine bestätigten Matches — die Formkurve füllt sich mit dem ersten Ergebnis.
				</p>
			</div>
		{:else}
			<div class="card">
				<div class="card-head">
					<h3 class="card-title" style="margin: 0">Formkurve</h3>
					<div class="win-toggle" role="group" aria-label="Zeitraum">
						{#each WINDOWS as n (n)}
							<button type="button" class:on={windowSize === n} onclick={() => (windowSize = n)}>
								{n}
							</button>
						{/each}
					</div>
				</div>
				<div class="form-stats">
					<div>
						<span class="form-v num">{Math.round(curve.winRate * 100)}%</span>
						<span class="form-l">Siegquote ({curve.matchesCounted} Matches)</span>
					</div>
					<div>
						<span class="form-v num" class:up={curve.gameDiff > 0} class:down={curve.gameDiff < 0}>
							{curve.gameDiff > 0 ? '+' : ''}{curve.gameDiff}
						</span>
						<span class="form-l">Games-Differenz</span>
					</div>
				</div>

				{#if seriesPath}
					<div class="rseries">
						<span class="form-l">Rating-Verlauf</span>
						<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="Rating-Verlauf über die letzten {series.length} Matches">
							<path class="rseries-line" d={seriesPath}></path>
						</svg>
					</div>
				{/if}
			</div>

			{#if data.preferredPartners.length > 0}
				<div class="card">
					<h3 class="card-title">Bevorzugte Partner</h3>
					<ul class="partners">
						{#each data.preferredPartners as p (p.id)}
							<li>
								<a href="/p/{p.handle}" class="pname">{p.name}</a>
								<span class="pcount num">{p.count}×</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if data.tournamentMatches.length > 0}
				<div class="card">
					<h3 class="card-title">Turnierergebnisse</h3>
					<ol class="hist">
						{#each data.tournamentMatches as m (m.matchId)}
							<li class="hist-row">
								<span class="hist-badge" class:win={m.won}>{m.won ? 'Sieg' : 'Niederlage'}</span>
								<span class="hist-main">
									<span class="hist-rating">
										{#if m.partner}mit {m.partner.name} · {/if}
										{m.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ')}
									</span>
								</span>
								<span class="hist-date">{formatDate(m.playedAt)}</span>
							</li>
						{/each}
					</ol>
				</div>
			{/if}

			<div class="card">
				<h3 class="card-title">Matchhistorie</h3>
				<ol class="hist">
					{#each data.history as m (m.matchId)}
						<li class="hist-row">
							<span class="hist-badge" class:win={m.won}>{m.won ? 'Sieg' : 'Niederlage'}</span>
							<span class="hist-main">
								<span class="hist-rating">
									{#if m.partner}mit {m.partner.name} · {/if}
									{m.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ')}
									{#if m.matchType !== 'freizeit'}
										<span class="type-tag">{MATCH_TYPE_LABELS[m.matchType]}</span>
									{/if}
								</span>
								<span class="hist-detail">
									{m.ratingAfter.toFixed(2)} ({m.ratingDelta >= 0 ? '+' : ''}{m.ratingDelta.toFixed(2)})
								</span>
							</span>
							<span class="hist-date">{formatDate(m.playedAt)}</span>
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	</div>
</section>

<style>
	.profile-head {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.ring-wrap {
		position: relative;
		display: grid;
		place-items: center;
		flex: none;
	}
	.ring {
		width: 88px;
		height: 88px;
	}
	.ring circle {
		fill: none;
		stroke-width: 3.5;
	}
	.ring .t {
		stroke: var(--line-light, rgba(0, 0, 0, 0.12));
	}
	.ring .f {
		stroke: var(--court-deep, #0f6e5c);
		stroke-linecap: round;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
	}
	.ring-v {
		position: absolute;
		font-size: 19px;
		font-weight: 600;
		color: var(--ink);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 20px;
	}
	.chip {
		font-size: 12.5px;
		padding: 6px 12px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		color: var(--muted-light);
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}

	.viewer-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
	}
	.badge {
		font-size: 12.5px;
		font-weight: 600;
		padding: 6px 12px;
		border-radius: 100px;
		background: rgba(15, 110, 92, 0.12);
		color: var(--court-deep, #0f6e5c);
	}

	.card {
		margin-top: 28px;
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}
	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	.win-toggle {
		display: inline-flex;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		border-radius: 100px;
		padding: 3px;
	}
	.win-toggle button {
		border: 0;
		background: transparent;
		color: var(--muted-light);
		font-family: var(--body);
		font-size: 12.5px;
		font-weight: 600;
		padding: 7px 13px;
		min-height: 34px;
		border-radius: 100px;
		cursor: pointer;
	}
	.win-toggle button.on {
		background: var(--court-deep, #0f6e5c);
		color: #fff;
	}

	.form-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
		margin-top: 18px;
	}
	.form-v {
		display: block;
		font-size: 26px;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.form-v.up {
		color: var(--court-deep, #0f6e5c);
	}
	.form-v.down {
		color: #b4711a;
	}
	.form-l {
		display: block;
		font-size: 12px;
		color: var(--muted-light);
		margin-top: 3px;
	}

	.rseries {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.rseries svg {
		width: 100%;
		height: 60px;
		display: block;
		margin-top: 8px;
	}
	.rseries-line {
		fill: none;
		stroke: var(--court-deep, #0f6e5c);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
	}

	.partners {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.partners li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		padding: 10px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.partners li:first-child {
		border-top: none;
		padding-top: 0;
	}
	.pname {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
		text-decoration: none;
	}
	.pname:hover {
		text-decoration: underline;
	}
	.pcount {
		font-size: 13px;
		color: var(--muted-light);
	}

	.hist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.hist-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.hist-badge {
		flex-shrink: 0;
		padding: 3px 9px;
		border-radius: 100px;
		font-size: 11px;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.06);
		color: var(--muted-light);
	}
	.hist-badge.win {
		background: rgba(15, 110, 92, 0.12);
		color: var(--court-deep, #0f6e5c);
	}
	.hist-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.hist-rating {
		font-size: 14px;
		font-weight: 600;
	}
	.type-tag {
		display: inline-block;
		margin-left: 6px;
		padding: 2px 8px;
		border-radius: 100px;
		font-size: 10.5px;
		font-weight: 600;
		background: rgba(15, 110, 92, 0.1);
		color: var(--court-deep, #0f6e5c);
		vertical-align: middle;
	}
	.hist-detail {
		font-size: 12px;
		color: var(--muted-light);
	}
	.hist-date {
		flex-shrink: 0;
		font-size: 12px;
		color: var(--muted-light);
	}
</style>
