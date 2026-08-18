<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { createBrowserSupabase, readMagicLinkTokensFromHash } from '$lib/supabase-browser';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let emailBusy = $state(false);
	let confirmingId = $state<string | null>(null);

	const claimLabel: Record<'unclaimed' | 'pending' | 'claimed', string> = {
		unclaimed: 'Nicht beansprucht',
		pending: 'Wird geprüft',
		claimed: 'Bestätigt'
	};

	const reasonLabel: Record<string, string> = {
		seed: 'Start',
		match: 'Match',
		inactivity_decay: 'Inaktivität',
		manual_adjust: 'Anpassung'
	};

	const tokenReasonLabel: Record<string, string> = {
		match_played: 'Match gespielt',
		match_won: 'Sieg-Bonus',
		tournament: 'Vereinsliga / Turnier',
		milestone: 'Meilenstein',
		streak: 'Serie'
	};

	function historyBadge(entry: PageData['history'][number]) {
		if (entry.reason === 'match') {
			if (entry.factors.won === true) return 'Sieg';
			if (entry.factors.won === false) return 'Niederlage';
		}
		return reasonLabel[entry.reason] ?? entry.reason;
	}

	function historyDetail(entry: PageData['history'][number]) {
		if (entry.reason === 'seed') {
			const { league_rank, league_size, league, season } = entry.factors;
			if (league_rank && league_size) {
				return `Ligaposition #${league_rank} von ${league_size}${league ? ` · ${league}` : ''}${season ? ` ${season}` : ''}`;
			}
			return 'Startwert aus dem Fragebogen';
		}
		if (entry.reason === 'match' && typeof entry.factors.opponentAvgRating === 'number') {
			return `Gegner-Ø ${entry.factors.opponentAvgRating.toFixed(2)}`;
		}
		return '';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

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
						<span class="stat-v stat-tokens">{data.tokens.balance}</span>
						<span class="stat-l">Tokens</span>
					</span>
					<span class="stat">
						<span class="stat-v">{claimLabel[data.player.claimStatus]}</span>
						<span class="stat-l">Status</span>
					</span>
				</div>
			</div>

			{#if data.club}
				<a class="btn btn-primary" href="/c/{data.club.slug}/match/neu" style="margin-top: 20px">
					Match melden
				</a>
			{/if}

			{#if data.pendingMatches.length > 0}
				<div class="card">
					<h3 class="card-title">Ausstehende Matches</h3>
					<ol class="hist">
						{#each data.pendingMatches as m (m.id)}
							<li class="pending-row">
								<div class="pending-teams">
									<span class:me-team={m.myTeam === 1}>
										{m.team1.map((p) => p.name).join(' & ')}
									</span>
									<span class="vs">vs.</span>
									<span class:me-team={m.myTeam === 2}>
										{m.team2.map((p) => p.name).join(' & ')}
									</span>
								</div>
								<span class="pending-sets">
									{m.sets.map((s) => `${s.team1Games}:${s.team2Games}`).join(', ')}
								</span>
								<span class="pending-date">
									gemeldet für {formatDate(m.playedAt)} · Frist {formatDate(m.confirmDeadline)}
								</span>
								{#if m.canConfirm}
									<form
										method="POST"
										action="?/confirmMatch"
										use:enhance={() => {
											confirmingId = m.id;
											return async ({ update }) => {
												await update();
												confirmingId = null;
											};
										}}
									>
										<input type="hidden" name="matchId" value={m.id} />
										<button
											class="btn btn-primary"
											type="submit"
											disabled={confirmingId === m.id}
											style="margin-top: 10px; padding: 8px 16px; font-size: 13px"
										>
											{confirmingId === m.id ? 'Wird bestätigt…' : 'Ergebnis bestätigen'}
										</button>
									</form>
								{:else}
									<span class="pending-waiting">Warte auf Bestätigung der Gegenseite</span>
								{/if}
							</li>
						{/each}
					</ol>
					{#if form?.matchError}
						<p class="err">{form.matchError}</p>
					{/if}
				</div>
			{/if}

			<div class="card">
				<h3 class="card-title">Verlauf</h3>
				{#if data.history.length === 0}
					<p class="muted" style="font-size: 13px; margin: 0">
						Noch keine Einträge — der Verlauf füllt sich mit den ersten Matches.
					</p>
				{:else}
					<ol class="hist">
						{#each data.history as entry (entry.id)}
							<li class="hist-row">
								<span class="hist-badge" class:win={entry.factors.won === true}
									>{historyBadge(entry)}</span
								>
								<span class="hist-main">
									<span class="hist-rating">
										{entry.ratingBefore.toFixed(2)} → {entry.ratingAfter.toFixed(2)}
									</span>
									{#if historyDetail(entry)}
										<span class="hist-detail">{historyDetail(entry)}</span>
									{/if}
								</span>
								<span class="hist-date">{formatDate(entry.createdAt)}</span>
							</li>
						{/each}
					</ol>
				{/if}
			</div>

			<div class="card">
				<h3 class="card-title">Tokens</h3>
				{#if data.tokens.recent.length === 0}
					<p class="muted" style="font-size: 13px; margin: 0">
						Noch keine Tokens — die ersten gibt es mit deinem ersten bestätigten Match.
					</p>
				{:else}
					<ol class="hist">
						{#each data.tokens.recent as tx (tx.id)}
							<li class="hist-row">
								<span class="hist-badge token-badge">+{tx.amount}</span>
								<span class="hist-main">
									<span class="hist-rating">
										{tokenReasonLabel[tx.reason] ?? tx.reason}
									</span>
								</span>
								<span class="hist-date">{formatDate(tx.createdAt)}</span>
							</li>
						{/each}
					</ol>
					<p class="muted" style="font-size: 12px; margin: 14px 0 0">
						Einlösen bei deinem Verein kommt bald — Tokens sind ein Guthaben, kein Handelsgut:
						keine Übertragung, kein Verfall durch Niederlagen.
					</p>
				{/if}
			</div>

			<div class="card">
				<h3 class="card-title">E-Mail ändern</h3>
				<form
					method="POST"
					action="?/changeEmail"
					use:enhance={() => {
						emailBusy = true;
						return async ({ update }) => {
							await update();
							emailBusy = false;
						};
					}}
				>
					<input
						type="email"
						name="email"
						placeholder="neue@mail.de"
						autocomplete="email"
						required
					/>
					<button class="btn btn-ghost-light" type="submit" disabled={emailBusy}>
						{emailBusy ? 'Wird gesendet…' : 'Bestätigungslink senden'}
					</button>
				</form>
				{#if form?.emailSent}
					<p class="ok" style="font-size: 14px; margin-top: 12px">
						Bestätigungslink verschickt — prüfe dein Postfach (je nach Einstellung ggf. auch das der
						alten Adresse). Die Änderung greift erst nach der Bestätigung.
					</p>
				{/if}
				{#if form?.emailError}
					<p class="err">{form.emailError}</p>
				{/if}
			</div>

			<form method="POST" action="?/logout">
				<button class="btn btn-ghost-light" type="submit" style="margin-top: 20px">Abmelden</button>
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

	.stat-tokens {
		color: var(--court-deep, #0f6e5c);
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

	.card-title {
		margin: 0 0 14px;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	.hist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.hist-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.hist-badge {
		flex-shrink: 0;
		padding: 3px 9px;
		border-radius: 100px;
		font-size: 11px;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.06);
		color: var(--muted-light);
	}

	.hist-badge.win {
		background: rgba(15, 110, 92, 0.12);
		color: var(--court, #0f6e5c);
	}

	.token-badge {
		background: rgba(15, 110, 92, 0.12);
		color: var(--court-deep, #0f6e5c);
		font-family: var(--mono);
	}

	.hist-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.hist-rating {
		font-size: 14px;
		font-weight: 600;
	}

	.hist-detail {
		font-size: 12px;
		color: var(--muted-light);
	}

	.hist-date {
		flex-shrink: 0;
		font-size: 12px;
		color: var(--muted-light);
	}

	.card input {
		width: 100%;
		box-sizing: border-box;
		padding: 11px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
		margin-bottom: 10px;
	}

	.pending-row {
		padding: 14px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.pending-row:first-child {
		border-top: none;
		padding-top: 0;
	}

	.pending-teams {
		font-size: 14px;
		font-weight: 600;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: baseline;
	}

	.pending-teams .me-team {
		color: var(--court-deep, #0c6e64);
	}

	.pending-teams .vs {
		font-weight: 400;
		font-size: 12px;
		color: var(--muted-light);
	}

	.pending-sets {
		display: block;
		margin-top: 4px;
		font-size: 13px;
		font-family: var(--mono);
	}

	.pending-date,
	.pending-waiting {
		display: block;
		margin-top: 4px;
		font-size: 12px;
		color: var(--muted-light);
	}
</style>
