<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { createBrowserSupabase, readMagicLinkTokensFromHash } from '$lib/supabase-browser';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const claimLabel: Record<'unclaimed' | 'pending' | 'claimed', string> = {
		unclaimed: 'Nicht beansprucht',
		pending: 'Wird geprüft',
		claimed: 'Bestätigt'
	};

	// Supabases Standard-Mail-Templates verlinken auf ihren eigenen
	// /auth/v1/verify-Endpunkt, der nach Prüfung mit #access_token=...&
	// refresh_token=... hier landet. Fragmente gehen nie an den Server —
	// die Session muss deshalb im Browser übernommen werden (siehe
	// supabase-browser.ts). Synchron statt erst in onMount geprüft, damit
	// "Nicht eingeloggt" nicht kurz aufblitzt, bevor die Session steht.
	let establishingSession = $state(
		typeof window !== 'undefined' && readMagicLinkTokensFromHash(window.location.hash) !== null
	);
	let sessionError = $state(false);

	onMount(async () => {
		const tokens = readMagicLinkTokensFromHash(window.location.hash);
		if (!tokens) return;

		// Tokens sofort aus der URL tilgen — sollen nicht in der
		// Browser-History oder beim Teilen des Links landen.
		//
		// Bewusst die rohe History-API statt $app/navigation.replaceState():
		// die schlägt hier hart fehl ("Cannot call replaceState(...) before
		// router is initialized"), weil onMount auf dieser Seite früher
		// feuert als SvelteKits Router-Setup abschließt (live verifiziert).
		// Reine URL-Kosmetik, kein SvelteKit-Navigationsziel — das Fragment
		// spielt für SvelteKits Routing ohnehin keine Rolle.
		history.replaceState(null, '', window.location.pathname + window.location.search);

		if (!data.supabaseConfig) {
			establishingSession = false;
			sessionError = true;
			return;
		}

		const supabase = createBrowserSupabase(data.supabaseConfig.url, data.supabaseConfig.anonKey);

		// setSession() gibt bei einem kaputten/manipulierten Token nicht immer
		// { error } zurück, sondern kann auch werfen (z.B. beim Decodieren
		// eines fehlerhaften JWT) — ohne try/catch bliebe die Seite dann für
		// immer bei "Einen Moment…" hängen. Live mit einem absichtlich
		// kaputten Token verifiziert.
		let sessionOk = false;
		try {
			const { error } = await supabase.auth.setSession({
				access_token: tokens.accessToken,
				refresh_token: tokens.refreshToken
			});
			sessionOk = !error;
		} catch {
			sessionOk = false;
		}

		establishingSession = false;
		if (!sessionOk) {
			sessionError = true;
			return;
		}

		// Server neu abfragen — hooks.server.ts sieht jetzt das gesetzte Cookie.
		await invalidateAll();
	});
</script>

<svelte:head>
	<title>Mein Konto — PadelIndex</title>
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
		{#if establishingSession}
			<div class="sec-head">
				<h2>Einen Moment…</h2>
				<p class="muted">Anmeldung wird abgeschlossen.</p>
			</div>
		{:else if !data.email}
			<div class="sec-head">
				<h2>Nicht eingeloggt</h2>
				<p class="muted">
					Du bist gerade nicht angemeldet. Über die Vereinsseite kannst du dein Profil beanspruchen
					und bekommst einen Bestätigungslink per E-Mail.
				</p>
				{#if sessionError}
					<p class="err" role="status">
						Der Anmeldelink konnte nicht eingelöst werden — vermutlich abgelaufen. Fordere einen
						neuen an.
					</p>
				{/if}
			</div>
			<a class="btn btn-primary" href="/">Zur Startseite</a>
			<p class="muted" style="margin-top: 16px">
				Profil schon beansprucht? <a href="/anmelden">Hier anmelden</a>
			</p>
		{:else if !data.player}
			<div class="sec-head">
				<h2>Angemeldet</h2>
				<p class="muted">
					Eingeloggt als {data.email}, aber kein Spielerprofil verknüpft. Das sollte nicht passieren
					— melde dich bei uns, falls du das hier siehst.
				</p>
			</div>
		{:else}
			<div class="sec-head">
				<span class="eyebrow">Mein Konto</span>
				<h2>{data.player.displayName}</h2>
				<p class="muted">{data.email}</p>
			</div>

			<div class="card">
				<div class="stat-row">
					<span class="stat">
						<span class="stat-v">{data.player.rating.toFixed(2)}</span>
						<span class="stat-l">Rating</span>
					</span>
					<span class="stat">
						<span class="stat-v">{data.player.matchesPlayed}</span>
						<span class="stat-l">Matches</span>
					</span>
					<span class="stat">
						<span class="stat-v">{claimLabel[data.player.claimStatus]}</span>
						<span class="stat-l">Status</span>
					</span>
				</div>
			</div>

			<form method="POST" action="?/logout">
				<button class="btn btn-ghost" type="submit" style="margin-top: 20px">Abmelden</button>
			</form>
		{/if}
	</div>
</section>

<style>
	.card {
		margin-top: 28px;
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: center;
		flex: 1;
	}

	.stat-v {
		font-size: 22px;
		font-weight: 600;
	}

	.stat-l {
		font-size: 12px;
		color: var(--muted-light);
	}

	.err {
		margin: 16px 0 0;
		font-size: 13px;
		color: #a3341f;
	}
</style>
