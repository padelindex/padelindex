<script lang="ts">
	import { reveal } from '$lib/landing/reveal';
	import HeroSequence from '$lib/components/landing/HeroSequence.svelte';
	import PartnerProblem from '$lib/components/landing/PartnerProblem.svelte';
	import MatchLab from '$lib/components/landing/MatchLab.svelte';
	import ConfidenceCurve from '$lib/components/landing/ConfidenceCurve.svelte';
	import RatingJourney from '$lib/components/landing/RatingJourney.svelte';
	import TokenFlow from '$lib/components/landing/TokenFlow.svelte';
	import ClubShowcase from '$lib/components/landing/ClubShowcase.svelte';
	import ClubDemoForm from '$lib/components/landing/ClubDemoForm.svelte';
	import SignupForm from '$lib/components/landing/SignupForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let menuOpen = $state(false);
	const close = () => (menuOpen = false);

	const NAV = [
		{ href: '#problem', label: 'Warum' },
		{ href: '#rechnen', label: 'Rating' },
		{ href: '#verlauf', label: 'Verlauf' },
		{ href: '#tokens', label: 'Tokens' },
		{ href: '#vereine', label: 'Für Vereine' }
	];
</script>

<svelte:head>
	<title>PadelIndex — Dein Level. Belegt, nicht behauptet.</title>
	<meta
		name="description"
		content="PadelIndex ist die unabhängige Rangliste für Padel-Amateure. Bayes'sches Rating für Doppel, Bestätigung durch das Gegnerteam, vereinsübergreifend. Probier im Match-Simulator aus, wie sich dein Wert verändert."
	/>
	<link rel="canonical" href="https://padelindex.de/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="PadelIndex — Dein Level. Belegt, nicht behauptet." />
	<meta
		property="og:description"
		content="Rating für Padel-Doppel aus bestätigten Matches: Gegnerstärke, Satzverlauf und Sicherheit statt Selbsteinschätzung."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<!-- ============================ NAV ============================ -->
