<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import AvatarCircle from '$lib/components/AvatarCircle.svelte';
	import MinimalNav from '$lib/components/MinimalNav.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);

	const claimLabel: Record<string, string> = {
		unclaimed: 'Nicht beansprucht',
		pending: 'Wird geprüft',
		awaiting_review: 'Wartet auf Freigabe',
		claimed: 'Bestätigt',
		rejected: 'Abgelehnt'
	};

	const birthDateLabel = $derived(
		data.profile.birthDate
			? new Date(`${data.profile.birthDate}T12:00:00Z`).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				})
			: '—'
	);

	const fullName = $derived(
		[data.profile.firstName, data.profile.lastName].filter(Boolean).join(' ') ||
			data.profile.displayName
	);

	// Jedes Feld ist genau einmal ausfüllbar (siehe fillDetails-Action) —
	// ein Profil, das per Magic Link beansprucht statt registriert wurde,
	// hat diese Felder nie bekommen. Fehlende zeigen ein Eingabefeld,
	// bereits gesetzte bleiben reiner Text.
	const missingAnyDetail = $derived(
		!data.profile.firstName ||
			!data.profile.lastName ||
			!data.profile.birthDate ||
			!data.profile.clubName
	);
</script>

<svelte:head>
	<title>Mein Profil — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav>
	<a class="btn btn-ghost" href="/konto">Mein Konto</a>
