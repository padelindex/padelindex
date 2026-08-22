<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);

	const v = $derived(form?.values);
</script>

<svelte:head>
	<title>Registrieren — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 480px">
		<div class="sec-head">
			<h2>Registrieren</h2>
			<p class="muted">Leg dein Spielerprofil an — mit echtem Namen, Verein und Passwort.</p>
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
				{#if form?.errors?.passwordRepeat}<p class="field-err">{form.errors.passwordRepeat}</p>{/if}

				<button class="btn btn-primary" type="submit" disabled={busy}>
					{busy ? 'Wird angelegt…' : 'Konto erstellen'}
				</button>

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
