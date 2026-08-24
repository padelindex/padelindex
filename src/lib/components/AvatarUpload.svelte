<script lang="ts">
	// Profilbild-Upload: klickbarer Avatar (oder "Foto ändern"-Button) öffnet
	// ein verstecktes <input type="file">. Läuft komplett clientseitig über
	// den cookie-gebundenen Browser-Client, weil sowohl der Storage-Upload
	// als auch das Schreiben von players.avatar_url per RLS an auth.uid()
	// hängen (siehe supabase/migrations/0020_avatar_upload.sql) — ein
	// Server-Roundtrip würde hier nichts zusätzlich absichern.
	//
	// Vor dem Upload wird clientseitig komprimiert (compressImage(), Canvas
	// + toBlob(), siehe image-compression.ts) — Handyfotos kommen oft mit
	// 5-15MB rein, hochgeladen wird nur das auf max. 1024px verkleinerte,
	// auf ~500KB komprimierte Ergebnis. Deshalb keine strenge Größenprüfung
	// mehr auf die Originaldatei, nur eine großzügige Obergrenze gegen
	// pathologische Uploads.
	//
	// Fester Dateiname pro User ({userId}/profile.<ext>) plus Cache-Busting
	// über ?v=timestamp in der gespeicherten URL. compressImage() kodiert
	// abhängig von der Browser-Unterstützung mal WebP, mal JPEG — das
	// Aufräumen danach entfernt die jeweils andere, dadurch verwaiste Datei
	// best-effort, ohne den Upload selbst davon abhängig zu machen.
	import { createBrowserSupabase } from '$lib/supabase-browser';
	import { compressImage } from '$lib/image-compression';
	import AvatarCircle from './AvatarCircle.svelte';

	let {
		userId,
		displayName,
		avatarUrl = $bindable(null),
		supabaseConfig,
		size = 96
	}: {
		userId: string;
		displayName: string;
		avatarUrl?: string | null;
		supabaseConfig: { url: string; anonKey: string } | null;
		size?: number;
	} = $props();

	const MAX_INPUT_BYTES = 25 * 1024 * 1024;

	let fileInput: HTMLInputElement | undefined = $state();
	let stage = $state<'idle' | 'compressing' | 'uploading'>('idle');
	let error = $state('');

	const busy = $derived(stage !== 'idle');
	const statusLabel = $derived(
		stage === 'compressing'
			? 'Bild wird optimiert…'
			: stage === 'uploading'
				? 'Wird hochgeladen…'
				: 'Foto ändern'
	);

	function pick() {
		error = '';
		fileInput?.click();
	}

	async function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = ''; // erlaubt erneutes Auswählen derselben Datei

		if (!file) return;
		error = '';

		if (!file.type.startsWith('image/')) {
			error = 'Bitte eine Bilddatei auswählen.';
			return;
		}
		if (file.size > MAX_INPUT_BYTES) {
			error = 'Datei zu groß — maximal 25 MB.';
			return;
		}
		if (!supabaseConfig) {
			error = 'Upload gerade nicht verfügbar.';
			return;
		}

		try {
			stage = 'compressing';
			const { blob, ext } = await compressImage(file);

			stage = 'uploading';
			const supabase = createBrowserSupabase(supabaseConfig.url, supabaseConfig.anonKey);
			const path = `${userId}/profile.${ext}`;

			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: '3600' });
			if (uploadError) {
				error = 'Upload fehlgeschlagen — bitte erneut versuchen.';
				return;
			}

			// Best-effort: verwaiste Dateien unter anderer Extension entfernen.
			// Schlägt das fehl, bleibt der eigentliche Upload trotzdem gültig.
			try {
				const { data: existing } = await supabase.storage.from('avatars').list(userId);
				const stale = (existing ?? [])
					.filter((f) => f.name !== `profile.${ext}`)
					.map((f) => `${userId}/${f.name}`);
				if (stale.length > 0) {
					await supabase.storage.from('avatars').remove(stale);
				}
			} catch {
				// nicht kritisch
			}

			const {
				data: { publicUrl }
			} = supabase.storage.from('avatars').getPublicUrl(path);
			const bustedUrl = `${publicUrl}?v=${Date.now()}`;

			const { error: dbError } = await supabase
				.from('players')
				.update({ avatar_url: bustedUrl })
				.eq('user_id', userId);
			if (dbError) {
				error = 'Foto gespeichert, aber Profil konnte nicht aktualisiert werden.';
				return;
			}

			avatarUrl = bustedUrl;
		} catch (e) {
			error =
				e instanceof Error && e.message === 'decode-failed'
					? 'Bild konnte nicht gelesen werden — bitte ein anderes Foto wählen.'
					: 'Upload fehlgeschlagen — bitte erneut versuchen.';
		} finally {
			stage = 'idle';
		}
	}
</script>

<div class="avatar-upload">
	<button
		type="button"
		class="avatar-btn"
		onclick={pick}
		disabled={busy}
		aria-label="Profilbild ändern"
		style="--size: {size}px"
	>
		<AvatarCircle {avatarUrl} name={displayName} {size} />
		{#if busy}
			<span class="spinner" aria-hidden="true"></span>
		{/if}
	</button>

	<div class="avatar-meta">
		<button type="button" class="btn btn-ghost-light avatar-cta" onclick={pick} disabled={busy}>
			{statusLabel}
		</button>
		<p class="avatar-hint">Jedes Foto geht — wird automatisch auf max. 500 KB komprimiert.</p>
		{#if error}
			<p class="avatar-error" role="alert">{error}</p>
		{/if}
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="sr-only"
		onchange={onFileChange}
	/>
</div>

<style>
	.avatar-upload {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.avatar-btn {
		position: relative;
		padding: 0;
		border: 0;
		background: transparent;
		border-radius: 50%;
		cursor: pointer;
		width: var(--size);
		height: var(--size);
		flex-shrink: 0;
	}

	.avatar-btn:disabled {
		cursor: not-allowed;
	}

	.avatar-btn:focus-visible {
		outline: 2px solid var(--court);
		outline-offset: 3px;
	}

	.spinner {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgba(11, 30, 38, 0.45);
		display: grid;
		place-items: center;
	}

	.spinner::after {
		content: '';
		width: 28%;
		height: 28%;
		border: 2.5px solid rgba(255, 255, 255, 0.35);
		border-top-color: #fff;
		border-radius: 50%;
		animation: avatar-spin 0.8s linear infinite;
	}

	@keyframes avatar-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.avatar-meta {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.avatar-cta {
		align-self: flex-start;
		padding: 8px 16px;
		font-size: 13px;
	}

	.avatar-hint {
		margin: 0;
		font-size: 12px;
		color: var(--muted-light);
	}

	.avatar-error {
		margin: 0;
		font-size: 12.5px;
		color: #a3341f;
	}
</style>
