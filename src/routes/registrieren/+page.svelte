<script lang="ts">
	import { enhance } from '$app/forms';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);

	const v = $derived(form?.values);
	const candidates = $derived(form?.candidates ?? []);
	const showingDiscovery = $derived(candidates.length > 0);
</script>

<svelte:head>
	<title>Registrieren — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav />

<section class="sec sec-light">
	<div class="wrap" style="max-width: 480px">
		<div class="sec-head">
			{#if showingDiscovery}
				<h1>Ist das dein Profil?</h1>
				<p class="muted">
					Wir haben bereits bestehende, noch nicht beanspruchte Profile mit ähnlichem Namen
					gefunden.
				</p>
			{:else}
				<h1>Registrieren</h1>
				<p class="muted">Leg dein Spielerprofil an — mit echtem Namen, Verein und Passwort.</p>
			{/if}
		</div>

		{#if data.alreadyLoggedIn}
			<p class="ok">Du bist bereits angemeldet.</p>
			<a
				class="btn btn-primary"
				href="/spieler/mein-profil"
				style="margin-top: 16px; display: inline-block"
			>
				Zu meinem Profil
			</a>
		{:else if form?.sent}
			<p class="ok">Fast geschafft.</p>
			<p class="note">
				Falls diese Adresse noch kein Konto hat, kommt jetzt eine E-Mail mit einem Bestätigungslink
				an. Erst nach der Bestätigung kannst du dich anmelden.
			</p>
			<p class="note">
				Danach kannst du in deinem Profil festlegen, wann du Zeit zum Spielen hast — damit dich
				andere Spieler finden können.
			</p>
		{:else}
			<form
				method="POST"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update();
						busy = false;
					};
				}}
			>
				{#if showingDiscovery}
					<ul class="candidates">
						{#each candidates as c (c.id)}
							<li class="candidate">
								<div class="candidate-info">
									<span class="candidate-name">{c.name}</span>
									<span class="muted"
										>{c.clubName} · {c.matches} Matches · Index {c.rating.toFixed(2)}</span
									>
								</div>
								<button
									class="btn btn-primary"
									type="submit"
									name="duplicateChoice"
									value={c.id}
									disabled={busy}
								>
									Ja, das ist mein Profil
								</button>
							</li>
						{/each}
					</ul>
					<button
						class="btn btn-ghost-light"
						type="submit"
						name="duplicateChoice"
						value="skip"
						disabled={busy}
						style="margin-top: 14px; width: 100%"
					>
						Nein, ein neues Profil anlegen
					</button>
				{/if}

				<div hidden={showingDiscovery}>
					<div class="row-2">
						<div>
							<label for="firstName">Vorname</label>
							<input
								id="firstName"
								name="firstName"
								type="text"
								autocomplete="given-name"
								value={v?.firstName ?? ''}
								required
							/>
							{#if form?.errors?.firstName}<p class="field-err">{form.errors.firstName}</p>{/if}
						</div>
						<div>
							<label for="lastName">Nachname</label>
							<input
								id="lastName"
								name="lastName"
								type="text"
								autocomplete="family-name"
								value={v?.lastName ?? ''}
								required
							/>
							{#if form?.errors?.lastName}<p class="field-err">{form.errors.lastName}</p>{/if}
						</div>
					</div>

					<label for="birthDate">Geburtsdatum</label>
					<input
						id="birthDate"
						name="birthDate"
						type="date"
						autocomplete="bday"
						value={v?.birthDate ?? ''}
						required
					/>
					<p class="field-hint">Bleibt privat — wird nie öffentlich angezeigt.</p>
					{#if form?.errors?.birthDate}<p class="field-err">{form.errors.birthDate}</p>{/if}

					<label for="clubName">Verein</label>
					<input
						id="clubName"
						name="clubName"
						type="text"
						autocomplete="organization"
						placeholder="z. B. STC Oberland"
						value={v?.clubName ?? ''}
						required
					/>
					{#if form?.errors?.clubName}<p class="field-err">{form.errors.clubName}</p>{/if}

					<label for="email">E-Mail-Adresse</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="deine@mail.de"
						value={v?.email ?? ''}
						required
					/>
					{#if form?.errors?.email}<p class="field-err">{form.errors.email}</p>{/if}

					<label for="password">Passwort</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						minlength="8"
						required
					/>
					{#if form?.errors?.password}<p class="field-err">{form.errors.password}</p>{/if}

					<label for="passwordRepeat">Passwort wiederholen</label>
					<input
						id="passwordRepeat"
						name="passwordRepeat"
						type="password"
						autocomplete="new-password"
					/>
					{#if form?.errors?.passwordRepeat}<p class="field-err">
							{form.errors.passwordRepeat}
						</p>{/if}

					<button class="btn btn-primary" type="submit" disabled={busy}>
						{busy ? 'Wird angelegt…' : 'Konto erstellen'}
					</button>

					<p class="terms-note">
						Mit „Konto erstellen“ akzeptierst du unsere
						<a href="/nutzungsbedingungen">Nutzungsbedingungen</a>
						und <a href="/datenschutz">Datenschutzerklärung</a>.
					</p>
				</div>

				{#if form?.message}
					<p class="err" role="alert">{form.message}</p>
				{/if}
			</form>

			<p class="switch">
				Schon registriert? <a href="/login">Anmelden</a>
			</p>
		{/if}
	</div>
</section>

<style>
	.candidates {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.candidate {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 14px 18px;
		border-radius: 16px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
	}

	.candidate-info {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.candidate-name {
		font-weight: 600;
		font-size: 14.5px;
	}

	/* Überschreibt die generische "form button"-Regel weiter unten (margin-top
	   28px, width 100%) — die ist für den einzelnen Absende-Button unter den
	   Feldern gedacht, nicht für die Buttons in dieser Zeile. */
	.candidate button {
		margin-top: 0;
		width: auto;
		flex-shrink: 0;
	}

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}

	label {
		display: block;
		font-size: 13px;
		margin-bottom: 8px;
		margin-top: 20px;
		color: var(--muted-light);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		padding: 13px 18px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 15px;
	}

	.field-hint {
		margin: 6px 0 0;
		font-size: 12px;
		color: var(--muted-light);
	}

	.field-err {
		margin: 6px 0 0;
		font-size: 12.5px;
		color: #a3341f;
	}

	form button {
		margin-top: 28px;
		width: 100%;
	}

	.ok {
		margin: 24px 0 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--court, #0f6e5c);
	}

	.note {
		margin: 8px 0 0;
		font-size: 13px;
		color: var(--muted-light);
	}

	.terms-note {
		margin: 14px 0 0;
		font-size: 12px;
		text-align: center;
		color: var(--muted-light);
	}

	.terms-note a {
		color: inherit;
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.switch {
		margin-top: 24px;
		text-align: center;
		font-size: 13.5px;
		color: var(--muted-light);
	}

	.switch a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
	}

	.switch a:hover {
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.row-2 {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}
</style>
