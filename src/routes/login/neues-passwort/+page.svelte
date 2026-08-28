<script lang="ts">
	import { enhance } from '$app/forms';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);
</script>

<svelte:head>
	<title>Neues Passwort — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MinimalNav />

<section class="sec sec-light">
	<div class="wrap" style="max-width: 420px">
		<div class="sec-head">
			<h2>Neues Passwort</h2>
		</div>

		{#if !data.hasRecoverySession}
			<p class="muted" style="margin-top: 16px">
				Dieser Link ist ungültig oder abgelaufen. Fordere einen neuen an.
			</p>
			<a
				class="btn btn-primary"
				href="/login/passwort-vergessen"
				style="margin-top: 16px; display: inline-block"
			>
				Neuen Link anfordern
			</a>
		{:else}
			<form
				method="POST"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						// reset:false — sonst leert SvelteKits Standardverhalten beide
						// Passwortfelder (kein value-Attribut) bei jedem Fehler, etwa
						// wenn die beiden Eingaben nicht übereinstimmen.
						await update({ reset: false });
						busy = false;
					};
				}}
			>
				<label for="password">Neues Passwort</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					minlength="8"
					required
				/>

				<label for="passwordRepeat">Passwort wiederholen</label>
				<input
					id="passwordRepeat"
					name="passwordRepeat"
					type="password"
					autocomplete="new-password"
					required
				/>

				<button class="btn btn-primary" type="submit" disabled={busy}>
					{busy ? 'Wird gespeichert…' : 'Passwort speichern'}
				</button>

				{#if form?.message}
					<p class="err" role="alert">{form.message}</p>
				{/if}
			</form>
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

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}
</style>
