<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);
</script>

<svelte:head>
	<title>Profil nicht mehr listen — PadelIndex</title>
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
			<h2>Ich möchte hier nicht gelistet sein</h2>
			<p class="muted">
				Kein Konto nötig. Wir schicken dir einen Bestätigungslink per E-Mail — sobald du ihn
				anklickst, verschwindet das Profil sofort aus der öffentlichen Rangliste.
			</p>
		</div>

		{#if form?.sent}
			<p class="ok">Link unterwegs.</p>
			<p class="note">
				Falls es dieses Profil gibt, kommt gleich eine E-Mail mit einem Bestätigungslink an.
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
				<label for="handle">Profil-Name (aus dem Link zu deinem Profil)</label>
				<input
					id="handle"
					name="handle"
					value={form?.handle ?? data.handle}
					placeholder="z. B. robin-kaiser"
					required
				/>

				<label for="email">Deine E-Mail-Adresse</label>
				<input
					id="email"
					name="email"
					type="email"
					placeholder="deine@mail.de"
					autocomplete="email"
					required
				/>

				<button class="btn btn-primary" type="submit" disabled={busy}>
					{busy ? 'Wird gesendet…' : 'Bestätigungslink senden'}
				</button>
			</form>
			{#if form?.error}
				<p class="err" role="alert">{form.error}</p>
			{/if}
		{/if}
	</div>
</section>

<style>
	label {
		display: block;
		font-size: 13px;
		margin-bottom: 8px;
		margin-top: 24px;
		color: var(--muted-light);
	}
	label:first-of-type {
		margin-top: 0;
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
		margin-top: 20px;
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
</style>
