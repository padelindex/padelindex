<script lang="ts">
	// Warteliste. Vorher lag das als DOM-Gefummel in landing-hero.ts —
	// als Komponente ist der Zustand (busy, Fehler, Erfolg) explizit und
	// die Meldung landet in einer aria-live-Region statt in einem
	// per getElementById gesuchten Absatz.
	//
	// Als echtes <form> gebaut: Enter im Feld sendet ab, ohne dass wir
	// dafür einen keydown-Handler brauchen.

	let email = $state('');
	let club = $state('');
	let busy = $state(false);
	let status = $state<'idle' | 'ok' | 'error'>('idle');
	let message = $state('');

	const VALID = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const value = email.trim();

		if (!VALID.test(value)) {
			status = 'error';
			message = 'Bitte eine gültige E-Mail-Adresse eingeben.';
			return;
		}

		busy = true;
		status = 'idle';
		message = '';

		try {
			const res = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: value, clubName: club.trim() })
			});
			const data = (await res.json().catch(() => ({}))) as { message?: string };

			if (!res.ok) {
				status = 'error';
				message = data.message || 'Konnte nicht eingetragen werden. Bitte später erneut versuchen.';
				return;
			}

			status = 'ok';
			message = 'Fast geschafft — wir haben dir einen Bestätigungslink geschickt.';
			email = '';
			club = '';
		} catch {
			status = 'error';
			message = 'Netzwerkfehler. Bitte später erneut versuchen.';
		} finally {
			busy = false;
		}
	}
</script>

<form class="signup" onsubmit={submit} novalidate>
	<label class="sr-only" for="waitlist-mail">E-Mail-Adresse</label>
	<input
		id="waitlist-mail"
		name="email"
		type="email"
		autocomplete="email"
		placeholder="deine@mail.de"
		bind:value={email}
		disabled={status === 'ok'}
		aria-invalid={status === 'error'}
		aria-describedby="waitlist-msg"
	/>
	<label class="sr-only" for="waitlist-club">Dein Verein (optional)</label>
	<input
		id="waitlist-club"
		name="clubName"
		type="text"
		autocomplete="organization"
		placeholder="Dein Verein (optional)"
		maxlength="120"
		bind:value={club}
		disabled={status === 'ok'}
	/>
	<button class="btn btn-primary" type="submit" disabled={busy || status === 'ok'}>
		{#if busy}Wird gesendet …{:else if status === 'ok'}Notiert{:else}Platz sichern{/if}
	</button>
</form>

<p
	id="waitlist-msg"
	class="signup-msg num"
	class:err={status === 'error'}
	role="status"
	aria-live="polite"
>
	{message}
</p>
<p class="signup-hint">
	Sag uns, welcher Verein — dann fragen wir ihn direkt an. Kein Spam, keine Weitergabe.
</p>

<style>
	.signup-msg.err {
		color: var(--signal);
	}
	.signup-hint {
		margin-top: 10px;
		font-size: 12.5px;
		color: var(--muted-dark);
	}
</style>
