<script lang="ts">
	// Boxen und Aufstellung für einen Zyklus anlegen. Die drei Runden je
	// Box entstehen serverseitig automatisch beim Anlegen (siehe
	// league-admin.ts createBox) — hier gibt es dafür kein eigenes Formular.
	//
	// Drag & Drop (svelte-dnd-action) ergänzt die Formulare unten, ersetzt
	// sie aber nicht — wer lieber mit Dropdowns arbeitet, kann das
	// weiterhin. Die Zonen (eine je Box + der Pool der noch nicht
	// zugeteilten Vereinsmitglieder) halten dafür einen eigenen,
	// ziehbaren $state, der sich nach jeder erfolgreichen Aktion aus den
	// echten Serverdaten neu aufbaut (siehe $effect unten) — die einzige
	// Quelle der Wahrheit bleibt data.boxes/data.availableRoster.

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state<string | null>(null);
	let addMemberBoxId = $state<string | null>(null);
	let dndError = $state<string | null>(null);
	let dndBusy = $state(false);

	function openSeats(box: PageData['boxes'][number]): number[] {
		const taken = new Set(box.lineup.map((p) => p.seat));
		return Array.from({ length: data.boxSize }, (_, i) => i + 1).filter((s) => !taken.has(s));
	}

	// ------------------------------------------------------------
	// Drag & Drop
	// ------------------------------------------------------------

	type SeatCard = { id: string; playerId: string; name: string; role: 'regular' | 'substitute' };

	/** Pseudo-Zonen-ID für den Pool nicht zugeteilter Spieler (kein echtes Box-UUID). */
	const POOL = '__pool__';

	function boxCards(box: PageData['boxes'][number]): SeatCard[] {
		return box.lineup
			.slice()
			.sort((a, b) => a.seat - b.seat)
			.map((p) => ({ id: p.playerId, playerId: p.playerId, name: p.name, role: p.role }));
	}

	function poolCards(): SeatCard[] {
		return data.availableRoster.map((p) => ({
			id: p.id,
			playerId: p.id,
			name: p.name,
			role: 'regular' as const
		}));
	}

	let zoneItems = $state<Record<string, SeatCard[]>>({});

	$effect(() => {
		const next: Record<string, SeatCard[]> = { [POOL]: poolCards() };
		for (const box of data.boxes) next[box.id] = boxCards(box);
		zoneItems = next;
	});

	/** "Wo sitzt Spieler X gerade?" laut zuletzt bestätigten Serverdaten (nicht dem Drag-Zwischenstand). */
	const location = $derived.by(() => {
		const map = new Map<string, { zone: string; seat: number; role: 'regular' | 'substitute' }>();
		for (const box of data.boxes) {
			for (const p of box.lineup) map.set(p.playerId, { zone: box.id, seat: p.seat, role: p.role });
		}
		for (const p of data.availableRoster) map.set(p.id, { zone: POOL, seat: 0, role: 'regular' });
		return map;
	});

	function freeSeat(boxId: string, excludingPlayerId: string): number | null {
		const taken = new Set(
			(data.boxes.find((b) => b.id === boxId)?.lineup ?? [])
				.filter((p) => p.playerId !== excludingPlayerId)
				.map((p) => p.seat)
		);
		for (let s = 1; s <= data.boxSize; s++) if (!taken.has(s)) return s;
		return null;
	}

	async function submitMove(input: {
		playerId: string;
		fromBoxId: string;
		fromSeat: number;
		fromRole: 'regular' | 'substitute';
		toBoxId: string;
		toSeat: number;
		role: 'regular' | 'substitute';
	}) {
		const fd = new FormData();
		for (const [k, v] of Object.entries(input)) fd.set(k, String(v));
		const res = await fetch('?/moveMember', { method: 'POST', body: fd });
		await handleActionResponse(res);
	}

	async function submitUnassign(playerId: string, boxId: string) {
		const fd = new FormData();
		fd.set('boxId', boxId);
		fd.set('playerId', playerId);
		const res = await fetch('?/removeMember', { method: 'POST', body: fd });
		await handleActionResponse(res);
	}

	/**
	 * Zwei sequenzielle "an neuen Sitz verschieben"-Aufrufe würden
	 * unique(box_id, seat) verletzen, solange beide Spieler ihre Box
	 * nicht wechseln (der Zielsitz ist ja noch belegt, bis der andere
	 * weggezogen ist) — deshalb ein eigener Server-Aufruf, der beide
	 * Sitze in einer Transaktion tauscht (siehe swap_league_box_seats).
	 */
	async function submitSwap(boxId: string, playerAId: string, playerBId: string) {
		const fd = new FormData();
		fd.set('boxId', boxId);
		fd.set('playerAId', playerAId);
		fd.set('playerBId', playerBId);
		const res = await fetch('?/swapMembers', { method: 'POST', body: fd });
		await handleActionResponse(res);
	}

	async function handleActionResponse(res: Response) {
		const raw = await res.text();
		// SvelteKit liefert Form-Action-Antworten devalue-serialisiert —
		// für eine reine Fehlermeldung reicht ein Blick auf den Rohtext,
		// eine vollständige deserialize() wäre hier reiner Overhead.
		const failed = !res.ok || /"type","failure"|"type","error"/.test(raw);
		if (failed) {
			const match = /"message","(.*?)"/.exec(raw);
			dndError = match ? match[1] : 'Verschieben fehlgeschlagen.';
		} else {
			dndError = null;
		}
		await invalidateAll();
	}

	function handleConsider(zoneId: string, e: CustomEvent<DndEvent<SeatCard>>) {
		zoneItems[zoneId] = e.detail.items;
	}

	async function handleFinalize(
		zoneId: string,
		isPool: boolean,
		e: CustomEvent<DndEvent<SeatCard>>
	) {
		zoneItems[zoneId] = e.detail.items;
		if (e.detail.info.trigger !== TRIGGERS.DROPPED_INTO_ZONE) return; // nur die Zielzone verarbeitet den Drop

		const droppedId = e.detail.info.id;
		const newIndex = e.detail.items.findIndex((it) => it.id === droppedId);
		const origin = location.get(droppedId);
		if (newIndex === -1 || !origin) return;
		if (origin.zone === zoneId && isPool) return; // Pool -> Pool: rein kosmetisch, nichts zu tun

		dndBusy = true;
		try {
			if (origin.zone === zoneId) {
				// Sitztausch innerhalb derselben Box: wer saß vorher auf dem Zielsitz?
				const toSeat = newIndex + 1;
				if (origin.seat === toSeat) return;
				const otherEntry = [...location.entries()].find(
					([id, loc]) => id !== droppedId && loc.zone === zoneId && loc.seat === toSeat
				);
				if (otherEntry) {
					await submitSwap(zoneId, droppedId, otherEntry[0]);
				}
				return;
			}

			if (isPool) {
				await submitUnassign(droppedId, origin.zone);
				return;
			}

			const seat = freeSeat(zoneId, droppedId);
			if (seat === null) {
				dndError = 'Diese Box ist schon voll besetzt.';
				await invalidateAll();
				return;
			}

			await submitMove({
				playerId: droppedId,
				fromBoxId: origin.zone === POOL ? '' : origin.zone,
				fromSeat: origin.zone === POOL ? 0 : origin.seat,
				fromRole: origin.role,
				toBoxId: zoneId,
				toSeat: seat,
				role: origin.role
			});
		} finally {
			dndBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Boxen — {data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`} | {data.league.name}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0B1E26" />
</svelte:head>

<LandingNav links={mainNav()} />

<main>
	<section class="sec sec-light" id="top">
		<div class="wrap" style="max-width: 76ch">
			<span class="eyebrow" use:reveal>{data.league.name}</span>
			<h1 use:reveal={{ delay: 0.05 }}>{data.cycle.name ?? `Zyklus ${data.cycle.ordinal}`}</h1>
			<p class="muted intro" use:reveal={{ delay: 0.1 }}>
				{data.boxes.length} Box{data.boxes.length === 1 ? '' : 'en'} · {data.availableRoster.length}
				Vereinsmitglieder noch ohne Box.
			</p>
			<p class="cycles-link" use:reveal={{ delay: 0.12 }}>
				<a href="/liga/{data.league.slug}/verwaltung/zyklen/{data.cycle.id}/termine"
					>Termine &amp; Plätze →</a
				>
				·
				<a href="/liga/{data.league.slug}/verwaltung/zyklen/{data.cycle.id}/ergebnisse"
					>Ergebnisse →</a
				>
			</p>

			{#if form?.message}
				<p class="warn" role="alert">{form.message}</p>
			{/if}

			<h2 class="section-title" use:reveal>Box hinzufügen</h2>
			<form
				method="POST"
				action="?/createBox"
				class="add-box"
				use:enhance={() => {
					busy = 'createBox';
					return async ({ update }) => {
						await update();
						busy = null;
					};
				}}
			>
				<fieldset disabled={busy === 'createBox'}>
					<div class="row">
						<div>
							<label class="field-label" for="ladderPosition">Leiterposition</label>
							<input
								id="ladderPosition"
								name="ladderPosition"
								type="number"
								min="1"
								value={data.suggestedPosition}
								required
							/>
						</div>
						<div>
							<label class="field-label" for="label">Bezeichnung</label>
							<input id="label" name="label" placeholder="z. B. Box 1" maxlength="60" />
						</div>
						<div>
							<label class="field-label" for="court">Platz</label>
							<input id="court" name="court" placeholder="optional" maxlength="60" />
						</div>
						<div>
							<label class="field-label" for="scheduledDate">Spieltermin</label>
							<input id="scheduledDate" name="scheduledDate" type="date" />
						</div>
						<div>
							<label class="field-label" for="scheduledTime">Uhrzeit</label>
							<input id="scheduledTime" name="scheduledTime" type="time" value="18:00" />
						</div>
					</div>
					<button class="btn btn-primary" type="submit" style="margin-top: 14px">
						{busy === 'createBox' ? 'Wird angelegt …' : 'Box anlegen'}
					</button>
				</fieldset>
			</form>

			<h2 class="section-title" use:reveal>
				Verfügbare Spieler <span class="muted small">— per Drag &amp; Drop einer Box zuweisen</span>
			</h2>
			{#if dndError}
				<p class="warn" role="alert">{dndError}</p>
			{/if}
			<div
				class="pool"
				class:pool-empty={(zoneItems[POOL]?.length ?? 0) === 0}
				use:dndzone={{ items: zoneItems[POOL] ?? [], flipDurationMs: 150, dragDisabled: dndBusy }}
				onconsider={(e) => handleConsider(POOL, e)}
				onfinalize={(e) => handleFinalize(POOL, true, e)}
			>
				{#each zoneItems[POOL] ?? [] as card (card.id)}
					<div class="pool-card">{card.name}</div>
				{/each}
				{#if (zoneItems[POOL]?.length ?? 0) === 0}
					<p class="muted small" style="margin:0">
						Alle Vereinsmitglieder sind schon einer Box zugeteilt.
					</p>
				{/if}
			</div>

			<h2 class="section-title" use:reveal>Boxen</h2>

			{#if data.boxes.length === 0}
				<p class="muted">Noch keine Box angelegt.</p>
			{:else}
				<div class="boxes" use:reveal>
					{#each data.boxes as box (box.id)}
						<article class="box">
							<header>
								<h3>{box.label ?? `Box ${box.ladderPosition}`}</h3>
								<span class="pos num">Position {box.ladderPosition}</span>
							</header>

							<ul
								class="seats"
								use:dndzone={{
									items: zoneItems[box.id] ?? [],
									flipDurationMs: 150,
									dragDisabled: dndBusy
								}}
								onconsider={(e) => handleConsider(box.id, e)}
								onfinalize={(e) => handleFinalize(box.id, false, e)}
							>
								{#each zoneItems[box.id] ?? [] as card (card.id)}
									<li>
										<span class="pname">
											{card.name}
											{#if card.role === 'substitute'}<span class="sub">Ersatz</span>{/if}
										</span>
										<form
											method="POST"
											action="?/removeMember"
											use:enhance={() => {
												busy = `${box.id}-${card.playerId}`;
												return async ({ update }) => {
													await update();
													busy = null;
												};
											}}
										>
											<input type="hidden" name="boxId" value={box.id} />
											<input type="hidden" name="playerId" value={card.playerId} />
											<button
												class="link-btn"
												type="submit"
												disabled={busy === `${box.id}-${card.playerId}`}
											>
												entfernen
											</button>
										</form>
									</li>
								{/each}
							</ul>
							{#if openSeats(box).length > 0}
								<p class="muted small" style="margin: 4px 0 12px">
									{openSeats(box).length} Sitz{openSeats(box).length === 1 ? '' : 'e'} frei — hierher
									ziehen oder unten hinzufügen.
								</p>
							{/if}

							{#if openSeats(box).length > 0}
								{#if addMemberBoxId === box.id}
									<form
										method="POST"
										action="?/addMember"
										use:enhance={() => {
											busy = 'addMember';
											return async ({ update }) => {
												await update();
												busy = null;
												addMemberBoxId = null;
											};
										}}
									>
										<input type="hidden" name="boxId" value={box.id} />
										<div class="addrow">
											<select name="playerId" required>
												<option value="" disabled selected>Spieler wählen …</option>
												{#each data.availableRoster as p (p.id)}
													<option value={p.id}>{p.name}</option>
												{/each}
											</select>
											<select name="seat">
												{#each openSeats(box) as s (s)}
													<option value={s}>Sitz {s}</option>
												{/each}
											</select>
											<select name="role">
												<option value="regular">Stammspieler</option>
												<option value="substitute">Ersatz</option>
											</select>
											<button
												class="btn btn-ghost-light"
												type="submit"
												disabled={busy === 'addMember'}
											>
												Hinzufügen
											</button>
											<button
												class="btn btn-ghost-light"
												type="button"
												onclick={() => (addMemberBoxId = null)}
											>
												Abbrechen
											</button>
										</div>
									</form>
								{:else}
									<button
										class="btn btn-ghost-light small"
										type="button"
										onclick={() => (addMemberBoxId = box.id)}
										disabled={data.availableRoster.length === 0}
									>
										Spieler hinzufügen
									</button>
								{/if}
							{/if}

							{#if box.rounds.every((r) => r.matchId === null)}
								<form
									method="POST"
									action="?/deleteBox"
									use:enhance={() => {
										busy = `del-${box.id}`;
										return async ({ update }) => {
											await update();
											busy = null;
										};
									}}
								>
									<input type="hidden" name="boxId" value={box.id} />
									<button class="link-btn danger" type="submit" disabled={busy === `del-${box.id}`}>
										Box löschen
									</button>
								</form>
							{/if}
						</article>
					{/each}
				</div>
			{/if}

			<p class="back">
				<a href="/liga/{data.league.slug}/verwaltung/zyklen">← Zurück zur Zyklenliste</a>
			</p>
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
	.cycles-link {
		margin-top: 10px;
		font-size: 14px;
	}
	.cycles-link a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
	}
	.warn {
		margin-bottom: 20px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 14px;
		background: rgba(179, 65, 31, 0.1);
		color: #8f3419;
	}
	.section-title {
		margin-top: 36px;
		font-size: clamp(20px, 2.4vw, 24px);
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}
	.field-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 5px;
	}
	.add-box .row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 12px;
	}
	input,
	select {
		width: 100%;
		padding: 9px 11px;
		border: 1px solid var(--line-light);
		border-radius: 10px;
		font-size: 14px;
		background: #fff;
		color: var(--ink);
		font-family: inherit;
		box-sizing: border-box;
	}

	.pool {
		margin-top: 16px;
		padding: 14px;
		border: 1px dashed var(--line-light);
		border-radius: 14px;
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: 8px;
		min-height: 3.2em;
	}
	.pool-empty {
		align-items: center;
	}
	.pool-card {
		padding: 7px 12px;
		border-radius: 100px;
		background: var(--chalk-2);
		border: 1px solid var(--line-light);
		font-size: 13px;
		cursor: grab;
	}

	.boxes {
		margin-top: 18px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 18px;
	}
	.box {
		padding: 18px;
		border: 1px solid var(--line-light);
		border-radius: 16px;
		background: var(--chalk-2);
	}
	.box header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.box h3 {
		font-size: 17px;
	}
	.pos {
		font-size: 12px;
		color: var(--muted-light);
	}

	.seats {
		list-style: none;
		margin: 0 0 4px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-height: 2.4em;
	}
	.seats li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		padding: 6px 8px;
		border-radius: 8px;
		background: #fff;
		cursor: grab;
	}
	.pname {
		flex: 1;
	}
	.sub {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.07);
		font-size: 10px;
		color: var(--muted-light);
	}
	.link-btn {
		background: none;
		border: none;
		padding: 0;
		font-size: 12px;
		color: var(--muted-light);
		text-decoration: underline;
		cursor: pointer;
	}
	.link-btn:hover {
		color: var(--court-deep, #0f6e5c);
	}
	.link-btn.danger {
		margin-top: 10px;
		color: #8f3419;
	}

	.addrow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}
	.addrow select {
		width: auto;
		flex: 1 1 10ch;
	}
	.small {
		margin-top: 4px;
		font-size: 13px;
		padding: 8px 14px;
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
