<script lang="ts">
	// ============================================================
	// PadelIndex — /level-schaetzen (Website-Audit Block 6)
	// ============================================================
	// Für alle ohne (oder mit noch zu wenigen) bestätigten Matches: sechs
	// Fragen, rein client-seitig ausgewertet mit estimateLevel() aus
	// $lib/level-estimator. Wichtig — das hier ist KEIN Ersatz fürs echte
	// Rating-Modell (siehe Kommentar dort): nur ein Vorschlag für das
	// Feld "Selbsteinschätzung" in /konto. Das tatsächliche Level bleibt
	// allein Sache bestätigter Matches.
	//
	// Ergebnis landet als ?level=X in der URL, damit ein Ergebnis-Link
	// teilbar ist (siehe level-schaetzen/og/+server.ts fürs Vorschaubild).
	// Wer über so einen Link kommt, sieht direkt das Ergebnis, nicht den
	// Fragebogen von vorn.

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import { mainNav, ctaHref } from '$lib/landing/nav';
	import {
		LEVEL_QUESTIONS,
		estimateLevel,
		formatLevelParam,
		levelBand,
		parseLevelParam
	} from '$lib/level-estimator';

	const cta = $derived(ctaHref(page.data.loggedIn));

	let sharedLevel = $derived(parseLevelParam(page.url.searchParams.get('level')));
	let ownResult = $state<number | null>(null);
	let result = $derived(ownResult ?? sharedLevel);
	let band = $derived(result === null ? null : levelBand(result));

	let formEl = $state<HTMLFormElement>();
	let incomplete = $state(false);
	let copyState = $state<'idle' | 'copied'>('idle');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!formEl) return;
		const data = new FormData(formEl);
		const answers: Record<string, number> = {};
		for (const q of LEVEL_QUESTIONS) {
			const raw = data.get(q.id);
			if (raw === null) {
				incomplete = true;
				formEl.querySelector(`fieldset[data-q="${q.id}"]`)?.scrollIntoView({ block: 'center' });
				return;
			}
			answers[q.id] = Number(raw);
		}
		incomplete = false;
		const level = estimateLevel(answers);
		ownResult = level;
		goto(`?level=${formatLevelParam(level)}`, {
			noScroll: true,
			keepFocus: true,
			replaceState: false
		});
	}

	function restart() {
		ownResult = null;
		goto('/level-schaetzen', { noScroll: true });
	}

	async function share() {
		const shareUrl = page.url.href;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'Mein PadelIndex Level-Check', url: shareUrl });
				return;
			} catch {
				// Abgebrochen oder nicht unterstützt -> Fallback unten.
			}
		}
		await navigator.clipboard.writeText(shareUrl);
		copyState = 'copied';
		setTimeout(() => (copyState = 'idle'), 2000);
	}

	// Relativer Pfad fürs <img> auf der Seite (funktioniert auf jeder Umgebung,
	// auch lokal); og:image braucht laut Open-Graph-Spec eine absolute URL.
	const ogImagePath = $derived(
		result === null ? null : `/level-schaetzen/og?level=${formatLevelParam(result)}`
	);
	const ogImage = $derived(ogImagePath === null ? null : `https://padelindex.de${ogImagePath}`);
</script>

