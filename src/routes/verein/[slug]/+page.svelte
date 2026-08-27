<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { SKILL_TIER_LABELS, SKILL_TIER_TARGET_INDEX, type SkillTier } from '$lib/rating-core';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const SKILL_TIER_ORDER: SkillTier[] = ['beginner', 'intermediate', 'advanced'];

	let creating = $state(false);
	let editingId = $state<string | null>(null);
	let busyId = $state<string | null>(null);

	function startEdit(id: string) {
		editingId = editingId === id ? null : id;
	}

	let settingsBusy = $state(false);

	let addingMember = $state(false);
	let addMode = $state<'search' | 'unclaimed'>('search');
	let memberBusyId = $state<string | null>(null);
	let calibratingId = $state<string | null>(null);
	let matchBusyId = $state<string | null>(null);

	let rouletteCreating = $state(false);
	let rouletteBusyId = $state<string | null>(null);
	const today = new Date().toISOString().slice(0, 10);

	function formatSlotDate(iso: string): string {
		return new Date(iso).toLocaleString('de-DE', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Vereins-Admin — {data.club.name} — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		<a class="btn btn-ghost" href="/konto">Zu meinem Konto</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head">
			<span class="eyebrow">Vereins-Admin</span>
			<h2>{data.club.name}</h2>
			<p class="muted">
				Mitglieder, ausstehende Matches und Prämienkatalog für {data.club.name}.
			</p>
		</div>

		{#if data.league}
			<div class="card league-card">
				<div class="card-head">
					<h3 class="card-title" style="margin:0">Liga — {data.league.name}</h3>
					<a class="btn btn-primary" href="/liga/{data.league.slug}/verwaltung">Liga verwalten →</a>
				</div>
				<p class="muted" style="font-size: 13px; margin: 10px 0 0">
					Boxen &amp; Paarungen, Warteliste, Termine, Ergebnisse und Auf-/Abstieg für diese Liga.
				</p>
			</div>
		{/if}

		{#if form?.settingsError}
			<p class="err">{form.settingsError}</p>
		{/if}

		<div class="card">
			<h3 class="card-title">Einstellungen</h3>
			<form
				method="POST"
				action="?/updateSettings"
				use:enhance={() => {
					settingsBusy = true;
					return async ({ update }) => {
						await update();
						settingsBusy = false;
					};
				}}
			>
				<label for="club-name">Vereinsname</label>
				<input id="club-name" name="name" value={data.club.name} required maxlength="120" />
				<label for="club-accent">Akzentfarbe</label>
				<div class="accent-row">
					<input
						id="club-accent"
						name="accent"
						type="color"
						value={data.club.accent ?? '#0F6E5C'}
					/>
					<span class="muted" style="font-size: 13px">Für Leaderboard & Embed-Widget</span>
				</div>

				<label for="club-lat">Standort (für Entfernung im Matchmaking)</label>
				<div class="coord-row">
					<input
						id="club-lat"
						name="latitude"
						type="number"
						step="any"
						min="-90"
						max="90"
						placeholder="Breitengrad"
						value={data.club.latitude ?? ''}
					/>
					<input
						id="club-lng"
						name="longitude"
						type="number"
						step="any"
						min="-180"
						max="180"
						placeholder="Längengrad"
						value={data.club.longitude ?? ''}
					/>
				</div>
				<p class="muted coord-hint">
					<a
						href="https://www.google.com/maps/search/{encodeURIComponent(data.club.name)}"
						target="_blank"
						rel="noopener"
					>
						Auf Google Maps suchen
					</a>
					— dort mit Rechtsklick auf den Platz klicken, die Koordinaten kopieren („48.1234, 11.5678")
					und hier auf beide Felder aufteilen. Leer lassen, um den Standort wieder zu entfernen; ohne
					Koordinaten fällt das Matchmaking bei der Entfernung auf „gleicher Verein" zurück.
				</p>

				<button class="btn btn-primary" type="submit" disabled={settingsBusy}>
					{settingsBusy ? 'Wird gespeichert…' : 'Speichern'}
				</button>
			</form>
		</div>

		{#if form?.memberError}
			<p class="err">{form.memberError}</p>
		{/if}

		<div class="card">
			<div class="card-head">
				<h3 class="card-title" style="margin:0">Mitglieder ({data.members.length})</h3>
				<button
					class="btn btn-ghost-light"
					type="button"
					onclick={() => (addingMember = !addingMember)}
				>
					{addingMember ? 'Abbrechen' : '+ Hinzufügen'}
				</button>
			</div>

			{#if addingMember}
				<div class="add-mode-toggle" role="group">
					<button
						type="button"
						class:on={addMode === 'search'}
						onclick={() => (addMode = 'search')}
					>
						Registrierten Spieler suchen
					</button>
					<button
						type="button"
						class:on={addMode === 'unclaimed'}
						onclick={() => (addMode = 'unclaimed')}
					>
						Platzhalter anlegen
					</button>
				</div>

				{#if addMode === 'search'}
					<form method="POST" action="?/searchMembers" use:enhance>
						<input
							name="query"
							placeholder="Name oder Handle…"
							value={form?.searchQuery ?? ''}
							minlength="2"
							required
						/>
						<button class="btn btn-ghost-light" type="submit" style="margin-top: 10px">
							Suchen
						</button>
					</form>
					{#if form?.searchResults}
						{#if form.searchResults.length === 0}
							<p class="muted" style="font-size: 13px; margin-top: 12px">Keine Treffer.</p>
						{:else}
							<ul class="search-results">
								{#each form.searchResults as r (r.id)}
									<li>
										<span>{r.name} <span class="muted">· {r.handle}</span></span>
										<form
											method="POST"
											action="?/addExisting"
											use:enhance={() => {
												memberBusyId = r.id;
												return async ({ update }) => {
													await update();
													memberBusyId = null;
													addingMember = false;
												};
											}}
										>
											<input type="hidden" name="playerId" value={r.id} />
											<button
												class="btn btn-ghost-light"
												type="submit"
												disabled={memberBusyId === r.id}
											>
												Hinzufügen
											</button>
										</form>
									</li>
								{/each}
							</ul>
						{/if}
					{/if}
				{:else}
					<form
						method="POST"
						action="?/addUnclaimed"
						use:enhance={() => {
							memberBusyId = 'new';
							return async ({ update }) => {
								await update();
								memberBusyId = null;
								addingMember = false;
							};
						}}
					>
						<input
							name="displayName"
							placeholder="Name, z. B. Max Mustermann"
							required
							maxlength="120"
						/>
						<label for="new-member-tier" class="muted tier-label">
							Skill-Level (optional) — für erfahrene Neuzugänge, damit das Matchmaking nicht bei
							Anfänger-Niveau startet
						</label>
						<select id="new-member-tier" name="skillTier">
							<option value="">Nicht festlegen — startet mit Standardwert</option>
							{#each SKILL_TIER_ORDER as tier (tier)}
								<option value={tier}>
									{SKILL_TIER_LABELS[tier]} (Index {SKILL_TIER_TARGET_INDEX[tier].toFixed(1)})
								</option>
							{/each}
						</select>
						<button
							class="btn btn-primary"
							type="submit"
							disabled={memberBusyId === 'new'}
							style="margin-top: 10px"
						>
							{memberBusyId === 'new' ? 'Wird angelegt…' : 'Anlegen'}
						</button>
					</form>
					<p class="muted" style="font-size: 12.5px; margin-top: 10px">
						Für jemanden, der noch keinen Account hat — kann das Profil später über den Vereins-Link
						selbst beanspruchen.
					</p>
				{/if}
			{/if}

			{#if data.members.length === 0}
				<p class="muted" style="font-size: 13px; margin-top: 14px">Noch keine Mitglieder.</p>
			{:else}
				<ul class="members">
					{#each data.members as m (m.id)}
						<li class="member-row">
							<span class="member-name">
								{m.name}
								{#if m.awaitingReview}
									<span class="tag-review">wartet auf Freigabe</span>
								{:else if !m.claimed}
									<span class="tag-inactive">unbeansprucht</span>
								{/if}
								{#if m.initialIndexTier}
									<span class="tag-tier">kalibriert: {SKILL_TIER_LABELS[m.initialIndexTier]}</span>
								{/if}
							</span>
							<span class="member-rating num">{m.rating.toFixed(2)}</span>
							<div class="member-actions">
								{#if m.calibratable}
									<button
										class="btn btn-ghost-light"
										type="button"
										onclick={() => (calibratingId = calibratingId === m.id ? null : m.id)}
									>
										{m.initialIndexSet ? 'Level ändern' : 'Level setzen'}
									</button>
								{/if}
								{#if m.awaitingReview}
									<form
										method="POST"
										action="?/approveClaim"
										use:enhance={() => {
											memberBusyId = m.id;
											return async ({ update }) => {
												await update();
												memberBusyId = null;
											};
										}}
									>
										<input type="hidden" name="playerId" value={m.id} />
										<button class="btn btn-primary" type="submit" disabled={memberBusyId === m.id}>
											Freigeben
										</button>
									</form>
									<form
										method="POST"
										action="?/rejectClaim"
										use:enhance={() => {
											memberBusyId = m.id;
											return async ({ update }) => {
												await update();
												memberBusyId = null;
											};
										}}
									>
										<input type="hidden" name="playerId" value={m.id} />
										<button
											class="btn btn-ghost-light"
											type="submit"
											disabled={memberBusyId === m.id}
										>
											Ablehnen
										</button>
									</form>
								{/if}
								<form
									method="POST"
									action="?/removeMember"
									use:enhance={() => {
										memberBusyId = m.id;
										return async ({ update }) => {
											await update();
											memberBusyId = null;
										};
									}}
								>
									<input type="hidden" name="playerId" value={m.id} />
									<button
										class="btn btn-ghost-light"
										type="submit"
										disabled={memberBusyId === m.id}
									>
										Entfernen
									</button>
								</form>
							</div>
							{#if calibratingId === m.id}
								<form
									method="POST"
									action="?/setInitialIndex"
									class="calibrate-form"
									use:enhance={() => {
										memberBusyId = m.id;
										return async ({ update }) => {
											await update();
											memberBusyId = null;
											calibratingId = null;
										};
									}}
								>
									<input type="hidden" name="playerId" value={m.id} />
									<select name="skillTier" required>
										<option value="" disabled>Skill-Level wählen…</option>
										{#each SKILL_TIER_ORDER as tier (tier)}
											<option value={tier} selected={m.initialIndexTier === tier}>
												{SKILL_TIER_LABELS[tier]} (Index {SKILL_TIER_TARGET_INDEX[tier].toFixed(1)})
											</option>
										{/each}
									</select>
									<button class="btn btn-primary" type="submit" disabled={memberBusyId === m.id}>
										{memberBusyId === m.id ? 'Wird gespeichert…' : 'Setzen'}
									</button>
									<button
										class="btn btn-ghost-light"
										type="button"
										onclick={() => (calibratingId = null)}
									>
										Abbrechen
									</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if form?.matchError}
			<p class="err">{form.matchError}</p>
		{/if}

		{#if data.pendingMatches.length > 0}
			<div class="card">
				<h3 class="card-title">Ausstehende Matches</h3>
				<ul class="pending-list">
					{#each data.pendingMatches as pm (pm.id)}
						<li class="pending-row">
							<span class="pending-teams">
								{pm.team1.map((p) => p.name).join(' & ')} vs. {pm.team2
									.map((p) => p.name)
									.join(' & ')}
								<span class="muted">
									· {pm.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ')}
								</span>
							</span>
							<form
								method="POST"
								action="?/cancelMatch"
								use:enhance={() => {
									matchBusyId = pm.id;
									return async ({ update }) => {
										await update();
										matchBusyId = null;
									};
								}}
							>
								<input type="hidden" name="matchId" value={pm.id} />
								<button class="btn btn-ghost-light" type="submit" disabled={matchBusyId === pm.id}>
									Stornieren
								</button>
							</form>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if form?.rouletteError}
			<p class="err">{form.rouletteError}</p>
		{/if}

		<div class="card">
			<div class="card-head">
				<h3 class="card-title" style="margin:0">Padel Roulette</h3>
				<a class="btn btn-ghost-light" href="/c/{data.club.slug}/roulette">Spieleransicht</a>
			</div>
			<p class="muted" style="font-size: 13px; margin: 0 0 14px">
				Termin anlegen, Mitglieder sagen zu — bei vier Zusagen findet das Match statt.
			</p>

			{#if data.rouletteSlots.length > 0}
				<ul class="pending-list">
					{#each data.rouletteSlots as s (s.id)}
						<li class="pending-row">
							<span class="pending-teams">
								{formatSlotDate(s.startsAt)}
								{#if s.court}· {s.court}{/if}
								<span class="muted">
									· {s.cancelled ? 'abgesagt' : `${s.signups.length}/4 zugesagt`}
								</span>
							</span>
							{#if !s.cancelled}
								<form
									method="POST"
									action="?/cancelRouletteSlot"
									use:enhance={() => {
										rouletteBusyId = s.id;
										return async ({ update }) => {
											await update();
											rouletteBusyId = null;
										};
									}}
								>
									<input type="hidden" name="slotId" value={s.id} />
									<button
										class="btn btn-ghost-light"
										type="submit"
										disabled={rouletteBusyId === s.id}
									>
										Absagen
									</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<button
				class="btn btn-ghost-light"
				type="button"
				style="margin-top: 14px"
				onclick={() => (rouletteCreating = !rouletteCreating)}
			>
				{rouletteCreating ? 'Abbrechen' : '+ Termin anlegen'}
			</button>

			{#if rouletteCreating}
				<form
					method="POST"
					action="?/createRouletteSlot"
					use:enhance={() => {
						rouletteBusyId = 'new';
						return async ({ update }) => {
							await update();
							rouletteBusyId = null;
							rouletteCreating = false;
						};
					}}
					style="margin-top: 14px"
				>
					<input type="date" name="startsAtDate" min={today} required />
					<input type="time" name="startsAtTime" value="18:00" required />
					<input
						type="number"
						name="durationMin"
						min="30"
						max="240"
						step="15"
						value="90"
						placeholder="Dauer (Minuten)"
					/>
					<input type="text" name="court" maxlength="40" placeholder="Court (optional)" />
					<input type="text" name="info" maxlength="160" placeholder="Info (optional)" />
					<button
						class="btn btn-primary"
						type="submit"
						style="margin-top: 14px"
						disabled={rouletteBusyId === 'new'}
					>
						{rouletteBusyId === 'new' ? 'Wird angelegt…' : 'Termin anlegen'}
					</button>
				</form>
			{/if}
		</div>

		<div class="card">
			<div class="card-head">
				<h3 class="card-title" style="margin:0">Neue Prämie</h3>
				<button class="btn btn-ghost-light" type="button" onclick={() => (creating = !creating)}>
					{creating ? 'Abbrechen' : '+ Hinzufügen'}
				</button>
			</div>

			{#if creating}
				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						busyId = 'new';
						return async ({ update }) => {
							await update();
							busyId = null;
							creating = false;
						};
					}}
				>
					<input name="title" placeholder="Titel, z. B. Trainerstunde" required maxlength="120" />
					<textarea name="description" placeholder="Beschreibung (optional)" rows="2"></textarea>
					<input
						name="cost"
						type="number"
						min="1"
						step="1"
						placeholder="Kosten in Tokens"
						required
					/>
					<button class="btn btn-primary" type="submit" disabled={busyId === 'new'}>
						{busyId === 'new' ? 'Wird gespeichert…' : 'Anlegen'}
					</button>
				</form>
			{/if}
		</div>

		<div class="card">
			<h3 class="card-title">Prämien</h3>
			{#if data.rewards.length === 0}
				<p class="muted" style="font-size: 13px; margin: 0">Noch keine Prämien angelegt.</p>
			{:else}
				<ul class="rewards">
					{#each data.rewards as r (r.id)}
						<li class="reward-row" class:inactive={!r.active}>
							{#if editingId === r.id}
								<form
									method="POST"
									action="?/update"
									class="edit-form"
									use:enhance={() => {
										busyId = r.id;
										return async ({ update }) => {
											await update();
											busyId = null;
											editingId = null;
										};
									}}
								>
									<input type="hidden" name="rewardId" value={r.id} />
									<input name="title" value={r.title} required maxlength="120" />
									<textarea name="description" rows="2">{r.description ?? ''}</textarea>
									<input name="cost" type="number" min="1" step="1" value={r.cost} required />
									<div class="edit-actions">
										<button class="btn btn-primary" type="submit" disabled={busyId === r.id}>
											{busyId === r.id ? 'Wird gespeichert…' : 'Speichern'}
										</button>
										<button
											class="btn btn-ghost-light"
											type="button"
											onclick={() => (editingId = null)}
										>
											Abbrechen
										</button>
									</div>
								</form>
							{:else}
								<div class="reward-main">
									<span class="reward-title">
										{r.title}
										{#if !r.active}<span class="tag-inactive">inaktiv</span>{/if}
									</span>
									{#if r.description}
										<span class="reward-desc">{r.description}</span>
									{/if}
								</div>
								<span class="reward-cost num">{r.cost}</span>
								<div class="reward-actions">
									<button class="btn btn-ghost-light" type="button" onclick={() => startEdit(r.id)}>
										Bearbeiten
									</button>
									<form
										method="POST"
										action="?/toggleActive"
										use:enhance={() => {
											busyId = r.id;
											return async ({ update }) => {
												await update();
												busyId = null;
											};
										}}
									>
										<input type="hidden" name="rewardId" value={r.id} />
										<input type="hidden" name="active" value={String(!r.active)} />
										<button class="btn btn-ghost-light" type="submit" disabled={busyId === r.id}>
											{r.active ? 'Deaktivieren' : 'Aktivieren'}
										</button>
									</form>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</section>

<style>
	.card {
		margin-top: 28px;
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.league-card {
		border-left: 3px solid var(--court-deep, #0f6e5c);
	}
	.league-card .card-head {
		flex-wrap: wrap;
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	form input,
	form textarea,
	form select {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 11px 16px;
		border-radius: 14px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
		margin: 12px 0 0;
		resize: vertical;
	}

	form input[type='number'] {
		border-radius: 100px;
	}

	.card form > button,
	.edit-actions {
		margin-top: 14px;
	}

	.edit-actions {
		display: flex;
		gap: 10px;
	}

	.rewards {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.reward-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.reward-row:first-child {
		border-top: none;
		padding-top: 0;
	}

	.reward-row.inactive {
		opacity: 0.55;
	}

	.reward-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.reward-title {
		font-size: 14px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tag-inactive {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #8f5a15;
		background: rgba(180, 113, 26, 0.12);
		padding: 2px 7px;
		border-radius: 100px;
	}

	.tag-review {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--court-deep, #0f6e5c);
		background: rgba(15, 110, 92, 0.12);
		padding: 2px 7px;
		border-radius: 100px;
		white-space: nowrap;
	}

	.tag-tier {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #3854b0;
		background: rgba(56, 84, 176, 0.1);
		padding: 2px 7px;
		border-radius: 100px;
		white-space: nowrap;
	}

	.tier-label {
		display: block;
		font-size: 12.5px;
		margin: 14px 0 0;
		line-height: 1.4;
	}

	.calibrate-form {
		flex: 1 0 100%;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}
	.calibrate-form select {
		flex: 1 1 220px;
		width: auto;
		margin: 0;
		padding: 8px 12px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 13px;
	}
	.calibrate-form button {
		padding: 8px 14px;
		font-size: 13px;
	}

	.reward-desc {
		font-size: 12.5px;
		color: var(--muted-light);
	}

	.reward-cost {
		flex-shrink: 0;
		font-size: 15px;
		font-weight: 600;
		color: var(--court-deep, #0f6e5c);
	}

	.reward-actions {
		flex-shrink: 0;
		display: flex;
		gap: 8px;
	}

	.reward-actions button {
		padding: 8px 14px;
		font-size: 13px;
	}

	.edit-form {
		flex: 1;
	}

	.accent-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
	}
	.accent-row input[type='color'] {
		width: 48px;
		height: 40px;
		padding: 4px;
		border-radius: 10px;
	}

	.coord-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 12px;
	}

	.coord-hint {
		font-size: 12.5px;
		margin: 8px 0 0;
		line-height: 1.5;
	}

	.coord-hint a {
		color: var(--court-deep, #0f6e5c);
	}

	.add-mode-toggle {
		display: flex;
		gap: 8px;
		margin: 14px 0;
	}
	.add-mode-toggle button {
		flex: 1;
		padding: 9px 12px;
		font-size: 13px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		color: var(--muted-light);
		cursor: pointer;
	}
	.add-mode-toggle button.on {
		background: var(--court-deep, #0f6e5c);
		border-color: var(--court-deep, #0f6e5c);
		color: #fff;
	}

	.search-results {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
	}
	.search-results li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		font-size: 13.5px;
	}
	.search-results li:first-child {
		border-top: none;
	}

	.members {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
	}
	.member-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		padding: 12px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.member-row:first-child {
		border-top: none;
		padding-top: 0;
	}
	.member-name {
		flex: 1;
		min-width: 160px;
		font-size: 14px;
		font-weight: 500;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	.member-rating {
		flex-shrink: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--court-deep, #0f6e5c);
	}
	.member-actions {
		/* min-width:0 statt des Flexbox-Defaults (min-width:auto) — sonst
		   verweigert sich die Gruppe dem Schrumpfen und läuft bei drei
		   Buttons (Freigeben/Ablehnen/Entfernen) über den Kartenrand
		   hinaus, statt intern umzubrechen. Live bei 360px gefunden. */
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.member-actions button {
		padding: 8px 14px;
		font-size: 13px;
	}

	.pending-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.pending-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}
	.pending-row:first-child {
		border-top: none;
		padding-top: 0;
	}
	.pending-teams {
		font-size: 13.5px;
		flex: 1;
		min-width: 0;
	}
</style>
