<script lang="ts">
	import { enhance } from '$app/forms';
	import RouletteWheel from '$lib/components/RouletteWheel.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busySlotId = $state<string | null>(null);
	let selectedId = $state<string | null>(null);

	const now = new Date();

	function formatShort(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
	}

	function formatFull(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const openSlots = $derived(data.slots.filter((s) => s.signups.length < 4));
	const wheelSlots = $derived(openSlots.map((s) => ({ id: s.id, label: formatShort(s.startsAt) })));

	function iAmIn(slot: PageData['slots'][number]): boolean {
		return slot.signups.some((s) => s.playerId === data.me);
	}

	function hasStarted(iso: string): boolean {
		return new Date(iso).getTime() <= now.getTime();
	}

	$effect(() => {
		if (!selectedId) return;
		document.getElementById(`slot-${selectedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	});
</script>

<svelte:head>
	<title>Padel Roulette — {data.club.name} — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		<a class="btn btn-ghost" href="/konto">Mein Konto</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 680px">
		<div class="sec-head">
			<span class="eyebrow">{data.club.name}</span>
			<h2>Padel Roulette</h2>
			<p class="muted">
				Der Verein legt Termine an, du sagst zu — bei vier Zusagen findet das Match statt. Keine
				Koordination, kein Aufwand.
			</p>
		</div>

		{#if form?.message}
			<p class="err" role="alert">{form.message}</p>
		{/if}

		<RouletteWheel slots={wheelSlots} bind:selectedId />

		{#if data.slots.length === 0}
			<div class="card empty-card">
				<h3 class="card-title">Zurzeit keine Termine</h3>
				<p class="muted" style="font-size: 14px">
					Der Verein hat aktuell kein Padel Roulette angesetzt. Schau später nochmal vorbei.
				</p>
			</div>
		{:else}
			<ul class="slots">
				{#each data.slots as s (s.id)}
					{@const full = s.signups.length >= 4}
					{@const started = hasStarted(s.startsAt)}
					<li class="card slot" id="slot-{s.id}" class:highlight={selectedId === s.id}>
						<div class="slot-head">
							<div>
								<span class="slot-date">{formatFull(s.startsAt)}</span>
								{#if s.court}<span class="slot-meta"> · {s.court}</span>{/if}
							</div>
							<span class="slot-count" class:full>{s.signups.length} / 4</span>
						</div>

						{#if s.info}
							<p class="slot-info">{s.info}</p>
						{/if}

						{#if s.signups.length > 0}
							<ul class="players">
								{#each s.signups as p (p.playerId)}
									<li><a href="/p/{p.handle}">{p.name}</a></li>
								{/each}
							</ul>
						{/if}

						<div class="slot-actions">
							{#if full}
								{#if started}
									<a class="btn btn-primary" href="/c/{data.club.slug}/match/neu?datum={s.startsAt.slice(0, 10)}">
										Ergebnis melden
									</a>
								{:else}
									<span class="status-full">Voll — findet statt</span>
								{/if}
							{:else if iAmIn(s)}
								<form
									method="POST"
									action="?/leave"
									use:enhance={() => {
										busySlotId = s.id;
										return async ({ update }) => {
											await update();
											busySlotId = null;
										};
									}}
								>
									<input type="hidden" name="slotId" value={s.id} />
									<button class="btn btn-ghost-light" type="submit" disabled={busySlotId === s.id}>
										Zusage zurückziehen
									</button>
								</form>
							{:else if !started}
								<form
									method="POST"
									action="?/join"
									use:enhance={() => {
										busySlotId = s.id;
										return async ({ update }) => {
											await update();
											busySlotId = null;
										};
									}}
								>
									<input type="hidden" name="slotId" value={s.id} />
									<button class="btn btn-primary" type="submit" disabled={busySlotId === s.id}>
										{busySlotId === s.id ? 'Wird gespeichert…' : 'Ich bin dabei'}
									</button>
								</form>
							{:else}
								<span class="status-full">Termin vorbei</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.card {
		margin-top: 20px;
		padding: 20px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
		margin: 0 0 12px;
	}

	.empty-card {
		text-align: left;
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.slots {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.slot.highlight {
		border-color: var(--court-deep, #0f6e5c);
		box-shadow: 0 0 0 2px rgba(15, 110, 92, 0.25);
	}

	.slot-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	.slot-date {
		font-size: 15px;
		font-weight: 600;
		color: var(--ink);
	}

	.slot-meta {
		font-size: 13px;
		color: var(--muted-light);
	}

	.slot-count {
		flex-shrink: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--muted-light);
		white-space: nowrap;
	}

	.slot-count.full {
		color: var(--court-deep, #0f6e5c);
	}

	.slot-info {
		margin: 10px 0 0;
		font-size: 13.5px;
		color: var(--muted-light);
	}

	.players {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 14px 0 0;
		padding: 0;
	}

	.players a {
		display: inline-block;
		font-size: 12.5px;
		padding: 4px 10px;
		border-radius: 100px;
		background: rgba(15, 110, 92, 0.08);
		color: var(--court-deep, #0f6e5c);
		text-decoration: none;
	}

	.slot-actions {
		margin-top: 16px;
	}

	.status-full {
		font-size: 13.5px;
		color: var(--muted-light);
	}
</style>
