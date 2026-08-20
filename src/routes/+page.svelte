<script lang="ts">
	import { reveal } from '$lib/landing/reveal';
	import HeroSequence from '$lib/components/landing/HeroSequence.svelte';
	import PartnerProblem from '$lib/components/landing/PartnerProblem.svelte';
	import TokenFlow from '$lib/components/landing/TokenFlow.svelte';
	import SignupForm from '$lib/components/landing/SignupForm.svelte';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const NAV = [
		{ href: '#problem', label: 'Warum' },
		{ href: '/rating', label: 'Rating' },
		{ href: '#tokens', label: 'Tokens' },
		{ href: '/vereine', label: 'Für Vereine' }
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
<LandingNav links={NAV} brandHref="#top" />

<main>
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
				<a class="btn btn-ghost" href="/rating">Erst mal ausprobieren</a>
			</div>
			<p class="hero-note" use:reveal={{ delay: 0.24 }}>
				Pilotverein: STC Oberland
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

<!-- ============================ RATING TEASER ============================ -->
<section class="sec sec-light" id="rechnen">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>So rechnet es</span>
			<h2 use:reveal={{ delay: 0.05 }}>Ein Match verändert dein Level.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Kein Fragebogen, kein geschätzter Wert: PadelIndex rechnet aus Gegnerstärke, Satzverlauf und
				Bestätigung durch das Gegnerteam — mit demselben Code, der auch produktiv die Ratings vergibt.
				Im Rating-Simulator kannst du selbst dran drehen.
			</p>
			<a class="btn btn-primary" href="/rating" use:reveal={{ delay: 0.15 }} style="margin-top:28px; display:inline-flex">
				Rechenweg &amp; Simulator ansehen
			</a>
		</div>
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

<!-- ============================ VEREINE TEASER ============================ -->
<section class="sec sec-light" id="vereine">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Für Vereine</span>
			<h2 use:reveal={{ delay: 0.05 }}>Die Rangliste läuft auf eurer Seite.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Ab hier geht es nicht mehr um dein eigenes Level, sondern um deinen Verein — falls du gerade
				nur als Spieler:in hier bist, ist <a href="#anmelden">der Platz auf der Warteliste</a> weiter
				oben schon alles, was du brauchst. Für Vereine: eine Zeile Code, und das Ranking steht auf
				eurer Website, in euren Farben, ohne Plugin-Chaos.
			</p>
			<a class="btn btn-primary" href="/vereine" use:reveal={{ delay: 0.15 }} style="margin-top:28px; display:inline-flex">
				Für Vereine ansehen
			</a>
		</div>
	</div>
</section>

<!-- ============================ LIGA TEASER ============================ -->
<!-- Bewusst als konkretes Beispiel, nicht als "PadelIndex bietet jetzt
     Liga-Hosting als Produkt für jeden Verein" — das Box-Ligen-Format ist
     technisch generisch gebaut, aber aktuell gibt es genau eine Liga bei
     einem Verein. Ehrlich als Pilot framen statt Verfügbarkeit zu
     behaupten, die es noch nicht gibt. -->
<section class="sec" id="liga">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Liga</span>
			<h2 use:reveal={{ delay: 0.05 }}>Auch echte Vereinsligen laufen auf PadelIndex.</h2>
			<p class="muted" use:reveal={{ delay: 0.1 }}>
				Die BÁVARO PADEL LEAGUE beim STC Oberland spielt in 4er-Boxen mit rotierenden
				Doppelpartnern, eigener Box-Tabelle und Auf-/Abstieg — als eigenständiges Ranking neben dem
				allgemeinen PadelIndex-Level. Ergebnisse fließen zusätzlich ins Index-Rating ein.
			</p>
			<a class="btn btn-primary" href="/liga/bavaro" use:reveal={{ delay: 0.15 }} style="margin-top:28px; display:inline-flex">
				Liga-Tabelle ansehen
			</a>
		</div>
	</div>
</section>

<!-- ============================ CTA ============================ -->
<section class="cta" id="anmelden">
	<div class="mullions" aria-hidden="true">
		<i style="left:20%"></i><i style="left:40%"></i><i style="left:60%"></i><i style="left:80%"></i>
	</div>
	<div class="wrap cta-in">
		<span class="eyebrow" use:reveal>Pilotphase</span>
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
</main>

<LandingFooter />
