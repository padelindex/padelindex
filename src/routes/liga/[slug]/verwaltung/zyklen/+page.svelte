<script lang="ts">
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data }: { data: PageData } = $props();

	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
	const statusLabel: Record<string, string> = {
		planned: 'geplant',
		running: 'läuft',
		completed: 'abgeschlossen'
	};
	const seasonStatusLabel: Record<string, string> = {
		draft: 'Entwurf',
		active: 'aktiv',
		archived: 'archiviert'
	};

	function selectSeason(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		const url = new URL(window.location.href);
		url.searchParams.set('season', value);
		window.location.href = url.toString();
	}
</script>

<svelte:head>
	<title>Zyklen — {data.league.name} | PadelIndex</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Zyklen</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Jeder Zyklus hat eigene Boxen. Ein neuer Zyklus startet leer — Boxen und Aufstellung legst
				du danach an.
			</p>

			<div class="toolbar" use:reveal>
				<div class="season-switch">
					<label class="sr-only" for="season-select">Saison</label>
					<select id="season-select" value={data.selectedSeasonId} onchange={selectSeason}>
						<option value="all">Alle Saisons</option>
						{#each data.seasons as s (s.id)}
							<option value={s.id}>
								{s.name} ({seasonStatusLabel[s.status]})
							</option>
						{/each}
					</select>
				</div>
				<a class="btn btn-ghost-light" href="/liga/{data.league.slug}/verwaltung/saisons/neu">
					Neue Saison starten
				</a>
				<a class="btn btn-primary" href="/liga/{data.league.slug}/verwaltung/zyklen/neu">
					Neuen Zyklus anlegen
				</a>
			</div>

			{#if data.cycles.length === 0}
				<p class="muted" style="margin-top: 24px">Keine Zyklen für diese Auswahl.</p>
			{:else}
				<div class="tablewrap" use:reveal>
					<table>
						<thead>
							<tr>
								<th scope="col">Saison</th>
								<th scope="col" class="c-num">Zyklus</th>
								<th scope="col">Zeitraum</th>
								<th scope="col">Status</th>
								<th scope="col" class="c-num">Boxen</th>
								<th scope="col"></th>
							</tr>
						</thead>
						<tbody>
							{#each data.cycles as c (c.id)}
								<tr>
									<td>{c.seasonName}</td>
									<td class="c-num num">{c.ordinal}</td>
									<td class="num">
										{dateFmt.format(new Date(c.startDate))} – {dateFmt.format(new Date(c.endDate))}
									</td>
									<td>
										<span class="pill" class:pill-done={c.status === 'completed'}>
											{statusLabel[c.status]}
										</span>
									</td>
									<td class="c-num num">{c.boxCount}</td>
									<td>
										<a href="/liga/{data.league.slug}/verwaltung/zyklen/{c.id}">Boxen verwalten →</a
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<p class="back"><a href="/liga/{data.league.slug}/verwaltung">← Zur Verwaltung</a></p>
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
	.intro {
		margin-top: 14px;
		margin-bottom: 20px;
	}
	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 8px;
	}
	.season-switch select {
		padding: 9px 12px;
		border: 1px solid var(--line-light);
		border-radius: 100px;
		font-size: 13px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
	}
	.tablewrap {
		margin-top: 28px;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		min-width: 40rem;
	}
	th {
		text-align: left;
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted-light);
		font-weight: 500;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--line-light);
	}
	td {
		padding: 10px 10px 10px 0;
		border-bottom: 1px solid var(--line-light);
	}
	.c-num {
		text-align: right;
		width: 4.5em;
	}
	td a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
	}
	.pill {
		display: inline-block;
		padding: 2px 9px;
		border-radius: 100px;
		font-family: var(--mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(22, 163, 148, 0.16);
		color: var(--court-deep, #0f6e5c);
	}
	.pill-done {
		background: rgba(0, 0, 0, 0.07);
		color: var(--muted-light);
	}
	.back {
		margin-top: 32px;
		font-size: 14px;
	}
	.back a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
</style>
