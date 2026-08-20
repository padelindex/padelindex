<script lang="ts">
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const NAV = [
		{ href: '/#problem', label: 'Warum' },
		{ href: '/rating', label: 'Rating' },
		{ href: '/#tokens', label: 'Tokens' },
		{ href: '/vereine', label: 'Für Vereine' }
	];

	const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	const statusLabel: Record<string, string> = { planned: 'geplant', running: 'läuft', completed: 'abgeschlossen' };
</script>

<svelte:head>
	<title>Zyklen — {data.league.name} | PadelIndex</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={NAV} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>Zyklen</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				Jeder Zyklus hat eigene Boxen. Ein neuer Zyklus startet leer — Boxen und Aufstellung legst
				du danach an.
			</p>

			<a class="btn btn-primary" href="/liga/{data.league.slug}/verwaltung/zyklen/neu" use:reveal>
				Neuen Zyklus anlegen
			</a>

			{#if data.cycles.length === 0}
				<p class="muted" style="margin-top: 24px">Noch kein Zyklus angelegt.</p>
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
										<a href="/liga/{data.league.slug}/verwaltung/zyklen/{c.id}">Boxen verwalten →</a>
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
	h1 {
		margin-top: 18px;
	}
	.intro {
		margin-top: 14px;
		margin-bottom: 28px;
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
