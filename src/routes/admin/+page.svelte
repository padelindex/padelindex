<script lang="ts">
	import { enhance } from '$app/forms';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let addingClub = $state(false);
	let clubBusy = $state(false);
	let tierBusyId = $state<string | null>(null);
	let addingAdminFor = $state<string | null>(null);
	let adminBusyId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Super-Admin — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav>
	<a class="btn btn-ghost" href="/admin/advertising">Werbung &amp; Sponsoring</a>
	<a class="btn btn-ghost" href="/konto">Zu meinem Konto</a>
</MinimalNav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head">
			<span class="eyebrow">Super-Admin</span>
			<h2>Vereine</h2>
			<p class="muted">Alle Vereine der Plattform, Lizenzstufen und Vereins-Admins — ohne SQL.</p>
		</div>

		{#if form?.clubError}
			<p class="err">{form.clubError}</p>
		{/if}

		<div class="card">
			<div class="card-head">
				<h3 class="card-title" style="margin: 0">Neuer Verein</h3>
				<button
					class="btn btn-ghost-light"
					type="button"
					onclick={() => (addingClub = !addingClub)}
				>
					{addingClub ? 'Abbrechen' : '+ Anlegen'}
				</button>
			</div>

			{#if addingClub}
				<form
					method="POST"
					action="?/createClub"
					use:enhance={() => {
						clubBusy = true;
						return async ({ update }) => {
							await update();
							clubBusy = false;
							addingClub = false;
						};
					}}
				>
					<input name="name" placeholder="Vereinsname" required maxlength="120" />
					<input
						name="slug"
						placeholder="slug-fuer-url"
						required
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
						title="Nur Kleinbuchstaben, Ziffern und Bindestriche"
					/>
					<select name="licenseTier">
						<option value="free">Free</option>
						<option value="basic">Basic</option>
						<option value="pro">Pro</option>
					</select>
					<button
						class="btn btn-primary"
						type="submit"
						disabled={clubBusy}
						style="margin-top: 10px"
					>
						{clubBusy ? 'Wird angelegt…' : 'Anlegen'}
					</button>
				</form>
			{/if}
		</div>

		{#if form?.adminError}
			<p class="err">{form.adminError}</p>
		{/if}

		{#if data.clubs.length === 0}
			<p class="muted" style="margin-top: 28px">Noch keine Vereine.</p>
		{/if}

		{#each data.clubs as c (c.id)}
			<div class="card">
				<div class="card-head">
					<h3 class="card-title" style="margin: 0">{c.name}</h3>
					<a class="btn btn-ghost-light" href="/verein/{c.slug}">Zum Vereins-Admin</a>
				</div>
				<p class="muted" style="font-size: 13px; margin: 4px 0 16px">
					{c.memberCount} Mitglieder · {c.matchCount} Matches
				</p>

				<form
					method="POST"
					action="?/updateLicenseTier"
					class="tier-row"
					use:enhance={() => {
						tierBusyId = c.id;
						return async ({ update }) => {
							await update();
							tierBusyId = null;
						};
					}}
				>
					<input type="hidden" name="clubId" value={c.id} />
					<label for="tier-{c.id}">Lizenzstufe</label>
					<select id="tier-{c.id}" name="licenseTier" value={c.licenseTier}>
						<option value="free">Free</option>
						<option value="basic">Basic</option>
						<option value="pro">Pro</option>
					</select>
					<button class="btn btn-ghost-light" type="submit" disabled={tierBusyId === c.id}>
						{tierBusyId === c.id ? 'Wird gespeichert…' : 'Speichern'}
					</button>
				</form>

				<div class="admin-section">
					<div class="card-head">
						<span class="sub-title">Vereins-Admins</span>
						<button
							class="btn btn-ghost-light"
							type="button"
							onclick={() => (addingAdminFor = addingAdminFor === c.id ? null : c.id)}
						>
							{addingAdminFor === c.id ? 'Abbrechen' : '+ Hinzufügen'}
						</button>
					</div>

					{#if addingAdminFor === c.id}
						<form method="POST" action="?/searchAdmins" use:enhance>
							<input type="hidden" name="clubId" value={c.id} />
							<input name="query" placeholder="Name oder Handle…" minlength="2" required />
							<button class="btn btn-ghost-light" type="submit" style="margin-top: 10px">
								Suchen
							</button>
						</form>
						{#if form?.searchClubId === c.id && form?.searchResults}
							{#if form.searchResults.length === 0}
								<p class="muted" style="font-size: 13px; margin-top: 10px">Keine Treffer.</p>
							{:else}
								<ul class="search-results">
									{#each form.searchResults as r (r.id)}
										<li>
											<span>{r.name} <span class="muted">· {r.handle}</span></span>
											<form
												method="POST"
												action="?/addAdmin"
												use:enhance={() => {
													adminBusyId = r.id;
													return async ({ update }) => {
														await update();
														adminBusyId = null;
														addingAdminFor = null;
													};
												}}
											>
												<input type="hidden" name="clubId" value={c.id} />
												<input type="hidden" name="playerId" value={r.id} />
												<button
													class="btn btn-ghost-light"
													type="submit"
													disabled={adminBusyId === r.id}
												>
													Hinzufügen
												</button>
											</form>
										</li>
									{/each}
								</ul>
							{/if}
						{/if}
					{/if}

					{#if c.admins.length === 0}
						<p class="muted" style="font-size: 13px; margin-top: 10px">Noch keine Admins.</p>
					{:else}
						<ul class="admin-list">
							{#each c.admins as a (a.playerId)}
								<li>
									<span>{a.name} <span class="muted">· {a.handle}</span></span>
									<form
										method="POST"
										action="?/removeAdmin"
										use:enhance={() => {
											adminBusyId = a.playerId;
											return async ({ update }) => {
												await update();
												adminBusyId = null;
											};
										}}
									>
										<input type="hidden" name="clubId" value={c.id} />
										<input type="hidden" name="playerId" value={a.playerId} />
										<button
											class="btn btn-ghost-light"
											type="submit"
											disabled={adminBusyId === a.playerId}
										>
											Entfernen
										</button>
									</form>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/each}
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

	.sub-title {
		font-size: 12px;
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
	form select {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 11px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
		margin: 10px 0 0;
	}

	.tier-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 16px;
	}
	.tier-row label {
		font-size: 13px;
		color: var(--muted-light);
		flex-shrink: 0;
	}
	.tier-row select {
		margin: 0;
		width: auto;
	}

	.admin-section {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.search-results,
	.admin-list {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
	}
	.search-results li,
	.admin-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		font-size: 13.5px;
	}
	.search-results li:first-child,
	.admin-list li:first-child {
		border-top: none;
	}
</style>