</MinimalNav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head profile-head">
			<AvatarCircle avatarUrl={data.profile.avatarUrl} name={fullName} size={64} loading="eager" />
			<div>
				<span class="eyebrow">Mein Profil</span>
				<h2>{fullName}</h2>
			</div>
		</div>

		<div class="card">
			<h3 class="card-title">Persönliche Daten</h3>
			<form
				method="POST"
				action="?/fillDetails"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update({ reset: false });
						busy = false;
					};
				}}
			>
				<dl class="facts">
					<div class="fact">
						<dt><label for="firstName">Vorname</label></dt>
						{#if data.profile.firstName}
							<dd>{data.profile.firstName}</dd>
						{:else}
							<dd class="fill">
								<input id="firstName" name="firstName" type="text" autocomplete="given-name" />
							</dd>
						{/if}
					</div>
					<div class="fact">
						<dt><label for="lastName">Nachname</label></dt>
						{#if data.profile.lastName}
							<dd>{data.profile.lastName}</dd>
						{:else}
							<dd class="fill">
								<input id="lastName" name="lastName" type="text" autocomplete="family-name" />
							</dd>
						{/if}
					</div>
					<div class="fact">
						<dt>
							<label for="birthDate">Geburtsdatum</label>
							<span class="priv">nur privat sichtbar</span>
						</dt>
						{#if data.profile.birthDate}
							<dd>{birthDateLabel}</dd>
						{:else}
							<dd class="fill">
								<input id="birthDate" name="birthDate" type="date" autocomplete="bday" />
							</dd>
						{/if}
					</div>
					<div class="fact">
						<dt><label for="clubName">Verein</label></dt>
						{#if data.profile.clubName}
							<dd>{data.profile.clubName}</dd>
						{:else}
							<dd class="fill">
								<input id="clubName" name="clubName" type="text" autocomplete="organization" />
							</dd>
						{/if}
					</div>
					<div class="fact">
						<dt>E-Mail</dt>
						<dd>{data.email ?? '—'}</dd>
					</div>
				</dl>

				{#if missingAnyDetail}
					<p class="fill-hint">
						Jedes Feld lässt sich nur einmal eintragen — bitte sorgfältig ausfüllen.
					</p>
					{#if form?.detailsErrors?.general}
						<p class="field-err">{form.detailsErrors.general}</p>
					{/if}
					{#if form?.detailsErrors?.firstName}
						<p class="field-err">Vorname: {form.detailsErrors.firstName}</p>
					{/if}
					{#if form?.detailsErrors?.lastName}
						<p class="field-err">Nachname: {form.detailsErrors.lastName}</p>
					{/if}
					{#if form?.detailsErrors?.birthDate}
						<p class="field-err">Geburtsdatum: {form.detailsErrors.birthDate}</p>
					{/if}
					{#if form?.detailsErrors?.clubName}
						<p class="field-err">Verein: {form.detailsErrors.clubName}</p>
					{/if}
					{#if form?.detailsSaved}
						<p class="ok" style="font-size: 14px; margin-top: 10px">Gespeichert.</p>
					{/if}
					<button class="btn btn-ghost-light" type="submit" disabled={busy} style="margin-top: 16px">
						{busy ? 'Wird gespeichert…' : 'Angaben speichern'}
					</button>
				{/if}
			</form>
		</div>

		<div class="card">
			<h3 class="card-title">Ranking</h3>
			<div class="stat-row">
				<div class="stat">
					<span class="stat-v">{data.profile.rating.toFixed(2)}</span>
					<span class="stat-l">Rating{data.profile.isProvisional ? ' (vorläufig)' : ''}</span>
				</div>
				<div class="stat">
					<span class="stat-v">{data.profile.matchesPlayed}</span>
					<span class="stat-l">Matches</span>
				</div>
				<div class="stat">
					<span class="stat-v"
						>{claimLabel[data.profile.claimStatus] ?? data.profile.claimStatus}</span
					>
					<span class="stat-l">Status</span>
				</div>
			</div>
			<div class="action-row">
				<a class="btn btn-ghost-light" href="/p/{data.profile.handle}">Öffentliches Profil</a>
				<a class="btn btn-ghost-light" href="/konto">Zum Konto</a>
			</div>
		</div>

		<div class="card" class:nudge={data.availabilityCount === 0}>
			<h3 class="card-title">Spielzeiten</h3>
			{#if data.availabilityCount === 0}
				<p class="muted" style="font-size: 14px">
					Trag ein, wann du Zeit zum Spielen hast — andere Spieler mit passenden Zeiten können
					dich dann über „Spieler finden" anschreiben. Optional, aber ohne Zeiten findet dich
					niemand.
				</p>
				<a class="btn btn-primary" href="/spielzeiten" style="margin-top: 14px">
					Spielzeiten festlegen
				</a>
			{:else}
				<p class="muted" style="font-size: 14px">
					{data.availabilityCount}
					{data.availabilityCount === 1 ? 'Zeit ist' : 'Zeiten sind'} hinterlegt.
				</p>
				<div class="action-row">
					<a class="btn btn-ghost-light" href="/spielzeiten">Bearbeiten</a>
					<a class="btn btn-ghost-light" href="/spieler-finden">Spieler finden</a>
				</div>
			{/if}
		</div>

		<form method="POST" action="?/logout" class="logout-row">
			<button class="btn btn-ghost-light" type="submit">Abmelden</button>
		</form>
	</div>
</section>

<style>
	.profile-head {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.card {
		margin-top: 24px;
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.card.nudge {
		border-color: rgba(180, 113, 26, 0.3);
		background: rgba(180, 113, 26, 0.06);
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
		margin: 0 0 16px;
	}

	.facts {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin: 0;
	}

	.fact {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--line-light, rgba(0, 0, 0, 0.08));
	}

	.fact:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.fact dt {
		font-size: 13.5px;
		color: var(--muted-light);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.fact dd {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		color: var(--ink);
		text-align: right;
	}

	.priv {
		font-size: 10.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #8f5a15;
	}

	.fact dd.fill {
		flex: 1 1 220px;
	}

	.fill input {
		width: 100%;
		box-sizing: border-box;
		padding: 8px 14px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
		text-align: left;
	}

	.fill-hint {
		margin: 16px 0 0;
		font-size: 12.5px;
		color: var(--muted-light);
	}

	.field-err {
		margin: 8px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.ok {
		color: var(--court, #0f6e5c);
		font-weight: 600;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: center;
		flex: 1;
	}

	.stat-v {
		font-size: 20px;
		font-weight: 600;
	}

	.stat-l {
		font-size: 12px;
		color: var(--muted-light);
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
	}

	.logout-row {
		margin-top: 28px;
		text-align: center;
	}

	@media (max-width: 480px) {
		.fact {
			flex-direction: column;
			gap: 4px;
		}
		.fact dd {
			text-align: left;
		}
	}
</style>
