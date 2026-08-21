<script lang="ts">
	// Boxen und Aufstellung für einen Zyklus anlegen. Die drei Runden je
	// Box entstehen serverseitig automatisch beim Anlegen (siehe
	// league-admin.ts createBox) — hier gibt es dafür kein eigenes Formular.

	import { enhance } from '$app/forms';
	import { reveal } from '$lib/landing/reveal';
	import LandingNav from '$lib/components/landing/LandingNav.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import { mainNav } from '$lib/landing/nav';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state<string | null>(null);
	let addMemberBoxId = $state<string | null>(null);

	function openSeats(box: PageData['boxes'][number]): number[] {
		const taken = new Set(box.lineup.map((p) => p.seat));
		return Array.from({ length: data.boxSize }, (_, i) => i + 1).filter((s) => !taken.has(s));
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

							<ul class="seats">
								{#each Array.from({ length: data.boxSize }, (_, i) => i + 1) as seat (seat)}
									{@const player = box.lineup.find((p) => p.seat === seat)}
									<li>
										<span class="seatnum num">{seat}</span>
										{#if player}
											<span class="pname">
												{player.name}
												{#if player.role === 'substitute'}<span class="sub">Ersatz</span>{/if}
											</span>
											<form
												method="POST"
												action="?/removeMember"
												use:enhance={() => {
													busy = `${box.id}-${player.playerId}`;
													return async ({ update }) => {
														await update();
														busy = null;
													};
												}}
											>
												<input type="hidden" name="boxId" value={box.id} />
												<input type="hidden" name="playerId" value={player.playerId} />
												<button
													class="link-btn"
													type="submit"
													disabled={busy === `${box.id}-${player.playerId}`}
												>
													entfernen
												</button>
											</form>
										{:else}
											<span class="pname empty">frei</span>
										{/if}
									</li>
								{/each}
							</ul>

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
		margin: 0 0 12px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.seats li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
	}
	.seatnum {
		width: 1.4em;
		color: var(--muted-light);
	}
	.pname {
		flex: 1;
	}
	.pname.empty {
		color: var(--muted-light);
		font-style: italic;
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
