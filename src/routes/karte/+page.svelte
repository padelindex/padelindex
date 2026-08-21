<script lang="ts">
	// ============================================================
	// PadelIndex — /karte
	// ============================================================
	// Übersicht aller erfassten Padel-Anlagen in Deutschland, mit
	// Hervorhebung derer, die PadelIndex nutzen.
	//
	// EHRLICHKEIT ÜBER DEN DATENSTAND: das Verzeichnis erhebt keinen
	// Anspruch auf Vollständigkeit und sagt das auch. Anlagen ohne
	// Koordinaten erscheinen nicht auf der Karte, stehen aber in der
	// Liste und werden gezählt — statt sie stillschweigend zu verlieren.
	//
	// DIE LISTE IST KEIN BEIWERK: eine Karte ist für Screenreader und
	// Tastaturnutzung praktisch wertlos. Dieselben Daten stehen deshalb
	// als bedienbare Liste darunter, nicht als Zusatz, sondern als
	// gleichwertiger Weg. Sie rendert außerdem serverseitig — die Seite
	// ist damit auch ohne JavaScript und für Suchmaschinen vollständig.

	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import VenueMap from '$lib/components/VenueMap.svelte';
	import { FILTER_LABELS, filterVenues, type VenueFilter } from '$lib/venues';
	import type { PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data }: { data: PageData } = $props();

	let filter = $state<VenueFilter>('all');
	let query = $state('');
	let selectedId = $state<string | null>(null);

	const shown = $derived(filterVenues(data.venues, filter, query));
	const shownOnMap = $derived(shown.filter((v) => v.lat !== null));
	const FILTERS: VenueFilter[] = ['all', 'partner', 'non_partner'];
</script>

