<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Profile = { handle: string; name: string; rating: number; matches: number };

	let step = $state<'name' | 'confirm' | 'done'>('name');
	let name = $state('');
	let email = $state('');
	let profile = $state<Profile | null>(null);
	let msg = $state('');
	let busy = $state(false);

	async function lookup() {
		msg = '';
		busy = true;
		try {
			const res = await fetch('/api/claim/lookup', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ slug: data.club?.slug, name })
			});
			const body = await res.json();
			if (!res.ok) {
				msg = body.message ?? 'Das hat nicht geklappt.';
				return;
			}
			if (!body.found) {
				msg = body.message;
				return;
			}
			profile = body.profile;
			step = 'confirm';
		} catch {
			msg = 'Verbindung fehlgeschlagen. Bitte später erneut versuchen.';
		} finally {
			busy = false;
		}
	}

	async function claim() {
		msg = '';
		busy = true;
		try {
			const res = await fetch('/api/claim', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ slug: data.club?.slug, handle: profile?.handle, email })
			});
			const body = await res.json();
			if (!res.ok) {
				msg = body.message ?? 'Das hat nicht geklappt.';
				return;
			}
			step = 'done';
		} catch {
			msg = 'Verbindung fehlgeschlagen. Bitte später erneut versuchen.';
		} finally {
			busy = false;
		}
	}

	function restart() {
		step = 'name';
		profile = null;
		msg = '';
	}
</script>

<svelte:head>
	<title>Profil beanspruchen — {data.club?.name ?? 'Verein'} — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		<a class="btn btn-ghost" href="/c/{data.club?.slug ?? ''}">Zum Ranking</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 560px">
		<div class="sec-head">
			<span class="eyebrow">{data.club?.name ?? 'Verein'}</span>
			<h2>Dein Profil beanspruchen</h2>
			<p class="muted">
				Du stehst schon in der Ligatabelle? Dann leg kein neues Profil an — übernimm dein
				bestehendes samt Rating und Matchhistorie.
			</p>
		</div>

		<div class="card">
			{#if data.unavailable}
				<p class="note">Supabase ist noch nicht verbunden.</p>
			{:else if step === 'name'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						lookup();
					}}
				>
					<label for="nm">Dein Name, wie er in der Ligatabelle steht</label>
					<input
						id="nm"
						type="text"
						bind:value={name}
						placeholder="Vor- und Nachname"
						autocomplete="name"
						required
					/>
					<button class="btn btn-primary" type="submit" disabled={busy || name.trim().length < 4}>
						{busy ? 'Suche…' : 'Profil suchen'}
					</button>
				</form>
			{:else if step === 'confirm' && profile}
				<div class="hit">
					<span class="hit-name">{profile.name}</span>
					<span class="hit-meta">
						Rating {profile.rating.toFixed(2)} · {profile.matches} Matches
					</span>
				</div>
				<p class="note">
					Wir schicken dir einen Bestätigungslink. Erst wenn du ihn öffnest, gehört das Profil dir.
				</p>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						claim();
					}}
				>
					<label for="em">Deine E-Mail-Adresse</label>
					<input
						id="em"
						type="email"
						bind:value={email}
						placeholder="deine@mail.de"
						autocomplete="email"
						required
					/>
					<button class="btn btn-primary" type="submit" disabled={busy}>
						{busy ? 'Wird gesendet…' : 'Bestätigungslink anfordern'}
					</button>
				</form>
				<button class="link" type="button" onclick={restart}>Das bin ich nicht</button>
			{:else if step === 'done'}
				<p class="ok">Link unterwegs.</p>
				<p class="note">
					Wir haben dir eine E-Mail geschickt. Öffne den Link darin, dann ist das Profil deins — mit
					allen bisherigen Ergebnissen.
				</p>
			{/if}

			{#if msg}
				<p class="err" role="status">{msg}</p>
			{/if}
		</div>

		<p class="foot-note">
			Name nicht gefunden oder falsches Profil zugeordnet? Melde dich bei deiner Vereinsleitung —
			sie kann die Zuordnung von Hand vornehmen.
		</p>
	</div>
</section>

<style>
	.card {
		margin-top: 32px;
		padding: 26px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	label {
		display: block;
		font-size: 13px;
		margin-bottom: 8px;
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
		margin-top: 14px;
		width: 100%;
	}

	.hit {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 16px 18px;
		border-radius: 14px;
		background: rgba(15, 110, 92, 0.08);
		border: 1px solid rgba(15, 110, 92, 0.2);
	}

	.hit-name {
		font-size: 18px;
		font-weight: 600;
	}

	.hit-meta,
	.note,
	.foot-note {
		font-size: 13px;
		color: var(--muted-light);
	}

	.note {
		margin: 16px 0;
	}

	.foot-note {
		margin-top: 20px;
	}

	.ok {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--court, #0f6e5c);
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}

	.link {
		margin-top: 14px;
		background: none;
		border: 0;
		padding: 0;
		font-size: 13px;
		color: var(--muted-light);
		text-decoration: underline;
		cursor: pointer;
	}
</style>
