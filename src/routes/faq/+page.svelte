<script lang="ts">
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import { jsonLd } from '$lib/jsonld';
	import { MAIN_NAV } from '$lib/landing/nav';

	// Antworten als reiner Text (ohne Markup) für das FAQPage-JSON-LD -
	// die sichtbaren Blöcke unten dürfen Links enthalten, das Schema
	// braucht Klartext.
	const faq: { q: string; a: string }[] = [
		{
			q: 'Was ist PadelIndex?',
			a: 'PadelIndex ist eine unabhängige Rating-Plattform für Padel-Amateure in Deutschland. Dein Level entsteht aus bestätigten Matches — aus Gegnerstärke, Satzverlauf und wie sicher wir dein Level schon kennen —, nicht aus einem Fragebogen.'
		},
		{
			q: 'Für wen ist PadelIndex?',
			a: 'Für alle, die wissen wollen, wie stark sie wirklich spielen. Egal ob du gerade erst anfängst, regelmäßig in deinem Verein spielst oder einen Verein leitest und eine Rangliste auf eurer Website willst.'
		},
		{
			q: 'Wie wird mein Level berechnet?',
			a: 'Aus jedem bestätigten Match: wen du geschlagen hast, wie klar es war, und wie viele Matches wir schon von dir kennen. Der Rating-Simulator unter /rating rechnet mit demselben Code, der auch produktiv läuft.'
		},
		{
			q: 'Kann mein Verein bei PadelIndex mitmachen?',
			a: 'Ja. Wir erfassen Vereine nach und nach — aktuell ist der STC Oberland unser Pilotverein. Wenn dein Verein dabei sein möchte, kannst du unter /vereine eine Demo anfragen.'
		},
		{
			q: 'Wie melde ich falsche Informationen?',
			a: 'Wenn ein Ergebnis falsch zugeordnet ist oder ein Profil nicht dir gehört, schreib uns an kontakt@padelindex.de. Für dein eigenes Profil gibt es außerdem einen Link „Ich möchte hier nicht gelistet sein“ direkt auf der Profilseite, der ohne Login funktioniert.'
		},
		{
			q: 'Ist PadelIndex kostenlos?',
			a: 'Für Spieler ja, immer. Für Vereine gibt es eine kostenlose Stufe sowie zwei bezahlte Pakete mit mehr Funktionen — Details unter /vereine.'
		},
		{
			q: 'Wer steckt hinter PadelIndex?',
			a: 'PadelIndex wird von Alec Hahn entwickelt, Teil des Familienunternehmens Sportcenter Hahn GmbH, das seit vielen Jahren im Bereich Sportanlagen und Sportbetrieb tätig ist. Mehr dazu unter /ueber.'
		},
		{
			q: 'Ist PadelIndex mit einem Padelverband verbunden?',
			a: 'Nein. PadelIndex ist eine unabhängige Plattform, nicht an einen Verband oder eine Liga gebunden.'
		},
		{
			q: 'Kann ich meinen Verein selbst verwalten?',
			a: 'Ja — als Vereins-Admin kannst du schon heute Mitglieder verwalten, Profil-Beanspruchungen freigeben und einen Prämienkatalog einrichten, direkt im eigenen Vereinsbereich.'
		},
		{
			q: 'Warum gibt es PadelIndex?',
			a: 'Level werden meistens geschätzt oder in einem Fragebogen angeklickt — und gelten dann nur in einem Verein oder einer App. PadelIndex rechnet stattdessen aus echten, bestätigten Ergebnissen, vereinsübergreifend.'
		},
		{
			q: 'Wie aktuell sind die Daten?',
			a: 'Dein Level aktualisiert sich mit jedem bestätigten Match. Wo eine Rangliste noch auf importierten Liga-Ergebnissen beruht, zeigen wir das offen mit einem Hinweis an, statt ein Datum vorzutäuschen, das Aktualität suggeriert.'
		},
		{
			q: 'Wie kann ich PadelIndex unterstützen?',
			a: 'Am einfachsten: spiel, melde deine Matches, gib uns Feedback. Je mehr bestätigte Ergebnisse zusammenkommen, desto genauer wird das Rating für alle.'
		},
		{
			q: 'Wie kann ich Kontakt aufnehmen?',
			a: 'Per E-Mail an kontakt@padelindex.de — wir freuen uns über jedes Feedback, das dabei hilft, PadelIndex besser zu machen.'
		}
	];

	const faqSchema = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a }
		}))
	});
</script>

<svelte:head>
	<title>Häufige Fragen zu PadelIndex — FAQ</title>
	<meta
		name="description"
		content="Antworten zu PadelIndex: wie das Level berechnet wird, wie Vereine mitmachen können, was es kostet und wer dahintersteht."
	/>
	<link rel="canonical" href="https://padelindex.de/faq" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/faq" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="Häufige Fragen zu PadelIndex" />
	<meta
		property="og:description"
		content="Wie das Level berechnet wird, wie Vereine mitmachen können, was es kostet und wer dahintersteht."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
	{@html `<script type="application/ld+json">${faqSchema}</script>`}
</svelte:head>

<LandingNav links={MAIN_NAV} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 68ch">
			<span class="eyebrow" use:reveal>FAQ</span>
			<h1 use:reveal={{ delay: 0.05 }}>Häufige Fragen</h1>
			<p class="muted faq-intro" use:reveal={{ delay: 0.1 }}>
				Antworten zu Level, Vereinen und allem drumherum. Fehlt etwas?
				<a href="mailto:kontakt@padelindex.de">Schreib uns</a>.
			</p>

			<div class="faq-list">
				{#each faq as item, i (item.q)}
					<details class="faq-item" use:reveal={{ delay: Math.min(i, 6) * 0.03 }}>
						<summary>{item.q}</summary>
						<p>{item.a}</p>
					</details>
				{/each}
			</div>
		</div>
	</section>
</main>

<LandingFooter />

<style>
	h1 {
		margin-top: 18px;
	}
	.faq-intro {
		margin-top: 14px;
		margin-bottom: 40px;
	}
	.faq-intro a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.faq-item {
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		padding: 18px 0;
	}
	.faq-item:last-child {
		border-bottom: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.faq-item summary {
		cursor: pointer;
		font-size: 17px;
		font-weight: 600;
		list-style: none;
	}
	.faq-item summary::-webkit-details-marker {
		display: none;
	}
	.faq-item summary::before {
		content: '+';
		display: inline-block;
		width: 1.2em;
		color: var(--court-deep, #0f6e5c);
		font-weight: 700;
	}
	.faq-item[open] summary::before {
		content: '−';
	}
	.faq-item p {
		margin: 12px 0 0 1.2em;
		font-size: 15px;
		line-height: 1.65;
		color: var(--muted-light);
	}
</style>
