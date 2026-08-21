<script lang="ts">
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import { MAIN_NAV } from '$lib/landing/nav';
</script>

<svelte:head>
	<title>Über PadelIndex — wer dahintersteht</title>
	<meta
		name="description"
		content="PadelIndex ist ein Projekt von Alec Hahn (Sportcenter Hahn GmbH) — ein Rating für Padel-Amateure aus bestätigten Matches, kein Fragebogen und kein Vereinsverzeichnis."
	/>
	<link rel="canonical" href="https://padelindex.de/ueber" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/ueber" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="Über PadelIndex" />
	<meta
		property="og:description"
		content="Ein Rating für Padel-Amateure aus bestätigten Matches — wer hinter PadelIndex steht und warum es das gibt."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={MAIN_NAV} />

<main>
	<section class="sec" id="top" style="background:var(--night-2)">
		<div class="wrap legal-wide">
			<span class="eyebrow" use:reveal>Über PadelIndex</span>
			<h1 use:reveal={{ delay: 0.05 }}>Orientierung für die wachsende Padel-Community.</h1>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				PadelIndex ist eine Plattform für alle, die Padel in Deutschland spielen und wissen wollen,
				wie stark sie wirklich sind.
			</p>
			<p class="muted" use:reveal={{ delay: 0.14 }}>
				Unser Ziel ist einfach: ein Level, das aus echten, bestätigten Matches entsteht — nicht aus
				einer Selbsteinschätzung oder einer Zahl, die sich nie bewegt. Von deinem eigenen Rating
				über die Rangliste deines Vereins bis zur Frage, wie du gegen ein bestimmtes Team wirklich
				stehst — PadelIndex soll die Anlaufstelle für dein Level im deutschen Padel werden.
			</p>
		</div>
	</section>

	<section class="sec sec-light">
		<div class="wrap legal-wide">
			<h2 use:reveal>Aus der Praxis für die Praxis</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }}>
				Hinter PadelIndex steht Alec Hahn, Entwickler und Teil des Familienunternehmens Sportcenter
				Hahn GmbH.
			</p>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Die Familie Hahn beschäftigt sich seit Jahrzehnten mit dem Betrieb und der Entwicklung von
				Sportanlagen. Das Sportcenter Hahn verbindet Sport, Vereinsleben und professionelle
				Sportinfrastruktur und bietet damit einen direkten Einblick in die Bedürfnisse von Spielern
				und Vereinen.
			</p>
			<p class="muted" use:reveal={{ delay: 0.15 }}>
				Padel ist dabei für uns mehr als nur ein weiterer Trendsport. Die Dynamik, die Community und
				das schnelle Wachstum des Sports in Deutschland bieten enormes Potenzial — aber auch die
				Frage, wie man das eigene Level über Vereinsgrenzen hinweg überhaupt vergleichen kann. Mit
				PadelIndex möchten wir genau das lösen: ein Rating, das nachvollziehbar ist und mit jedem
				Match mitwächst.
			</p>
		</div>
	</section>

	<section class="sec">
		<div class="wrap legal-wide">
			<h2 use:reveal>Unser Anspruch</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }}>
				Wir möchten kein kompliziertes Rating-System schaffen, sondern eines, dem man vertraut.
			</p>
			<p class="claim-line" use:reveal={{ delay: 0.08 }}>
				Spielen. Bestätigen. Wissen, wo du stehst.
			</p>
			<ul class="values" use:reveal={{ delay: 0.12 }}>
				<li>
					<b>Nachvollziehbarkeit</b> — jede Änderung deines Levels ist erklärt, keine Blackbox.
				</li>
				<li><b>Bestätigung</b> — ein Ergebnis zählt erst, wenn das Gegnerteam zustimmt.</li>
				<li><b>Transparenz</b> — derselbe Code im Rating-Simulator wie im echten Betrieb.</li>
				<li><b>Community</b> — ein Rating lebt von Spielern und Vereinen, die mitmachen.</li>
				<li><b>Wachstum</b> — wir wachsen mit jedem Verein, der dazukommt.</li>
			</ul>
		</div>
	</section>

	<section class="sec sec-light">
		<div class="wrap legal-wide">
			<h2 use:reveal>Gemeinsam für Padel</h2>
			<p class="muted" use:reveal={{ delay: 0.05 }}>
				Padel wächst in Deutschland rasant. Gleichzeitig hat kaum ein Verein eine verlässliche
				Möglichkeit, das Level seiner Mitglieder über die eigene Anlage hinaus einzuordnen. Genau
				hier setzt PadelIndex an.
			</p>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Wir starten mit einem Pilotverein im Oberland (STC Oberland) und wollen von dort aus wachsen
				— Verein für Verein, Match für Match.
			</p>
			<p class="muted" use:reveal={{ delay: 0.14 }}>
				Wenn du einen Verein vertrittst, der mitmachen möchte, einen Fehler in deinem Profil findest
				oder eine Idee für die Plattform hast, freuen wir uns über dein Feedback an
				<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>.
			</p>
			<p class="claim-line" use:reveal={{ delay: 0.18 }}>
				Padel wächst. Wir machen dein Level sichtbar.
			</p>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	.legal-wide {
		max-width: 68ch;
	}
	.legal-wide h1 {
		margin-top: 18px;
	}
	.legal-wide h2 {
		font-size: clamp(26px, 3.4vw, 38px);
		margin-bottom: 18px;
	}
	.legal-wide .muted {
		margin-top: 14px;
		font-size: 15px;
		line-height: 1.65;
	}
	.legal-wide .muted:first-of-type {
		margin-top: 0;
	}
	.claim-line {
		margin-top: 22px;
		font-family: var(--mono);
		font-size: 13px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--court-deep, #0f6e5c);
	}
	.sec:not(.sec-light) .claim-line {
		color: var(--court);
	}
	.values {
		margin: 22px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 15px;
		color: var(--muted-light);
	}
	.sec:not(.sec-light) .values {
		color: var(--muted-dark);
	}
	.values b {
		color: var(--ink);
	}
	.sec:not(.sec-light) .values b {
		color: var(--chalk);
	}
</style>
