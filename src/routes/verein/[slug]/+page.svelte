<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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
	let matchBusyId = $state<string | null>(null);
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
						<input name="displayName" placeholder="Name, z. B. Max Mustermann" required maxlength="120" />
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
						Für jemanden, der noch keinen Account hat — kann das Profil später über den
						Vereins-Link selbst beanspruchen.
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
								{#if !m.claimed}<span class="tag-inactive">unbeansprucht</span>{/if}
							</span>
							<span class="member-rating num">{m.rating.toFixed(2)}</span>
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
								<button class="btn btn-ghost-light" type="submit" disabled={memberBusyId === m.id}>
									Entfernen
								</button>
							</form>
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

		{#if form?.rewardError}
			<p class="err">{form.rewardError}</p>
		{/if}

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
					<input name="cost" type="number" min="1" step="1" placeholder="Kosten in Tokens" required />
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
	form textarea {
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
		color: #b4711a;
		background: rgba(180, 113, 26, 0.12);
		padding: 2px 7px;
		border-radius: 100px;
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
		min-width: 0;
		font-size: 14px;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.member-rating {
		flex-shrink: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--court-deep, #0f6e5c);
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