<svelte:head>
	<title
		>{result === null
			? 'Level-Schätzer — wie stark spielst du wirklich?'
			: `Geschätztes Level: ${result.toFixed(1)} von 7 — PadelIndex`}</title
	>
	<meta
		name="description"
		content="Sechs kurze Fragen, ein grober Anhaltspunkt für dein Padel-Level — ohne Anmeldung. Dein echtes Level entsteht später aus bestätigten Matches."
	/>
	<link rel="canonical" href="https://padelindex.de/level-schaetzen" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://padelindex.de/level-schaetzen" />
	<meta property="og:site_name" content="PadelIndex" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:title" content="PadelIndex Level-Schätzer" />
	<meta
		property="og:description"
		content="Sechs kurze Fragen, ein grober Anhaltspunkt für dein Padel-Level."
	/>
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 68ch">
			<span class="eyebrow" use:reveal>Level-Schätzer</span>
			<h1 use:reveal={{ delay: 0.05 }}>Wie stark spielst du wirklich?</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Sechs kurze Fragen, ohne Anmeldung. Das Ergebnis ist eine grobe Einordnung, kein echtes
				Rating — das entsteht erst aus bestätigten Matches. Als Vorschlag für deine
				Selbsteinschätzung kannst du es trotzdem gebrauchen.
			</p>

			{#if result !== null && band}
				<div class="result" use:reveal>
					<span class="eyebrow">Ergebnis</span>
					<p class="result-level">
						<span class="num">{result.toFixed(1)}</span><span class="of7">von 7</span>
					</p>
					<h2>{band.label}</h2>
					<p class="muted">{band.description}</p>
					<p class="disclaimer">
						Eigene Einschätzung, kein bestätigtes Rating. Dein echtes Level entsteht aus bestätigten
						Matches auf PadelIndex.
					</p>

					<img
						class="og-preview"
						src={ogImagePath}
						loading="lazy"
						alt="Vorschau des teilbaren Ergebnisbilds: {band.label}, Level {result.toFixed(
							1
						)} von 7"
						width="600"
						height="315"
					/>

					<div class="result-actions">
						<a class="btn btn-primary" href={cta}>Jetzt registrieren</a>
						<button class="btn btn-ghost-light" type="button" onclick={share}>
							{copyState === 'copied' ? 'Link kopiert' : 'Ergebnis teilen'}
						</button>
						<button class="btn btn-ghost-light" type="button" onclick={restart}>
							Test noch mal machen
						</button>
					</div>
				</div>
			{:else}
				<form bind:this={formEl} onsubmit={handleSubmit} novalidate use:reveal>
					{#each LEVEL_QUESTIONS as q (q.id)}
						<fieldset data-q={q.id}>
							<legend>{q.question}</legend>
							<div class="options">
								{#each q.options as opt, i (opt.label)}
									<label class="option">
										<input type="radio" name={q.id} value={opt.points} required />
										<span>{opt.label}</span>
									</label>
								{/each}
							</div>
						</fieldset>
					{/each}

					{#if incomplete}
						<p class="warn" role="alert">Bitte beantworte noch die markierte Frage.</p>
					{/if}

					<button class="btn btn-primary submit" type="submit">Level berechnen</button>
				</form>
			{/if}
		</div>
	</section>
</main>

<LandingFooter />

<style>
	h1 {
		margin-top: 18px;
	}
	.intro {
		margin-top: 14px;
		margin-bottom: 40px;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0 0 32px;
	}
	legend {
		font-family: var(--display);
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 14px;
		padding: 0;
		color: var(--ink);
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 12px;
		border: 1px solid var(--line-light);
		cursor: pointer;
		font-size: 15px;
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.option:has(input:checked) {
		border-color: var(--court-deep, #0f6e5c);
		background: rgba(15, 110, 92, 0.06);
	}
	.option:has(input:focus-visible) {
		outline: 2px solid var(--court);
		outline-offset: 2px;
	}
	.option input {
		accent-color: var(--court-deep, #0f6e5c);
		width: 17px;
		height: 17px;
		flex-shrink: 0;
	}

	.warn {
		color: #b3411f;
		font-size: 14px;
		margin-bottom: 16px;
	}
	.submit {
		margin-top: 8px;
	}

	.result {
		margin-top: 8px;
		padding: 32px;
		border-radius: 20px;
		background: rgba(15, 110, 92, 0.06);
		border: 1px solid var(--line-light);
	}
	.result h2 {
		font-size: clamp(24px, 3vw, 32px);
		margin-top: 4px;
	}
	.result .muted {
		margin-top: 8px;
	}
	.result-level {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin: 10px 0 2px;
	}
	.result-level .num {
		font-family: var(--display);
		font-size: 64px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.result-level .of7 {
		font-size: 16px;
		color: var(--muted-light);
	}
	.disclaimer {
		margin-top: 16px;
		font-size: 13px;
		color: var(--muted-light);
	}
	.og-preview {
		margin-top: 24px;
		width: 100%;
		max-width: 600px;
		height: auto;
		border-radius: 12px;
		border: 1px solid var(--line-light);
	}
	.result-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 24px;
	}
</style>
