<script lang="ts">
	/**
	 * Copyright (c) 2025–2026 Alec Hahn / Sportcenter Hahn GmbH
	 * All rights reserved.
	 * Proprietary and confidential.
	 * See LICENSE for details.
	 */

	// ============================================================
	// PadelIndex — /roadmap
	// ============================================================
	// Bewusst außerhalb des i18n-Scope (vite.config.ts IN_SCOPE_PATHS):
	// eine Produktvision-Seite ohne direkten Conversion-Zweck, nur über
	// den Footer erreichbar (nicht in mainNav()). Deutsch-only wie
	// /level-schaetzen — LandingNav/LandingFooter bleiben trotzdem
	// mehrsprachig, da sie auf jeder Seite eingebunden sind.
	//
	// Zentrale Botschaft: die Pilotphase ist ein Qualitätsmerkmal, keine
	// Schwäche. Deshalb ausschließlich "Geplant"/"Vision" statt fester
	// Termine (siehe Abschnitt 14 der Anfrage) — jede Phase außer der
	// aktuellen ist ausdrücklich unverbindlich formuliert.

	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import { mainNav } from '$lib/landing/nav';
	import { localizeHref } from '$lib/paraglide/runtime';

	const CANONICAL = 'https://padelindex.de/roadmap';
	const SIGNUP_HREF = localizeHref('/#anmelden');
	const FEEDBACK_HREF = 'mailto:kontakt@padelindex.de?subject=Feedback%20zur%20Roadmap';

	type Status = 'aktiv' | 'geplant' | 'vision';

	const STATUS_LABEL: Record<Status, string> = {
		aktiv: 'Aktiv',
		geplant: 'Geplant',
		vision: 'Vision'
	};

	type Phase = {
		number: string;
		when: string;
		title: string;
		headline?: string;
		status: Status;
		description: string;
		items: string[];
	};

	const PHASES: Phase[] = [
		{
			number: '01',
			when: 'Jetzt',
			title: 'Pilotphase',
			status: 'aktiv',
			description:
				'PadelIndex wird mit ersten Spielern und Pilotvereinen im echten Alltag getestet.',
			items: [
				'Echte Spieler',
				'Echte Matches',
				'Rating-System',
				'Match-Bestätigung',
				'Erste Vereins-Ranglisten',
				'Liga-Funktionen',
				'Feedback sammeln',
				'Datenqualität verbessern'
			]
		},
		{
			number: '02',
			when: 'Als Nächstes',
			title: 'Community',
			status: 'geplant',
			description:
				'Wenn das Fundament funktioniert, wird PadelIndex stärker zu einer Community-Plattform.',
			items: [
				'Spielerprofile verbessern',
				'Match-Historie ausweiten',
				'Rating-Verlauf visueller gestalten',
				'Spieler entdecken',
				'Spieler auf ähnlichem Level finden',
				'Challenges ausweiten',
				'Rivalitäten',
				'Achievements ausweiten',
				'Persönliche Statistiken',
				'Bessere Benachrichtigungen'
			]
		},
		{
			number: '03',
			when: 'Später',
			title: 'Matchmaking',
			status: 'geplant',
			description:
				'Finde Spieler und Matches, die wirklich zu deinem Level, Standort und deiner Verfügbarkeit passen.',
			items: [
				'Offene Matches',
				'Spieler-Suche',
				'Matchmaking',
				'Verfügbare Matches',
				'Level-basierte Vorschläge',
				'Standortfilter',
				'„Heute spielen"',
				'Match-Anfragen'
			]
		},
		{
			number: '04',
			when: 'Später',
			title: 'Clubs & Ligen',
			status: 'geplant',
			description:
				'PadelIndex soll Vereine dabei unterstützen, ihre Spieler, Matches und Wettbewerbe digital zu organisieren.',
			items: [
				'Club-Dashboard',
				'Spielerverwaltung',
				'Liga-Management',
				'Automatische Spielpläne',
				'Turnierverwaltung',
				'Club-Statistiken',
				'Club-Ranglisten',
				'QR-Code Match-Eintrag',
				'Club-TV / Live-Ranking'
			]
		},
		{
			number: '05',
			when: 'Später',
			title: 'Padel-Netzwerk',
			status: 'vision',
			description:
				'Wenn genügend Clubs und Spieler dabei sind, entsteht etwas Größeres: ein vernetztes Padel-Ranking.',
			items: [
				'Regionale Ranglisten',
				'Städte-Ranglisten',
				'Deutschlandweite Ranglisten',
				'Club-übergreifende Matches',
				'Nationale Wettbewerbe',
				'Spielerprofile über mehrere Clubs',
				'Öffentliche Ranglisten',
				'Padel Map'
			]
		},
		{
			number: '06',
			when: 'Vision',
			title: 'Langfristige Vision',
			headline: 'Das digitale Zuhause für Amateur-Padel.',
			status: 'vision',
			description:
				'Eine Plattform, auf der Spieler ihr Level kennen, passende Matches finden, sich verbessern, Rivalitäten entwickeln, Ligen spielen und Teil einer wachsenden Padel-Community werden.',
			items: [
				'Intelligente Matchmaking-Systeme',
				'Detaillierte Spielerstatistiken',
				'Personalisierte Spielanalysen',
				'Club-Analytics',
				'Rewards',
				'Partnerangebote',
				'Turniere',
				'Nationale Padel-Events',
				'API / Integrationen',
				'Weitere, noch nicht definierte Funktionen'
			]
		}
	];

	const FOCUS_ITEMS = [
		'Erste Vereine integrieren',
		'Echte Spieler gewinnen',
		'Echte Matches erfassen',
		'Rating unter realen Bedingungen testen',
		'Feedback von Spielern und Clubs sammeln',
		'Prozesse verbessern',
		'Datenqualität sicherstellen',
		'Das System im echten Club-Alltag testen'
	];

	const FACTORS = [
		{ label: 'Spieler', question: 'Was brauchen Spieler wirklich?' },
		{ label: 'Clubs', question: 'Was hilft Vereinen im Alltag?' },
		{ label: 'Daten', question: 'Was zeigen echte Matches und echte Nutzung?' },
		{ label: 'Feedback', question: 'Was funktioniert — und was nicht?' }
	];
