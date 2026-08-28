<script lang="ts">
	import { enhance } from '$app/forms';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);
	let resendBusy = $state(false);
</script>

<svelte:head>
	<title>Anmelden — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav />

<section class="sec sec-light">
	<div class="wrap" style="max-width: 420px">
		<div class="sec-head">
			<h2>Anmelden</h2>
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
		{:else if form?.resent}
			<p class="ok">Link unterwegs.</p>
			<p class="note">
				Falls diese Adresse ein unbestätigtes Konto hat, kommt jetzt eine neue Bestätigungs-E-Mail
				an.
			</p>
		{:else}
			<form
				method="POST"
				action="?/login"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						// reset:false — sonst leert SvelteKits Standardverhalten das
						// Passwortfeld (kein value-Attribut) bei jedem fehlgeschlagenen
						// Login-Versuch, obwohl der Nutzer es gerade richtig eingegeben
						// haben könnte (z.B. bei "E-Mail noch nicht bestätigt").
						await update({ reset: false });
						busy = false;
					};
				}}
			>
				<input type="hidden" name="next" value={data.next} />

				<label for="email">E-Mail-Adresse</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="deine@mail.de"
					required
				/>

				<label for="password">Passwort</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>

				<button class="btn btn-primary" type="submit" disabled={busy}>
					{busy ? 'Wird geprüft…' : 'Anmelden'}
				</button>

				{#if form?.message}
					<p class="err" role="alert">{form.message}</p>
				{/if}
			</form>

			{#if form?.unconfirmedEmail}
				<form
					method="POST"
					action="?/resend"
					use:enhance={() => {
						resendBusy = true;
						return async ({ update }) => {
							await update();
							resendBusy = false;
						};
					}}
				>
					<input type="hidden" name="email" value={form.unconfirmedEmail} />
					<button class="btn btn-ghost-light resend-btn" type="submit" disabled={resendBusy}>
						{resendBusy ? 'Wird gesendet…' : 'Bestätigungslink erneut senden'}
					</button>
				</form>
			{/if}

			<p class="links">
				<a href="/login/passwort-vergessen">Passwort vergessen?</a>
			</p>
			<p class="switch">
				Noch kein Konto? <a href="/registrieren">Registrieren</a>
			</p>
			<p class="switch alt">
				Profil per Link beansprucht, aber noch kein Passwort?
				<a href="/anmelden">Anmeldelink per E-Mail anfordern</a>
			</p>
		{/if}
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

	.resend-btn {
		margin-top: 14px;
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

	.links {
		margin-top: 18px;
		text-align: center;
		font-size: 13.5px;
	}

	.links a {
		color: var(--court-deep, #0f6e5c);
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

	.switch {
		margin-top: 14px;
		text-align: center;
		font-size: 13.5px;
		color: var(--muted-light);
	}

	.switch.alt {
		margin-top: 22px;
		padding-top: 18px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		font-size: 12.5px;
	}

	.switch a {
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		text-decoration: none;
	}

	.switch a:hover {
		text-decoration: underline;
	}
</style>
