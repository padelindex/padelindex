<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { matchTypeLabels } from '$lib/match-report';
	import RatingLegend from '$lib/components/RatingLegend.svelte';
	import H2HStats from '$lib/components/H2HStats.svelte';
	import HreflangLinks from '$lib/components/HreflangLinks.svelte';
	import AvatarCircle from '$lib/components/AvatarCircle.svelte';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import { isProfileIndexable } from '$lib/seo';
	import { jsonLd } from '$lib/jsonld';
	import { dateLocaleFor } from '$lib/i18n/date';
	import { ogLocaleFor, ogImageUrl } from '$lib/i18n/hreflang';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	let { data }: { data: PageData } = $props();

	const indexable = $derived(isProfileIndexable(data.profile.matchesPlayed));
	const canonical = $derived(`https://padelindex.de/p/${page.params.handle}`);
	const ogLocale = $derived(ogLocaleFor(getLocale()));
	const ogImage = $derived(ogImageUrl(getLocale()));

	const breadcrumbs = $derived.by(() => {
		const items = [
			{ '@type': 'ListItem', position: 1, name: 'PadelIndex', item: 'https://padelindex.de/' }
		];
		if (data.club) {
			items.push({
				'@type': 'ListItem',
				position: 2,
				name: data.club.name,
				item: `https://padelindex.de/c/${data.club.slug}`
			});
		}
		items.push({
			'@type': 'ListItem',
			position: items.length + 1,
			name: data.profile.name,
			item: canonical
		});
		return jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: items
		});
	});

	const RING = 2 * Math.PI * 22;
	const dash = (confidence: number) => {
		const c = Math.max(0, Math.min(1, confidence));
		return `${(RING * c).toFixed(2)} ${RING.toFixed(2)}`;
	};

	const handLabel = $derived({
		rechts: m.player_hand_rechts(),
		links: m.player_hand_links()
	});
	const sideLabel = $derived({
		rechts: m.player_side_rechts(),
		links: m.player_side_links()
	});
	const genderLabel = $derived({
		maennlich: m.player_gender_maennlich(),
		weiblich: m.player_gender_weiblich(),
		divers: m.player_gender_divers()
	});

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString(dateLocaleFor(getLocale()), {
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
	const chronological = $derived([...data.history].reverse());
	const series = $derived(chronological.map((entry) => entry.ratingAfter));
	const W = 480;
	const H = 90;
	const PAD = 6;
	const seriesRange = $derived.by(() => {
		if (series.length === 0) return { lo: 0, hi: 0 };
		return { lo: Math.min(...series), hi: Math.max(...series) };
	});
	const seriesPath = $derived.by(() => {
		if (series.length < 2) return '';
		const lo = seriesRange.lo - 0.1;
		const hi = seriesRange.hi + 0.1;
		const x = (i: number) => PAD + ((W - 2 * PAD) * i) / (series.length - 1);
		const y = (v: number) => H - PAD - ((H - 2 * PAD) * (v - lo)) / Math.max(0.01, hi - lo);
		return series
			.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
			.join(' ');
	});
	const seriesTrendLabel = $derived.by(() => {
		if (series.length < 2) return '';
		const first = series[0];
		const last = series[series.length - 1];
		const diff = last - first;
		const direction =
			diff > 0.005
				? m.player_trend_rising()
				: diff < -0.005
					? m.player_trend_falling()
					: m.player_trend_flat();
		return m.player_trend_sr({
			count: series.length,
			first: first.toFixed(2),
			last: last.toFixed(2),
			direction
		});
	});
</script>

<svelte:head>
	<title>{m.player_title({ name: data.profile.name })}</title>
	<meta name="description" content={m.player_meta_description({ name: data.profile.name })} />
	{#if indexable}
		<link rel="canonical" href={canonical} />
	{:else}
		<!-- Zu wenige bestätigte Matches für eine belastbare Aussage — siehe
		     lib/seo.ts. Noch "follow", damit Google trotzdem der Rangliste
		     und den Vereinsseiten folgen kann, die hierher verlinken. -->
		<meta name="robots" content="noindex, follow" />
	{/if}
	<HreflangLinks path={page.url.pathname} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:title" content={m.player_title({ name: data.profile.name })} />
	<meta
		property="og:description"
		content={m.player_meta_description({ name: data.profile.name })}
	/>
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${breadcrumbs}</script>`}
</svelte:head>

<MinimalNav>
	{#if data.club}
		<a class="btn btn-primary" href={localizeHref(`/c/${data.club.slug}`)}
			>{m.player_nav_ranking_cta()}</a
		>
	{/if}
</MinimalNav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 720px">
		<div class="profile-head">
			<AvatarCircle
				avatarUrl={data.profile.avatarUrl}
				name={data.profile.name}
				size={72}
				loading="eager"
			/>
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
					{data.profile.claimed ? m.player_eyebrow_claimed() : m.player_eyebrow_unclaimed()}
					{#if data.club}· {data.club.name}{/if}
				</span>
				<h2>{data.profile.name}</h2>
				<p class="muted">
					{m.cs_matches_count({ count: data.profile.matchesPlayed })}
					{#if data.profile.provisional}· {m.lab_provisional()}{/if}
					· {m.cl_confidence_title({ percent: Math.round(data.profile.confidence * 100) })}
				</p>
			</div>
		</div>

		<div class="profile-legend">
			<RatingLegend />
		</div>

		{#if data.profile.city || data.profile.playingHand || data.profile.preferredSide || data.profile.gender || data.profile.selfAssessedLevel !== null}
			<div class="chips">
				{#if data.profile.city}<span class="chip">{data.profile.city}</span>{/if}
				{#if data.profile.playingHand}<span class="chip">{handLabel[data.profile.playingHand]}</span
					>{/if}
				{#if data.profile.preferredSide}<span class="chip"
						>{sideLabel[data.profile.preferredSide]}</span
					>{/if}
				{#if data.profile.gender}<span class="chip">{genderLabel[data.profile.gender]}</span>{/if}
				{#if data.profile.selfAssessedLevel !== null}
					<span class="chip"
						>{m.player_self_assessed({ level: data.profile.selfAssessedLevel.toFixed(1) })}</span
					>
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
				<a class="btn btn-primary" href="/spieler-finden">{m.player_request_match()}</a>
				{#if data.viewer.challengeable}
					<a class="btn btn-ghost-light" href="/challenges">{m.player_challenge()}</a>
				{/if}
			</div>
		{:else if !data.viewer}
			<p class="anon-cta">
				{m.player_anon_cta_pre()}
				<a href={localizeHref('/registrieren')}>{m.nav_cta()}</a>
			</p>
		{/if}

		{#if data.h2h}
			<H2HStats stats={data.h2h} name={data.profile.name} />
		{/if}

		{#if data.history.length === 0}
			<div class="card">
				<p class="muted" style="margin: 0; font-size: 14px">
					{m.player_no_matches_yet()}
				</p>
			</div>
		{:else}
			<div class="card">
				<div class="card-head">
					<h3 class="card-title" style="margin: 0">{m.player_form_curve_title()}</h3>
					<div class="win-toggle" role="group" aria-label={m.player_form_period_aria()}>
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
						<span class="form-l">{m.player_win_rate_label({ count: curve.matchesCounted })}</span>
					</div>
					<div>
						<span class="form-v num" class:up={curve.gameDiff > 0} class:down={curve.gameDiff < 0}>
							{curve.gameDiff > 0 ? '+' : ''}{curve.gameDiff}
						</span>
						<span class="form-l">{m.player_game_diff_label()}</span>
					</div>
				</div>

				{#if seriesPath}
					<div class="rseries">
						<span class="form-l">{m.player_rating_history_label()}</span>
						<div class="rseries-chart">
							<div class="rseries-axis" aria-hidden="true">
								<span>{(seriesRange.hi + 0.1).toFixed(2)}</span>
								<span>{(seriesRange.lo - 0.1).toFixed(2)}</span>
							</div>
							<svg
								viewBox="0 0 {W} {H}"
								preserveAspectRatio="none"
								role="img"
								aria-label={seriesTrendLabel}
							>
								<path class="rseries-line" d={seriesPath}></path>
							</svg>
						</div>
						<span class="rseries-caption" aria-hidden="true">{m.player_older_newer()}</span>

						<table class="sr-only">
							<caption>{m.player_rating_history_caption()}</caption>
							<thead>
								<tr>
									<th scope="col">{m.player_date_col()}</th>
									<th scope="col">{m.player_rating_after_col()}</th>
								</tr>
							</thead>
							<tbody>
								{#each chronological as row (row.matchId)}
									<tr>
										<td>{formatDate(row.playedAt)}</td>
										<td>{row.ratingAfter.toFixed(2)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			{#if data.preferredPartners.length > 0}
				<div class="card">
					<h3 class="card-title">{m.player_preferred_partners_title()}</h3>
					<ul class="partners">
						{#each data.preferredPartners as p (p.id)}
							<li>
								<a href={localizeHref(`/p/${p.handle}`)} class="pname">{p.name}</a>
								<span class="pcount num">{p.count}×</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if data.tournamentMatches.length > 0}
				<div class="card">
					<h3 class="card-title">{m.player_tournament_results_title()}</h3>
					<ol class="hist">
						{#each data.tournamentMatches as match (match.matchId)}
							<li class="hist-row">
								<span class="hist-badge" class:win={match.won}
									>{match.won ? m.player_win() : m.player_loss()}</span
								>
								<span class="hist-main">
									<span class="hist-rating">
										{#if match.partner}{m.player_with_partner({
												partner: match.partner.name
											})}{' '}{/if}
										{match.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ')}
									</span>
								</span>
								<span class="hist-date">{formatDate(match.playedAt)}</span>
							</li>
						{/each}
					</ol>
				</div>
			{/if}

			<div class="card">
				<h3 class="card-title">{m.player_match_history_title()}</h3>
				<ol class="hist">
					{#each data.history as match (match.matchId)}
						<li class="hist-row">
							<span class="hist-badge" class:win={match.won}
								>{match.won ? m.player_win() : m.player_loss()}</span
							>
							<span class="hist-main">
								<span class="hist-rating">
									{#if match.partner}{m.player_with_partner({
											partner: match.partner.name
										})}{' '}{/if}
									{match.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ')}
									{#if match.matchType !== 'freizeit'}
										<span class="type-tag">{matchTypeLabels()[match.matchType]}</span>
									{/if}
								</span>
								<span class="hist-detail">
									{match.ratingAfter.toFixed(2)} ({match.ratingDelta >= 0
										? '+'
										: ''}{match.ratingDelta.toFixed(2)})
								</span>
							</span>
							<span class="hist-date">{formatDate(match.playedAt)}</span>
						</li>
					{/each}
				</ol>
			</div>
		{/if}

		<p class="delist-link">
			<a href="/profil-entfernen?handle={data.profile.handle}">{m.player_delist_link()}</a>
		</p>
	</div>
</section>

<style>
	.profile-head {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.profile-legend {
		margin-top: 16px;
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
	.anon-cta {
		margin-top: 20px;
		font-size: 13.5px;
		color: var(--muted-light);
	}
	.anon-cta a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
	}
	.anon-cta a:hover {
		text-decoration: underline;
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
		color: #8f5a15;
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
	.rseries-chart {
		display: flex;
		align-items: stretch;
		gap: 10px;
		margin-top: 8px;
	}
	.rseries-axis {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 10px;
		color: var(--muted-light);
		text-align: right;
		padding: 2px 0;
	}
	.rseries-chart svg {
		flex: 1;
		min-width: 0;
		height: 60px;
		display: block;
	}
	.rseries-caption {
		display: block;
		margin-top: 4px;
		font-size: 10.5px;
		color: var(--muted-light);
		text-align: right;
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

	.delist-link {
		margin-top: 28px;
		text-align: center;
		font-size: 12.5px;
	}
	.delist-link a {
		color: var(--muted-light);
		text-decoration: underline;
	}
</style>
