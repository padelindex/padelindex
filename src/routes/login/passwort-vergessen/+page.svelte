<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);
</script>

<svelte:head>
	<title>Passwort vergessen — PadelIndex</title>
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
	<div class="wrap" style="max-width: 420px">
		<div class="sec-head">
			<h2>Passwort vergessen</h2>
			<p class="muted">Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.</p>
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
			<p class="ok">Link unterwegs.</p>
			<p class="note">
				Falls diese Adresse ein Konto hat, kommt jetzt eine E-Mail mit einem Link zum Zurücksetzen
				an.
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
				<label for="email">E-Mail-Adresse</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="deine@mail.de"
					required
				/>

				<button class="btn btn-primary" type="submit" disabled={busy}>
					{busy ? 'Wird gesendet…' : 'Link anfordern'}
				</button>

				{#if form?.message}
					<p class="err" role="alert">{form.message}</p>
				{/if}
			</form>
		{/if}

		<p class="switch">
			<a href="/login">Zurück zur Anmeldung</a>
		</p>
	</div>
</section>

<style>
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

	form button {
		margin-top: 24px;
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
	}

	.switch a {
		color: var(--court-deep, #0f6e5c);
		text-decoration: none;
	}

	.switch a:hover {
		text-decoration: underline;
	}
</style>
