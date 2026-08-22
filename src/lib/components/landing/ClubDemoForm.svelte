<script lang="ts">
	// Getrennter Funnel für Vereine: eine Anfrage mit Entscheidungsbefugnis
	// ("wir wollen das ausprobieren"), keine Vormerkung wie die
	// Spieler-Warteliste (SignupForm.svelte) — deshalb eigenes Formular,
	// eigener Endpunkt, eigene Erfolgsmeldung.

	import { m } from '$lib/paraglide/messages.js';

	let clubName = $state('');
	let contactName = $state('');
	let email = $state('');
	let message = $state('');
	let busy = $state(false);
	let status = $state<'idle' | 'ok' | 'error'>('idle');
	let feedback = $state('');

	const VALID = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

	async function submit(event: SubmitEvent) {
		event.preventDefault();

		if (!clubName.trim() || !contactName.trim()) {
			status = 'error';
			feedback = m.demo_error_missing();
			return;
		}
		if (!VALID.test(email.trim())) {
			status = 'error';
			feedback = m.demo_error_email();
			return;
		}

		busy = true;
		status = 'idle';
		feedback = '';

		try {
			const res = await fetch('/api/club-demo', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					clubName: clubName.trim(),
					contactName: contactName.trim(),
					email: email.trim(),
					message: message.trim()
				})
			});
			const data = (await res.json().catch(() => ({}))) as { message?: string };

			if (!res.ok) {
				status = 'error';
				feedback = data.message || m.demo_error_generic();
				return;
			}

			status = 'ok';
			feedback = m.demo_success();
			clubName = '';
			contactName = '';
			email = '';
			message = '';
		} catch {
			status = 'error';
			feedback = m.demo_error_network();
		} finally {
			busy = false;
		}
	}
</script>

<form class="demo" onsubmit={submit} novalidate>
	<label for="demo-club">{m.demo_label_club()}</label>
	<input
		id="demo-club"
		name="clubName"
		type="text"
		autocomplete="organization"
		placeholder={m.demo_placeholder_club()}
		maxlength="120"
		bind:value={clubName}
		disabled={status === 'ok'}
		required
	/>

	<label for="demo-contact">{m.demo_label_contact()}</label>
	<input
		id="demo-contact"
		name="contactName"
		type="text"
		autocomplete="name"
		placeholder={m.demo_placeholder_contact()}
		maxlength="120"
		bind:value={contactName}
		disabled={status === 'ok'}
		required
	/>

	<label for="demo-email">{m.demo_label_email()}</label>
	<input
		id="demo-email"
		name="email"
		type="email"
		autocomplete="email"
		placeholder={m.demo_placeholder_email()}
		bind:value={email}
		disabled={status === 'ok'}
		aria-invalid={status === 'error'}
		aria-describedby="demo-msg"
		required
	/>

	<label for="demo-message">{m.demo_label_message()}</label>
	<textarea
		id="demo-message"
		name="message"
		rows="3"
		placeholder={m.demo_placeholder_message()}
		maxlength="2000"
		bind:value={message}
		disabled={status === 'ok'}></textarea>

	<button class="btn btn-primary" type="submit" disabled={busy || status === 'ok'}>
		{#if busy}{m.demo_sending()}{:else if status === 'ok'}{m.demo_sent()}{:else}{m.demo_submit()}{/if}
	</button>
</form>

<p id="demo-msg" class="demo-msg" class:err={status === 'error'} role="status" aria-live="polite">
	{feedback}
</p>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 440px;
	}
	.demo label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--muted-light);
		margin-bottom: -6px;
	}
	.demo input,
	.demo textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 12px 16px;
		border-radius: 14px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
		resize: vertical;
	}
	.demo input:disabled,
	.demo textarea:disabled {
		opacity: 0.6;
	}
	.demo button {
		margin-top: 6px;
		align-self: flex-start;
	}
	.demo-msg {
		margin-top: 12px;
		font-size: 13px;
		color: var(--court-deep, #0f6e5c);
		min-height: 1.4em;
	}
	.demo-msg.err {
		color: #a3341f;
	}
</style>