</script>

<svelte:head>
	<title>Roadmap – PadelIndex</title>
	<meta
		name="description"
		content="Erfahre, wie sich PadelIndex entwickelt – von der Pilotphase mit echten Spielern und Matches bis zur langfristigen Vision einer vernetzten Padel-Plattform."
	/>
	<link rel="canonical" href={CANONICAL} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={CANONICAL} />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="Roadmap – PadelIndex" />
	<meta
		property="og:description"
		content="Erfahre, wie sich PadelIndex entwickelt – von der Pilotphase mit echten Spielern und Matches bis zur langfristigen Vision einer vernetzten Padel-Plattform."
	/>
	<meta property="og:image" content="https://padelindex.de/og/share-de.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<!-- ============================ HERO ============================ -->
	<header class="hero rm-hero" id="top">
		<div class="mullions" aria-hidden="true">
			<i style="left:12%"></i><i style="left:31%"></i><i style="left:50%"></i>
			<i style="left:69%"></i><i style="left:88%"></i>
		</div>
		<div class="wrap">
			<span class="eyebrow" use:reveal>Roadmap</span>
			<h1 class="rm-h1" use:reveal={{ delay: 0.05 }}>Die Zukunft von PadelIndex</h1>
			<p class="hero-sub" use:reveal={{ delay: 0.1 }}>
				PadelIndex startet mit echten Spielern, echten Matches und echten Daten. Gemeinsam mit
				unseren ersten Pilotvereinen entwickeln wir Schritt für Schritt die Plattform für vernetztes
				Amateur-Padel.
			</p>
			<div class="rm-status-row" use:reveal={{ delay: 0.15 }}>
				<span class="rm-badge rm-badge-aktiv">
					<i aria-hidden="true"></i>Aktuell: Pilotphase
				</span>
			</div>
			<p class="hero-note" use:reveal={{ delay: 0.2 }}>
				Wir bauen zuerst das Fundament. Dann das Netzwerk.
			</p>
		</div>
	</header>

	<!-- ============================ JETZT: PILOTPHASE ============================ -->
	<section class="sec sec-light" id="pilotphase">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>
					<span class="rm-dot rm-dot-aktiv" aria-hidden="true"></span>Jetzt
				</span>
				<h2 use:reveal={{ delay: 0.05 }}>Pilotphase</h2>
			</div>

			<p class="rm-pilot-mark" use:reveal={{ delay: 0.08 }}>Pilotphase</p>
			<p class="muted rm-pilot-sub" use:reveal={{ delay: 0.1 }}>
				Echte Aktivität statt theoretischer Features. Aktuell konzentrieren wir uns darauf:
			</p>

			<ul class="rm-focus-list" use:reveal={{ delay: 0.12 }}>
				{#each FOCUS_ITEMS as item (item)}
					<li>{item}</li>
				{/each}
			</ul>

			<a class="btn btn-primary" href={SIGNUP_HREF} use:reveal={{ delay: 0.18 }}>
				Jetzt PadelIndex nutzen
			</a>
		</div>
	</section>

	<!-- ============================ WARUM NICHT ALLES GLEICHZEITIG ============================ -->
	<section class="sec" style="background:var(--night-2)">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Fokus statt Feature-Flut</span>
				<h2 use:reveal={{ delay: 0.05 }}>Erst das Fundament. Dann die Plattform.</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					Wir könnten viele Funktionen gleichzeitig entwickeln. Aber PadelIndex soll nicht möglichst
					viele Features haben — es soll im echten Padel-Alltag funktionieren.
				</p>
				<p class="muted" use:reveal={{ delay: 0.14 }}>
					Deshalb sammeln wir zuerst echte Erfahrungen mit Spielern und Vereinen. Die Aktivität der
					Community entscheidet mit darüber, welche Funktionen als Nächstes Priorität bekommen.
				</p>
			</div>
		</div>
	</section>

	<!-- ============================ TIMELINE ============================ -->
	<section class="sec sec-light" id="timeline">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Vision</span>
				<h2 use:reveal={{ delay: 0.05 }}>Wohin sich PadelIndex entwickeln kann</h2>
				<p class="muted" use:reveal={{ delay: 0.1 }}>
					Eine Vision, keine verbindliche Terminplanung — abhängig von Feedback und Nutzung.
				</p>
			</div>

			<ol class="rm-timeline" use:reveal={{ delay: 0.12 }}>
				{#each PHASES as phase, i (phase.number)}
					<li class="rm-tl-item" class:rm-tl-active={phase.status === 'aktiv'}>
						<div class="rm-tl-marker" aria-hidden="true">
							<span class="rm-dot rm-dot-{phase.status}"></span>
						</div>
						<div class="rm-tl-card" use:reveal={{ delay: 0.05 * i }}>
							<div class="rm-tl-head">
								<span class="rm-tl-phase">Phase {phase.number}</span>
								<span class="rm-tl-when">{phase.when}</span>
							</div>
							<h3>{phase.title}</h3>
							<span class="rm-badge rm-badge-{phase.status}">
								<i aria-hidden="true"></i>{STATUS_LABEL[phase.status]}
							</span>
							{#if phase.headline}
								<p class="rm-tl-headline">{phase.headline}</p>
							{/if}
							<p class="rm-tl-desc">{phase.description}</p>
							<ul class="rm-tl-items">
								{#each phase.items as item (item)}
									<li>{item}</li>
								{/each}
							</ul>
						</div>
					</li>
				{/each}

				<li class="rm-tl-item rm-tl-egg">
					<div class="rm-tl-marker" aria-hidden="true">
						<span class="rm-dot rm-dot-egg"></span>
					</div>
					<div class="rm-tl-card" use:reveal>
						<p class="rm-tl-egg-q" aria-hidden="true">?</p>
						<h3>Was kommt danach?</h3>
						<p class="rm-tl-desc">Das entscheiden wir gemeinsam.</p>
					</div>
				</li>
			</ol>
		</div>
	</section>

	<!-- ============================ COMMUNITY ENTSCHEIDET MIT ============================ -->
	<section class="sec" id="community">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Priorisierung</span>
				<h2 use:reveal={{ delay: 0.05 }}>Die Community entscheidet mit.</h2>
			</div>

			<div class="rm-factors" use:reveal={{ delay: 0.08 }}>
				{#each FACTORS as factor (factor.label)}
					<div class="rm-factor">
						<span class="k">{factor.label}</span>
						<p>{factor.question}</p>
					</div>
				{/each}
			</div>

			<p class="muted rm-factors-note" use:reveal={{ delay: 0.15 }}>
				Die Roadmap ist deshalb bewusst flexibel. Die nächsten Schritte entstehen aus echter Nutzung
				und echtem Feedback.
			</p>
		</div>
	</section>

	<!-- ============================ FEEDBACK CTA ============================ -->
	<section class="sec sec-light-alt" id="feedback">
		<div class="wrap" style="max-width: 640px; text-align: center">
			<h2 use:reveal>Was sollte PadelIndex als Nächstes können?</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }} style="margin-top:16px">
				Du hast eine Idee, die PadelIndex besser machen würde? Wir wollen sie hören.
			</p>
			<a
				class="btn btn-primary"
				href={FEEDBACK_HREF}
				use:reveal={{ delay: 0.1 }}
				style="margin-top:26px; display:inline-flex"
			>
				Feedback geben
			</a>
		</div>
	</section>

	<!-- ============================ ABSCHLUSS-CTA ============================ -->
	<section class="cta">
		<div class="mullions" aria-hidden="true">
			<i style="left:20%"></i><i style="left:40%"></i><i style="left:60%"></i><i style="left:80%"
			></i>
		</div>
		<div class="wrap cta-in">
			<span class="eyebrow" use:reveal>Gemeinsam</span>
			<h2 use:reveal={{ delay: 0.05 }}>Wir bauen das gemeinsam.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }} style="margin-top:22px">
				PadelIndex beginnt nicht mit tausend Features. Es beginnt mit echten Spielern, echten
				Matches und einem besseren Verständnis dafür, was Padel wirklich braucht.
			</p>
			<div use:reveal={{ delay: 0.15 }} style="margin-top:34px">
				<a class="btn btn-primary" href={SIGNUP_HREF}>Teil der Pilotphase werden</a>
			</div>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.rm-hero {
		padding-bottom: clamp(40px, 6vh, 64px);
	}
	.rm-h1 {
		font-size: clamp(38px, 5.2vw, 68px);
		margin: 20px 0 0;
		max-width: 18ch;
	}
	.rm-status-row {
		margin-top: 30px;
	}

	/* Status-Badges — bewusst nur bestehende Tokens (--court/--signal/--sand),
	   siehe Punkt 11 der Anfrage: keine neue Farbe fürs "Vision"-Türkis. */
	.rm-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--mono);
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 8px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-dark);
	}
	.sec-light .rm-badge {
		border-color: var(--line-light);
	}
	.rm-badge i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
		flex: none;
	}
	.rm-badge-aktiv {
		color: var(--court);
	}
	.sec-light .rm-badge-aktiv {
		color: var(--court-deep);
	}
	.rm-badge-geplant {
		color: var(--signal);
	}
	.sec-light .rm-badge-geplant {
		color: #9c7115;
	}
	.rm-badge-vision {
		color: var(--sand);
	}
	.sec-light .rm-badge-vision {
		color: #8a7a54;
	}

	.rm-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
		background: var(--court);
	}
	.rm-dot-aktiv {
		background: var(--court);
	}
	.rm-dot-geplant {
		background: var(--signal);
	}
	.rm-dot-vision {
		background: var(--sand);
	}
	.rm-dot-egg {
		background: transparent;
		border: 1.5px dashed var(--muted-light);
	}

	/* Pilotphase-Fokus */
	.rm-pilot-mark {
		margin: 40px 0 0;
		font-family: var(--display);
		font-weight: 800;
		letter-spacing: -0.03em;
		font-size: clamp(48px, 10vw, 128px);
		line-height: 0.95;
		color: var(--court-deep);
	}
	.rm-pilot-sub {
		margin-top: 18px;
		max-width: 56ch;
		font-size: 15px;
	}
	.rm-focus-list {
		list-style: none;
		margin: 30px 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1px;
		background: var(--line-light);
		border: 1px solid var(--line-light);
		border-radius: 14px;
		overflow: hidden;
	}
	.rm-focus-list li {
		background: var(--chalk-2);
		padding: 16px 18px;
		font-size: 14px;
		color: var(--ink);
		position: relative;
		padding-left: 34px;
	}
	.rm-focus-list li::before {
		content: '';
		position: absolute;
		left: 16px;
		top: 21px;
		width: 8px;
		height: 2px;
		background: var(--court-deep);
	}
	.rm-focus-list + .btn {
		margin-top: 36px;
	}

	/* Timeline */
	.rm-timeline {
		list-style: none;
		margin: 56px 0 0;
		padding: 0;
		position: relative;
	}
	.rm-tl-item {
		position: relative;
		display: grid;
		grid-template-columns: 28px 1fr;
		gap: 22px;
		padding-bottom: 40px;
	}
	.rm-tl-item:last-child {
		padding-bottom: 0;
	}
	.rm-tl-marker {
		position: relative;
		display: flex;
		justify-content: center;
	}
	.rm-tl-marker::before {
		content: '';
		position: absolute;
		top: 20px;
		bottom: -40px;
		width: 1px;
		background: var(--line-light);
	}
	.rm-tl-item:last-child .rm-tl-marker::before {
		display: none;
	}
	.rm-tl-marker .rm-dot {
		margin-top: 6px;
		width: 13px;
		height: 13px;
		border: 3px solid var(--chalk);
		box-shadow: 0 0 0 1px var(--line-light);
	}
	.rm-tl-active .rm-tl-marker .rm-dot {
		box-shadow:
			0 0 0 1px var(--line-light),
			0 0 0 6px rgba(22, 163, 148, 0.18);
	}

	.rm-tl-card {
		padding: 24px 26px;
		border-radius: 16px;
		background: #fbfbf9;
		border: 1px solid var(--line-light);
	}
	.rm-tl-active .rm-tl-card {
		border-color: var(--court-deep);
		box-shadow: 0 22px 50px -30px rgba(15, 110, 92, 0.45);
	}
	.rm-tl-head {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.rm-tl-phase {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted-light);
	}
	.rm-tl-when {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--court-deep);
	}
	.rm-tl-card h3 {
		font-size: clamp(20px, 2.4vw, 26px);
		margin: 10px 0 12px;
	}
	.rm-tl-headline {
		margin-top: 14px;
		font-family: var(--display);
		font-weight: 600;
		font-size: 17px;
		color: var(--ink);
	}
	.rm-tl-desc {
		margin-top: 14px;
		font-size: 14.5px;
		color: var(--muted-light);
		max-width: 60ch;
	}
	.rm-tl-items {
		list-style: none;
		margin: 18px 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.rm-tl-items li {
		font-size: 12.5px;
		color: var(--muted-light);
		background: var(--chalk);
		border: 1px solid var(--line-light);
		border-radius: 100px;
		padding: 6px 13px;
	}

	.rm-tl-egg .rm-tl-card {
		text-align: center;
		border-style: dashed;
	}
	.rm-tl-egg-q {
		font-family: var(--display);
		font-weight: 800;
		font-size: 34px;
		color: var(--muted-light);
		margin: 0;
	}
	.rm-tl-egg h3 {
		margin: 8px 0 0 !important;
	}
	.rm-tl-egg .rm-tl-desc {
		margin: 8px auto 0;
	}

	@media (min-width: 640px) {
		.rm-tl-item {
			grid-template-columns: 40px 1fr;
		}
	}

	/* Community-Faktoren — eigene 4er-Variante von .factor/.factors
	   (landing.css kennt nur die 3-spaltige Startseiten-Version). */
	.rm-factors {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: clamp(18px, 2.4vw, 28px);
		margin-top: 48px;
	}
	@media (max-width: 860px) {
		.rm-factors {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 480px) {
		.rm-factors {
			grid-template-columns: 1fr;
		}
	}
	.rm-factor {
		padding-top: 18px;
		border-top: 2px solid var(--court);
	}
	.rm-factor .k {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--court);
		display: block;
		margin-bottom: 12px;
	}
	.rm-factor p {
		font-size: 14.5px;
		color: var(--muted-dark);
	}
	.rm-factors-note {
		margin-top: 40px;
		max-width: 56ch;
	}
</style>
