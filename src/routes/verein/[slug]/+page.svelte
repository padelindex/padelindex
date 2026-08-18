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
				Prämienkatalog für Tokens. Deaktivierte Prämien bleiben in der Historie eingelöster
				Spieler sichtbar, verschwinden aber aus deren Auswahl auf /konto.
			</p>
		</div>

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
</style>
