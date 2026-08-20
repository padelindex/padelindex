<script lang="ts">
	// ============================================================
	// PadelIndex — /rating
	// ============================================================
	// Bis Block 4 des Website-Audits waren Simulator, Sicherheit,
	// Verlauf und Vergleich Anker-Abschnitte auf der Startseite — Google
	// konnte sie nicht getrennt von "PadelIndex — Dein Level" ranken.
	// Der komplette Inhalt ist hierher VERSCHOBEN, nicht kopiert: auf der
	// Startseite steht dafür nur noch ein kurzer Teaser mit Link hierher.

	import { reveal } from '$lib/landing/reveal';
	import MatchLab from '$lib/components/landing/MatchLab.svelte';
	import ConfidenceCurve from '$lib/components/landing/ConfidenceCurve.svelte';
	import RatingJourney from '$lib/components/landing/RatingJourney.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';

	const NAV = [
		{ href: '/#problem', label: 'Warum' },
		{ href: '/rating', label: 'Rating' },
		{ href: '/#tokens', label: 'Tokens' },
		{ href: '/vereine', label: 'Für Vereine' }
	];
</script>

<svelte:head>
	<title>Wie das PadelIndex-Rating rechnet — Level aus bestätigten Matches</title>
	<meta
		name="description"
		content="Kein Fragebogen, keine Selbsteinschätzung: PadelIndex berechnet dein Padel-Level aus Gegnerstärke, Satzverlauf und Sicherheit — mit demselben Modell, das produktiv jedes Match bewertet. Probier den Rating-Simulator aus."
	/>
	<link rel="canonical" href="https://padelindex.de/rating" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/rating" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="Wie das PadelIndex-Rating rechnet" />
	<meta
		property="og:description"
		content="Level aus bestätigten Matches statt Selbsteinschätzung: Gegnerstärke, Satzverlauf und Sicherheit, nachvollziehbar erklärt."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={NAV} />

<main>
	<!-- ============================ INTRO ============================ -->
	<section class="sec" id="top" style="background:var(--night-2)">
		<div class="wrap">
			<div class="sec-head">
				<span class="eyebrow" use:reveal>Rating</span>
				<h1 use:reveal={{ delay: 0.05 }}>Ein Match verändert dein Level.</h1>
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
					<h2>Wen du geschlagen hast</h2>
					<p>
						Ein Sieg gegen ein stärkeres Duo sagt mehr aus als einer gegen ein schwächeres.
						Überraschungen enthalten die meiste Information, also wiegen sie am schwersten.
					</p>
				</article>
				<article class="factor" use:reveal={{ delay: 0.07 }}>
					<span class="k">02 — Deutlichkeit</span>
					<h2>Wie klar es war</h2>
					<p>
						6:0, 6:0 ist eine andere Aussage als 7:6, 5:7, 7:5. Der Satzverlauf geht in jede Rechnung
						ein — eine knappe Niederlage gegen starke Gegner kostet dich kaum etwas.
					</p>
				</article>
				<article class="factor" use:reveal={{ delay: 0.14 }}>
					<span class="k">03 — Sicherheit</span>
					<h2>Wie gut wir dich kennen</h2>
					<p>
						Am Anfang schwankt dein Wert stark, das ist Absicht: nach etwa zehn bis fünfzehn Matches
						steht dein Bereich. Danach wird nur noch feinjustiert.
					</p>
				</article>
			</div>

			<p class="rechnen-cta" use:reveal={{ delay: 0.18 }}>
				Das war nur die Simulation — für dein echtes Level braucht es ein echtes Match.
				<a href="/#anmelden">Platz sichern →</a>
			</p>
		</div>
	</section>

	<!-- ============================ SICHERHEIT ============================ -->
	<section class="sec sec-light" id="sicherheit">
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
	<section class="sec" id="verlauf">
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
