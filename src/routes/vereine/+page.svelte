<script lang="ts">
	// ============================================================
	// PadelIndex — /vereine
	// ============================================================
	// Bis Block 4 des Website-Audits war das der #vereine-Anker auf der
	// Startseite. Inhalt hierher VERSCHOBEN, nicht kopiert — auf "/"
	// steht dafür nur ein kurzer Teaser mit Link hierher.

	import { reveal } from '$lib/landing/reveal';
	import ClubShowcase from '$lib/components/landing/ClubShowcase.svelte';
	import ClubDemoForm from '$lib/components/landing/ClubDemoForm.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const NAV = [
		{ href: '/#problem', label: 'Warum' },
		{ href: '/rating', label: 'Rating' },
		{ href: '/#tokens', label: 'Tokens' },
		{ href: '/vereine', label: 'Für Vereine' }
	];
</script>

<svelte:head>
	<title>PadelIndex für Vereine — Ranking auf eurer Website</title>
	<meta
		name="description"
		content="Das Level-Ranking eures Padel-Vereins auf eurer eigenen Website, in euren Farben, ohne Plugin-Chaos. Spieler tragen Ergebnisse selbst ein, das Gegnerteam bestätigt. Kostenloser Einstieg, Demo jederzeit anfragbar."
	/>
	<link rel="canonical" href="https://padelindex.de/vereine" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/vereine" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="PadelIndex für Vereine" />
	<meta
		property="og:description"
		content="Level-Ranking eures Vereins auf eurer eigenen Website — in euren Farben, ohne Datenpflege."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={NAV} />

<main>
	<!-- ============================ VEREINE ============================ -->
	<section class="sec sec-light" id="top">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Für Vereine</span>
				<h1 use:reveal={{ delay: 0.05 }}>Die Rangliste läuft auf eurer Seite.</h1>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					Eine Zeile Code, und das Ranking eures Vereins steht auf eurer Website — in euren Farben,
					ohne Plugin-Chaos, ohne dass ihr Daten pflegen müsst. Die Spieler tragen die Ergebnisse
					selbst ein, das Gegnerteam bestätigt.
				</p>
			</div>

			<div use:reveal>
				<ClubShowcase board={data.board} />
			</div>

			{#if data.trialOfferEnabled}
				<p class="trial-banner" use:reveal>
					Gründungsvereine spielen die ersten 12 Monate kostenlos — unabhängig vom Paket.
				</p>
			{/if}

			<div class="tiers">
				<div class="tier" use:reveal>
					<span class="lvl">Kostenlos</span>
					<h2>Einstieg</h2>
					<ul>
						<li>Top 10 des Vereins</li>
						<li>Spielerprofile öffentlich</li>
						<li>Hinweis auf PadelIndex</li>
					</ul>
				</div>
				<div class="tier hl" use:reveal={{ delay: 0.06 }}>
					<span class="lvl">Basic</span>
					<h2>Vereinsranking</h2>
					<ul>
						<li>Vollständige Tabelle</li>
						<li>Filter nach Level, Geschlecht, Zeitraum</li>
						<li>Clubfarben und Logo</li>
						<li>Liga-Ergebnisse importieren</li>
					</ul>
				</div>
				<div class="tier" use:reveal={{ delay: 0.12 }}>
					<span class="lvl">Pro</span>
					<h2>Volle Integration</h2>
					<ul>
						<li>Matchfinder nach Level</li>
						<li>Prämienkatalog für Tokens</li>
						<li>Eigene Subdomain</li>
						<li>Hinweis abschaltbar</li>
					</ul>
				</div>
			</div>

			<div class="demo-block" use:reveal>
				<h2>Lust, es auszuprobieren?</h2>
				<p class="muted">Kurz Verein und Kontakt hinterlassen, wir zeigen es euch.</p>
				<ClubDemoForm />
			</div>

			<p class="claim-cta">
				Du spielst als Spieler:in und noch nicht bei PadelIndex?
				<a href="/#anmelden">Platz auf der Warteliste sichern</a>
			</p>
		</div>
	</section>
</main>

<footer>
	<div class="wrap foot-in">
		<span>© 2026 PadelIndex</span>
		<div class="foot-links">
			<a href="/rating">Rating</a>
			<a href="/vereine">Vereine</a>
			<a href="/anmelden">Anmelden</a>
			<a href="/datenschutz">Datenschutz</a>
			<a href="/impressum">Impressum</a>
		</div>
	</div>
</footer>

<style>
	.claim-cta {
		margin-top: 32px;
		text-align: center;
		font-size: 13px;
		color: var(--muted-light);
	}
	.claim-cta a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
	}
	.claim-cta a:hover {
		text-decoration: underline;
	}
</style>