<svelte:head>
	<title>Padel-Anlagen in Deutschland — Karte | PadelIndex</title>
	<meta
		name="description"
		content="Karte der Padel-Anlagen in Deutschland. Grün markiert sind Vereine, die PadelIndex für ihre Rangliste nutzen."
	/>
	<link rel="canonical" href="https://padelindex.de/karte" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/karte" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="Padel-Anlagen in Deutschland" />
	<meta
		property="og:description"
		content="Wo kann man in Deutschland Padel spielen — und welche Vereine nutzen PadelIndex?"
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Karte</span>
				<h1 use:reveal={{ delay: 0.05 }}>Padel-Anlagen in Deutschland.</h1>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					{#if data.venues.length === 0}
						Das Verzeichnis wird gerade aufgebaut — hier stehen bald die Anlagen, die wir erfasst
						haben.
					{:else}
						{data.venues.length}
						{data.venues.length === 1 ? 'erfasste Anlage' : 'erfasste Anlagen'}, davon
						{data.partnerCount} mit PadelIndex. Das Verzeichnis wächst nach und nach und erhebt keinen
						Anspruch auf Vollständigkeit — fehlt deine Anlage,
						<a href="mailto:kontakt@padelindex.de?subject=Anlage%20fehlt%20auf%20der%20Karte">
							schreib uns
						</a>.
					{/if}
				</p>
			</div>

			<!-- ============================ LEGENDE ============================ -->
			<ul class="legend" use:reveal>
				<li><span class="dot dot-partner" aria-hidden="true"></span> PadelIndex Partner</li>
				<li><span class="dot dot-open" aria-hidden="true"></span> Noch kein PadelIndex Partner</li>
			</ul>

			<!-- ============================ FILTER + SUCHE ============================ -->
			<div class="controls" use:reveal>
				<div class="filters" role="group" aria-label="Nach Status filtern">
					{#each FILTERS as f (f)}
						<button
							type="button"
							class="chip"
							class:active={filter === f}
							aria-pressed={filter === f}
							onclick={() => (filter = f)}
						>
							{FILTER_LABELS[f]}
						</button>
					{/each}
				</div>

				<div class="searchbox">
					<label class="sr-only" for="venue-search">Nach Clubname, Stadt oder PLZ suchen</label>
					<input
						id="venue-search"
						type="search"
						placeholder="Club, Stadt oder PLZ …"
						bind:value={query}
						autocomplete="off"
					/>
				</div>
			</div>

			<p class="count" role="status" aria-live="polite">
				{shown.length}
				{shown.length === 1 ? 'Anlage' : 'Anlagen'}
				{#if shown.length !== shownOnMap.length}
					· {shown.length - shownOnMap.length} davon ohne Koordinaten, nur in der Liste
				{/if}
			</p>

			<!-- ============================ KARTE ============================ -->
			{#if shownOnMap.length > 0}
				<VenueMap venues={shownOnMap} bind:selectedId />
			{/if}

			<!-- ============================ LISTE ============================ -->
			<h2 class="listtitle" use:reveal>Alle Anlagen</h2>

			{#if shown.length === 0}
				<p class="empty">
					Nichts gefunden. Andere Suche probieren oder den Filter auf „Alle" stellen.
				</p>
			{:else}
				<ul class="venues">
					{#each shown as v (v.id)}
						<li class="venue" class:partner={v.isPartner} class:active={selectedId === v.id}>
							<div class="v-head">
								<h3>{v.name}</h3>
								<span class="badge" class:badge-partner={v.isPartner}>
									{v.isPartner ? 'PadelIndex Partner' : 'Noch kein Partner'}
								</span>
							</div>

							{#if v.address || v.city}
								<p class="v-addr">
									{#if v.address}{v.address}{/if}
									{#if v.address && (v.postalCode || v.city)}<br />{/if}
									{[v.postalCode, v.city].filter(Boolean).join(' ')}
								</p>
							{/if}

							<div class="v-links">
								{#if v.lat !== null}
									<button type="button" class="linkish" onclick={() => (selectedId = v.id)}>
										Auf der Karte zeigen
									</button>
								{/if}
								{#if v.website}
									<a href={v.website} target="_blank" rel="noopener noreferrer">Website</a>
								{/if}
								{#if v.isPartner && v.clubSlug}
									<a href="/c/{v.clubSlug}">Rangliste</a>
								{/if}
							</div>

							{#if !v.isPartner}
								<div class="v-cta">
									<p>Betreibst du diesen Club? Werde Teil von PadelIndex.</p>
									<div class="v-cta-actions">
										<a class="btn btn-primary" href="/vereine#demo">Interesse anmelden</a>
										<a
											class="linkish"
											href="mailto:kontakt@padelindex.de?subject={encodeURIComponent(
												`PadelIndex für ${v.name}`
											)}"
										>
											kontakt@padelindex.de
										</a>
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	h1 {
		margin-top: 18px;
	}
	.sec-head .muted {
		margin-top: 14px;
		max-width: 62ch;
	}
	.sec-head a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		list-style: none;
		margin: 28px 0 0;
		padding: 0;
		font-size: 14px;
		color: var(--muted-light);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 1.5px solid var(--night);
		flex-shrink: 0;
	}
	.dot-partner {
		background: #16a394;
	}
	.dot-open {
		background: #e9b23c;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		justify-content: space-between;
		margin-top: 20px;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		padding: 8px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light);
		background: transparent;
		color: var(--muted-light);
		font-family: var(--body);
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s,
			background 0.15s;
	}
	.chip:hover {
		border-color: var(--court);
		color: var(--court-deep, #0f6e5c);
	}
	.chip.active {
		background: var(--court);
		border-color: var(--court);
		color: #04231f;
	}
	.searchbox {
		flex: 1 1 220px;
		max-width: 340px;
	}
	.searchbox input {
		width: 100%;
		padding: 10px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light);
		background: #fff;
		color: var(--ink);
		font-family: var(--body);
		font-size: 14px;
	}
	.searchbox input::placeholder {
		color: var(--muted-light);
	}

	.count {
		margin-top: 14px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.05em;
		color: var(--muted-light);
	}

	.listtitle {
		margin-top: 44px;
		font-size: clamp(22px, 2.6vw, 30px);
	}
	.empty {
		margin-top: 16px;
		color: var(--muted-light);
	}

	.venues {
		list-style: none;
		margin: 20px 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}
	.venue {
		padding: 18px;
		border-radius: 14px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2);
		border-left: 4px solid #e9b23c;
	}
	.venue.partner {
		border-left-color: #16a394;
	}
	.venue.active {
		border-color: var(--court);
	}
	.v-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}
	.v-head h3 {
		font-size: 17px;
	}
	.badge {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 3px 9px;
		border-radius: 100px;
		background: rgba(233, 178, 60, 0.22);
		color: #7a5300;
		white-space: nowrap;
	}
	.badge-partner {
		background: rgba(22, 163, 148, 0.16);
		color: var(--court-deep, #0f6e5c);
	}
	.v-addr {
		margin-top: 8px;
		font-size: 13.5px;
		color: var(--muted-light);
		line-height: 1.5;
	}
	.v-links {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin-top: 12px;
		font-size: 13.5px;
	}
	.v-links a,
	.linkish {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}
	.v-links a:hover,
	.linkish:hover {
		border-bottom-color: currentColor;
	}
	.linkish {
		background: none;
		border: none;
		border-bottom: 1px solid transparent;
		padding: 0;
		font-family: var(--body);
		font-size: inherit;
		cursor: pointer;
	}

	.v-cta {
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--line-light);
	}
	.v-cta p {
		font-size: 13.5px;
		color: var(--ink);
	}
	.v-cta-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin-top: 10px;
		font-size: 13.5px;
	}
</style>