<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="#top" aria-label="PadelIndex Startseite">
			<svg viewBox="0 0 40 40" aria-hidden="true">
				<circle
					cx="20"
					cy="20"
					r="13"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-dasharray="63.7 81.68"
					stroke-linecap="round"
					transform="rotate(-90 20 20)"
					opacity=".9"
				/>
				<g fill="currentColor">
					<rect x="12.6" y="21.5" width="3" height="6" rx="1.5" />
					<rect x="18.5" y="17.5" width="3" height="10" rx="1.5" />
					<rect x="24.4" y="13.5" width="3" height="14" rx="1.5" />
				</g>
				<circle cx="7.2" cy="17.6" r="2.9" fill="currentColor" />
			</svg>
			<span>Padel<b>Index</b></span>
		</a>

		<div class="nav-links">
			{#each NAV as item (item.href)}
				<a href={item.href}>{item.label}</a>
			{/each}
		</div>

		<div class="nav-right">
			<a class="nav-login" href="/anmelden">Anmelden</a>
			<a class="btn btn-primary nav-cta" href="#anmelden">Platz sichern</a>
			<button
				class="nav-burger"
				type="button"
				aria-expanded={menuOpen}
				aria-controls="nav-panel"
				aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class:x={menuOpen}></span>
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div class="nav-panel" id="nav-panel">
			<div class="wrap">
				{#each NAV as item (item.href)}
					<a href={item.href} onclick={close}>{item.label}</a>
				{/each}
				<a href="/anmelden" onclick={close}>Anmelden</a>
				<a class="btn btn-primary" href="#anmelden" onclick={close}>Platz sichern</a>
			</div>
		</div>
	{/if}
</nav>

<!-- ============================ HERO ============================ -->
<header class="hero" id="top">
	<div class="mullions" aria-hidden="true">
		<i style="left:12%"></i><i style="left:31%"></i><i style="left:50%"></i>
		<i style="left:69%"></i><i style="left:88%"></i>
	</div>
	<div class="wrap hero-in">
		<div>
			<span class="eyebrow" use:reveal>Rangliste für Padel-Amateure</span>
			<h1 use:reveal={{ delay: 0.06 }}>Dein Level.<br /><em>Belegt,</em><br />nicht behauptet.</h1>
			<p class="hero-sub" use:reveal={{ delay: 0.12 }}>
				PadelIndex misst, wie stark du wirklich spielst — über Vereinsgrenzen hinweg, aus
				bestätigten Ergebnissen, mit einem Modell, das für Doppel gebaut ist statt für Schach.
			</p>
			<div class="hero-cta" use:reveal={{ delay: 0.18 }}>
				<a class="btn btn-primary" href="#anmelden">Mein Level herausfinden</a>
				<a class="btn btn-ghost" href="#rechnen">Erst mal ausprobieren</a>
			</div>
			<p class="hero-note" use:reveal={{ delay: 0.24 }}>
				Gründungsvereine · Oberland &amp; Umgebung
			</p>
		</div>

		<div use:reveal={{ delay: 0.1 }}>
			<HeroSequence />
		</div>
	</div>
</header>

<!-- ============================ PROBLEM ============================ -->
<section class="sec" id="problem" style="background:var(--night-2)">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Das Problem</span>
			<h2 use:reveal={{ delay: 0.05 }}>Fast jeder kennt sein Level nur ungefähr.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Level werden geschätzt, in Fragebögen angeklickt oder pro Verein anders vergeben. Sobald du
				woanders spielst, gilt die Zahl nichts mehr. Der häufigste Einwand lässt sich aber
				nachrechnen — hier ist er.
			</p>
		</div>

		<div use:reveal>
			<PartnerProblem />
		</div>

		<div class="gripes">
			<article class="gripe" use:reveal>
				<span class="tag">Stillstand</span>
				<p class="q">„Ich bin klar besser geworden — die Zahl bewegt sich trotzdem nicht."</p>
				<p class="a">
					Bei PadelIndex bewegt sich dein Wert nach jedem bestätigten Match, und du siehst, welcher
					Anteil davon aus Gegnerstärke, Satzverlauf und Serie kommt.
				</p>
			</article>
			<article class="gripe" use:reveal={{ delay: 0.07 }}>
				<span class="tag">Aufgeblähte Werte</span>
				<p class="q">„Der spielt nur in seiner Runde und steht plötzlich ganz oben."</p>
				<p class="a">
					Jedes Ergebnis braucht die Bestätigung des Gegnerteams. Ergebnisse ohne Gegenüber zählen
					nicht — erfundene Matches also auch nicht.
				</p>
			</article>
			<article class="gripe" use:reveal={{ delay: 0.14 }}>
				<span class="tag">Blackbox</span>
				<p class="q">„6:1, 6:2 gewonnen, Wert steigt um nichts. Verstehe ich nicht."</p>
				<p class="a">
					Deshalb legen wir die Rechnung offen: nach jedem Match steht da, was sich verändert hat
					und warum. Auch dann, wenn die Zahl nicht gefällt.
				</p>
			</article>
		</div>
	</div>
</section>

<!-- ============================ SIMULATOR ============================ -->
<section class="sec sec-light" id="rechnen">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>So rechnet es</span>
			<h2 use:reveal={{ delay: 0.05 }}>Ein Match verändert dein Level.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Dreh an den Werten und drück auf Berechnen. Gerechnet wird mit demselben Code, der auch
				produktiv die Ratings vergibt — inklusive der Doppel-Logik: Wen das System schlechter kennt,
				dessen Wert bewegt sich stärker. Stell die Matchzahl eines Spielers auf null und sieh zu.
			</p>
		</div>

		<div use:reveal>
			<MatchLab />
		</div>

		<div class="factors">
			<article class="factor" use:reveal>
				<span class="k">01 — Erwartung</span>
				<h3>Wen du geschlagen hast</h3>
				<p>
					Ein Sieg gegen ein stärkeres Duo sagt mehr aus als einer gegen ein schwächeres.
					Überraschungen enthalten die meiste Information, also wiegen sie am schwersten.
				</p>
			</article>
			<article class="factor" use:reveal={{ delay: 0.07 }}>
				<span class="k">02 — Deutlichkeit</span>
				<h3>Wie klar es war</h3>
				<p>
					6:0, 6:0 ist eine andere Aussage als 7:6, 5:7, 7:5. Der Satzverlauf geht in jede Rechnung
					ein — eine knappe Niederlage gegen starke Gegner kostet dich kaum etwas.
				</p>
			</article>
			<article class="factor" use:reveal={{ delay: 0.14 }}>
				<span class="k">03 — Sicherheit</span>
				<h3>Wie gut wir dich kennen</h3>
				<p>
					Am Anfang schwankt dein Wert stark, das ist Absicht: nach etwa zehn bis fünfzehn Matches
					steht dein Bereich. Danach wird nur noch feinjustiert.
				</p>
			</article>
		</div>

		<p class="rechnen-cta" use:reveal={{ delay: 0.18 }}>
			Das war nur die Simulation — für dein echtes Level braucht es ein echtes Match.
			<a href="#anmelden">Platz sichern →</a>
		</p>
	</div>
</section>

<!-- ============================ SICHERHEIT ============================ -->
<section class="sec" id="sicherheit">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Sicherheit</span>
			<h2 use:reveal={{ delay: 0.05 }}>Je mehr du spielst, desto genauer wird dein Level.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Wir speichern für dich keine einzelne Zahl, sondern eine Verteilung: eine Schätzung deines
				Könnens plus die Unsicherheit dazu. Angezeigt wird bewusst der vorsichtige Rand — wer wenig
				gespielt hat, wird lieber unterschätzt als überschätzt.
			</p>
		</div>

		<div use:reveal>
			<ConfidenceCurve />
		</div>
	</div>
</section>

<!-- ============================ VERLAUF ============================ -->
<section class="sec sec-light" id="verlauf">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Verlauf</span>
			<h2 use:reveal={{ delay: 0.05 }}>Eine Saison, Match für Match.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Kein gezeichneter Graph: Diese vierzehn Matches sind nacheinander durch das echte Modell
				gelaufen — vom ersten Eintrag als unbekannter Spieler bis zum Ende der provisorischen Phase.
			</p>
		</div>

		<div use:reveal>
			<RatingJourney />
		</div>
	</div>
</section>

<!-- ============================ VERGLEICH ============================ -->
<section class="sec sec-light-alt" id="vergleich">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Im Vergleich</span>
			<h2 use:reveal={{ delay: 0.05 }}>Was daran anders ist.</h2>
		</div>

		<table class="cmp" use:reveal>
			<thead>
				<tr>
					<th>Merkmal</th>
					<th>PadelIndex</th>
					<th>Selbsteinschätzung &amp; einfaches Elo</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Startwert</th>
					<td data-l="PadelIndex" class="yes">Vorsichtig gesetzt, kalibriert sich schnell</td>
					<td data-l="Üblich" class="no">Fragebogen, oft danebenliegend</td>
				</tr>
				<tr>
					<th>Doppel</th>
					<td data-l="PadelIndex" class="yes">Einzelwert innerhalb des Teams</td>
					<td data-l="Üblich" class="no">Paar wird als eine Einheit behandelt</td>
				</tr>
				<tr>
					<th>Satzverlauf</th>
					<td data-l="PadelIndex" class="yes">Fließt in jede Rechnung ein</td>
					<td data-l="Üblich" class="no">Ignoriert — 6:0 zählt wie 7:6</td>
				</tr>
				<tr>
					<th>Bestätigung</th>
					<td data-l="PadelIndex" class="yes">Gegnerteam bestätigt, 48 Stunden Frist</td>
					<td data-l="Üblich" class="no">Häufig gar keine</td>
				</tr>
				<tr>
					<th>Nach einer Pause</th>
					<td data-l="PadelIndex" class="yes">Unsicherheit wächst, du kalibrierst neu</td>
					<td data-l="Üblich" class="no">Wert bleibt einfach stehen</td>
				</tr>
				<tr>
					<th>Nachvollziehbar</th>
					<td data-l="PadelIndex" class="yes">Jede Änderung aufgeschlüsselt</td>
					<td data-l="Üblich" class="no">Keine Erklärung</td>
				</tr>
				<tr>
					<th>Gilt wo?</th>
					<td data-l="PadelIndex" class="yes">Vereinsübergreifend, plattformunabhängig</td>
					<td data-l="Üblich" class="no">Pro Verein oder pro App eigene Skala</td>
				</tr>
			</tbody>
		</table>
	</div>
</section>

<!-- ============================ TOKENS ============================ -->
<section class="sec" id="tokens">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Index Tokens</span>
			<h2 use:reveal={{ delay: 0.05 }}>Spielen zahlt sich aus. Wörtlich.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Für jedes bestätigte Match bekommst du Tokens. Einlösen kannst du sie bei deinem Verein —
				gegen Trainerstunden, Ausrüstung, Startgebühren. Wie Bonusmeilen, nur für Padel.
			</p>
		</div>

		<div use:reveal>
			<TokenFlow />
		</div>
	</div>
</section>

<!-- ============================ BRUCH ============================ -->
<!-- Bewusster Wechsel der Zielgruppe: bis hierhin ging es um dich als
     Spieler:in, ab hier um deinen Verein. Eigener, andersfarbiger
     Abschnitt statt eines nahtlosen Übergangs, damit das nicht untergeht
     (Website-Audit Block 2: "visueller Bruch"). -->
<section class="sec-break">
	<div class="wrap">
		<span class="eyebrow" use:reveal>Wechsel der Perspektive</span>
		<p use:reveal={{ delay: 0.05 }}>
			Ab hier geht es nicht mehr um dein eigenes Level, sondern um deinen Verein — falls du gerade
			nur als Spieler:in hier bist, ist <a href="#anmelden">der Platz auf der Warteliste</a> weiter
			oben schon alles, was du brauchst.
		</p>
	</div>
</section>

<!-- ============================ VEREINE ============================ -->
<section class="sec sec-light" id="vereine">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Für Vereine</span>
			<h2 use:reveal={{ delay: 0.05 }}>Die Rangliste läuft auf eurer Seite.</h2>
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
				<h4>Einstieg</h4>
				<ul>
					<li>Top 10 des Vereins</li>
					<li>Spielerprofile öffentlich</li>
					<li>Hinweis auf PadelIndex</li>
				</ul>
			</div>
			<div class="tier hl" use:reveal={{ delay: 0.06 }}>
				<span class="lvl">Basic</span>
				<h4>Vereinsranking</h4>
				<ul>
					<li>Vollständige Tabelle</li>
					<li>Filter nach Level, Geschlecht, Zeitraum</li>
					<li>Clubfarben und Logo</li>
					<li>Liga-Ergebnisse importieren</li>
				</ul>
			</div>
			<div class="tier" use:reveal={{ delay: 0.12 }}>
				<span class="lvl">Pro</span>
				<h4>Volle Integration</h4>
				<ul>
					<li>Matchfinder nach Level</li>
					<li>Prämienkatalog für Tokens</li>
					<li>Eigene Subdomain</li>
					<li>Hinweis abschaltbar</li>
				</ul>
			</div>
		</div>

		<div class="demo-block" use:reveal>
			<h3>Lust, es auszuprobieren?</h3>
			<p class="muted">Kurz Verein und Kontakt hinterlassen, wir zeigen es euch.</p>
			<ClubDemoForm />
		</div>
	</div>
</section>

<!-- ============================ CTA ============================ -->
<section class="cta" id="anmelden">
	<div class="mullions" aria-hidden="true">
		<i style="left:20%"></i><i style="left:40%"></i><i style="left:60%"></i><i style="left:80%"></i>
	</div>
	<div class="wrap cta-in">
		<span class="eyebrow" use:reveal>Gründungsvereine</span>
		<h2 use:reveal={{ delay: 0.05 }}>Der erste Wert entsteht<br />mit deinem ersten Match.</h2>
		<p class="muted" use:reveal={{ delay: 0.1 }} style="margin-top:22px">
			Wir starten im Oberland. Trag dich ein, dann melden wir uns, sobald dein Club dabei ist — oder
			wir fragen ihn für dich.
		</p>

		<div use:reveal={{ delay: 0.15 }}>
			<SignupForm />
		</div>

		{#if data.board}
			<p class="cta-alt" use:reveal={{ delay: 0.2 }}>
				Du spielst schon beim {data.board.club.name}?
				<a href="/c/stc-oberland/beanspruchen">Profil beanspruchen</a>
				·
				<a href="/c/stc-oberland">Ranking ansehen</a>
			</p>
		{/if}
	</div>
</section>

<footer>
	<div class="wrap foot-in">
		<span>© 2026 PadelIndex</span>
		<div class="foot-links">
			<a href="#rechnen">Rating</a>
			<a href="#vereine">Vereine</a>
			<a href="/anmelden">Anmelden</a>
			<a href="/datenschutz">Datenschutz</a>
			<a href="/impressum">Impressum</a>
		</div>
	</div>
</footer>
