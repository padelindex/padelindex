<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { createBrowserSupabase, readMagicLinkTokensFromHash } from '$lib/supabase-browser';
	import { abbreviateName } from '$lib/claim-match';
	import { parseLevelParam } from '$lib/level-estimator';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Kommt jemand vom Level-Schätzer (?levelschaetzung=X), füllen wir das
	// Feld nur vor, wenn noch keine eigene Selbsteinschätzung gespeichert
	// ist — eine bestehende Angabe wird nie überschrieben.
	const levelSuggestion = $derived(
		data.player && data.player.selfAssessedLevel === null
			? parseLevelParam(page.url.searchParams.get('levelschaetzung'))
			: null
	);

	// Kommt jemand frisch vom Anmelde-Link auf /liga/[slug] (?join_league=X),
	// heben wir die Liga-Karte kurz hervor statt den Beitritt automatisch
	// abzuschicken — der Klick auf "Auf die Warteliste" bleibt eine
	// bewusste Handlung.
	const highlightLeague = $derived(
		data.league?.slug === page.url.searchParams.get('join_league') && data.leagueRegistration === null
	);

	let emailBusy = $state(false);
	let confirmingId = $state<string | null>(null);
	let redeemingId = $state<string | null>(null);
	let profileBusy = $state(false);

	const unreadCount = $derived(data.notifications.filter((n) => n.readAt === null).length);

	const claimLabel: Record<'unclaimed' | 'pending' | 'awaiting_review' | 'claimed' | 'rejected', string> = {
		unclaimed: 'Nicht beansprucht',
		pending: 'Wird geprüft',
		awaiting_review: 'Wartet auf Freigabe',
		claimed: 'Bestätigt',
		rejected: 'Abgelehnt'
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
					Eingeloggt als {data.email}, aber kein Spielerprofil verknüpft. Falls du zuletzt versucht
					hast, ein Profil zu beanspruchen: dein Verein hat die Anfrage möglicherweise abgelehnt
					(z. B. weil der Name nicht eindeutig zugeordnet werden konnte) — wende dich an deine
					Vereinsleitung. Falls das hier unerwartet ist, melde dich bei uns.
				</p>
			</div>
		{:else}
			<div class="sec-head">
				<span class="eyebrow">Mein Konto</span>
				<h2>{data.player.displayName}</h2>
				<p class="muted">{data.email}</p>
			</div>

			{#if data.player.claimStatus === 'awaiting_review'}
				<p class="notice" role="status">
					Dein Profil wartet noch auf Freigabe durch deinen Verein — dein Verein bestätigt, dass du
					wirklich die Person hinter diesem Profil bist. Das kann etwas dauern.
				</p>
			{/if}

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

			<div class="action-row">
				{#if data.club}
					<a class="btn btn-primary" href="/c/{data.club.slug}/match/neu">Match melden</a>
					<a class="btn btn-ghost-light" href="/c/{data.club.slug}/roulette">Padel Roulette</a>
				{/if}
				{#if data.player.claimStatus === 'claimed'}
					<a class="btn btn-ghost-light" href="/p/{data.player.handle}">Mein öffentliches Profil</a>
				{/if}
				<a class="btn btn-ghost-light" href="/spieler-finden">Spieler finden</a>
				<a class="btn btn-ghost-light" href="/spielzeiten">Meine Spielzeiten</a>
				<a class="btn btn-ghost-light" href="/anfragen">Anfragen</a>
				<a class="btn btn-ghost-light" href="/challenges">Challenges</a>
				{#each data.adminClubs as ac (ac.id)}
					<a class="btn btn-ghost-light" href="/verein/{ac.slug}">Vereins-Admin · {ac.name}</a>
				{/each}
			</div>

			{#if data.notifications.length > 0}
				<div class="card">
					<div class="card-head">
						<h3 class="card-title" style="margin: 0">
							Benachrichtigungen
							{#if unreadCount > 0}<span class="unread-dot">{unreadCount}</span>{/if}
						</h3>
						{#if unreadCount > 0}
							<form method="POST" action="?/markNotificationsRead" use:enhance>
								<button class="btn btn-ghost-light" type="submit">Als gelesen markieren</button>
							</form>
						{/if}
					</div>
					<ul class="notifications">
						{#each data.notifications as n (n.id)}
							<li class:unread={n.readAt === null}>
								{#if n.link}
									<a href={n.link} class="n-title">{n.title}</a>
								{:else}
									<span class="n-title">{n.title}</span>
								{/if}
								{#if n.body}<span class="n-body">{n.body}</span>{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if data.league}
				<div class="card" id="liga" class:highlight={highlightLeague}>
					<h3 class="card-title">{data.league.name}</h3>

					{#if highlightLeague}
						<p class="notice" role="status">
							Fast geschafft — trag dich jetzt auf die Warteliste ein.
						</p>
					{/if}

					{#if form?.leagueError}
						<p class="err" role="alert">{form.leagueError}</p>
					{/if}
					{#if form?.leagueJoined}
						<p class="notice" role="status">
							Auf der Warteliste eingetragen — sobald ein Platz frei wird, meldet sich dein Verein.
						</p>
					{/if}
					{#if form?.leagueLeft}
						<p class="notice" role="status">Aus der Liga ausgetreten.</p>
					{/if}

					{#if data.leagueRegistration === null}
						<p class="muted" style="font-size: 13px">
							Du bist noch nicht dabei. Ein Platz in einer Box wird immer von eurem Vereins-Admin
							vergeben — die Anmeldung trägt dich erstmal auf die Warteliste ein.
						</p>
						<form method="POST" action="?/joinLeague" use:enhance>
							<button class="btn btn-primary" type="submit">Auf die Warteliste</button>
						</form>
					{:else if data.leagueRegistration === 'active'}
						<p class="muted" style="font-size: 13px">
							Du spielst aktuell in einer Box. Details und Ergebnismeldung unter
							<a href="/liga/{data.league.slug}">der Ligaseite</a>.
						</p>
						<form
							method="POST"
							action="?/leaveLeague"
							use:enhance={({ cancel }) => {
								if (!confirm('Wirklich aus der Liga austreten? Dein Box-Platz wird frei.')) {
									cancel();
								}
							}}
						>
							<button class="btn btn-ghost-light" type="submit">Aus der Liga austreten</button>
						</form>
					{:else if data.leagueRegistration === 'substitute'}
						<p class="muted" style="font-size: 13px">
							Du bist als Ersatzspieler:in eingetragen und spielst aktuell in einer Box. Details
							unter <a href="/liga/{data.league.slug}">der Ligaseite</a>.
						</p>
						<form method="POST" action="?/leaveLeague" use:enhance>
							<button class="btn btn-ghost-light" type="submit">Aus der Liga austreten</button>
						</form>
					{:else if data.leagueRegistration === 'waitlist'}
						<p class="muted" style="font-size: 13px">
							Du stehst auf der Warteliste — sobald ein Platz frei wird, meldet sich dein Verein.
						</p>
						<form method="POST" action="?/leaveLeague" use:enhance>
							<button class="btn btn-ghost-light" type="submit">Von der Warteliste austragen</button>
						</form>
					{:else if data.leagueRegistration === 'left'}
						<p class="muted" style="font-size: 13px">Du hattest die Liga verlassen.</p>
						<form method="POST" action="?/joinLeague" use:enhance>
							<button class="btn btn-primary" type="submit">Wieder auf die Warteliste</button>
						</form>
					{/if}
				</div>
			{/if}

			{#if data.challengeHinweis}
				<p class="err" role="alert">
					Match gemeldet, aber nicht mit der Challenge verknüpft: {data.challengeHinweis}
				</p>
			{/if}

			{#if data.pendingMatches.length > 0}
				<div class="card" id="ausstehend">
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

			{#if data.rewards.length > 0}
				<div class="card">
					<h3 class="card-title">Prämien einlösen</h3>
					<ul class="rewards">
						{#each data.rewards as r (r.id)}
							<li class="reward-row">
								<div class="reward-main">
									<span class="reward-title">{r.title}</span>
									{#if r.description}
										<span class="reward-desc">{r.description}</span>
									{/if}
								</div>
								<span class="reward-cost num">{r.cost}</span>
								<form
									method="POST"
									action="?/redeem"
									use:enhance={() => {
										redeemingId = r.id;
										return async ({ update }) => {
											await update();
											redeemingId = null;
										};
									}}
								>
									<input type="hidden" name="rewardId" value={r.id} />
									<button
										class="btn btn-ghost-light"
										type="submit"
										disabled={redeemingId === r.id || data.tokens.balance < r.cost}
										style="padding: 8px 16px; font-size: 13px"
									>
										{redeemingId === r.id ? 'Wird eingelöst…' : 'Einlösen'}
									</button>
								</form>
							</li>
						{/each}
					</ul>
					{#if form?.redeemError}
						<p class="err">{form.redeemError}</p>
					{/if}
					{#if form?.redeemed}
						<p class="ok" style="font-size: 13px; margin-top: 12px">Eingelöst — dein Verein meldet sich.</p>
					{/if}
				</div>
			{/if}

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
								<span class="hist-badge token-badge" class:token-out={tx.amount < 0}>
									{tx.amount > 0 ? '+' : '−'}{Math.abs(tx.amount)}
								</span>
								<span class="hist-main">
									<span class="hist-rating">
										{tx.kind === 'grant'
											? (tokenReasonLabel[tx.reason] ?? tx.reason)
											: `Eingelöst: ${tx.rewardTitle}`}
									</span>
								</span>
								<span class="hist-date">{formatDate(tx.createdAt)}</span>
							</li>
						{/each}
					</ol>
				{/if}
				<p class="muted" style="font-size: 12px; margin: 14px 0 0">
					Tokens sind ein Guthaben, kein Handelsgut: keine Übertragung, kein Verfall durch
					Niederlagen.
				</p>
			</div>

			<div class="card">
				<h3 class="card-title">Profil</h3>
				<p class="muted" style="font-size: 12.5px; margin: 0 0 14px">
					Freiwillige Angaben für dein öffentliches Profil. Die Selbsteinschätzung ist nur
					Zusatzinfo — dein Rating kommt ausschließlich aus bestätigten Matches.
				</p>
				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={() => {
						profileBusy = true;
						return async ({ update }) => {
							await update();
							profileBusy = false;
						};
					}}
				>
					<label class="field-label" for="city">Stadt</label>
					<input id="city" name="city" value={data.player.city ?? ''} placeholder="z. B. München" />

					<label class="field-label" for="playingHand">Spielhand</label>
					<select id="playingHand" name="playingHand">
						<option value="" selected={data.player.playingHand === null}>Keine Angabe</option>
						<option value="rechts" selected={data.player.playingHand === 'rechts'}>Rechtshänder</option>
						<option value="links" selected={data.player.playingHand === 'links'}>Linkshänder</option>
					</select>

					<label class="field-label" for="preferredSide">Bevorzugte Seite</label>
					<select id="preferredSide" name="preferredSide">
						<option value="" selected={data.player.preferredSide === null}>Keine Angabe</option>
						<option value="rechts" selected={data.player.preferredSide === 'rechts'}>Rechte Seite</option>
						<option value="links" selected={data.player.preferredSide === 'links'}>Linke Seite</option>
					</select>

					<label class="field-label" for="gender">Geschlecht</label>
					<select id="gender" name="gender">
						<option value="" selected={data.player.gender === null}>Keine Angabe</option>
						<option value="maennlich" selected={data.player.gender === 'maennlich'}>Männlich</option>
						<option value="weiblich" selected={data.player.gender === 'weiblich'}>Weiblich</option>
						<option value="divers" selected={data.player.gender === 'divers'}>Divers</option>
					</select>

					<label class="field-label" for="selfAssessedLevel">
						Selbsteinschätzung (0–7){#if data.player.selfAssessedLevel !== null}
							<span class="num">· {data.player.selfAssessedLevel.toFixed(1)}</span>
						{/if}
					</label>
					{#if levelSuggestion !== null}
						<p class="muted" style="font-size: 12px; margin: 6px 0 10px">
							Vorschlag aus deinem <a href="/level-schaetzen">Level-Schätzer</a>-Ergebnis: {levelSuggestion.toFixed(
								1
							)}. Übernommen, du kannst es unten noch anpassen.
						</p>
					{/if}
					<input
						id="selfAssessedLevel"
						name="selfAssessedLevel"
						type="number"
						min="0"
						max="7"
						step="0.5"
						value={data.player.selfAssessedLevel ?? levelSuggestion ?? ''}
						placeholder="ohne Angabe"
					/>

					{#if data.player.claimStatus === 'claimed'}
						<label class="field-label full-name-toggle" for="showFullName">
							<input
								id="showFullName"
								name="showFullName"
								type="checkbox"
								checked={data.player.showFullName}
							/>
							Meinen vollen Namen öffentlich zeigen (sonst z. B. „{abbreviateName(
								data.player.displayName
							)}")
						</label>
					{/if}

					<button class="btn btn-ghost-light" type="submit" disabled={profileBusy}>
						{profileBusy ? 'Wird gespeichert…' : 'Speichern'}
					</button>
				</form>
				{#if form?.profileSaved}
					<p class="ok" style="font-size: 13px; margin-top: 12px">Gespeichert.</p>
				{/if}
				{#if form?.profileError}
					<p class="err">{form.profileError}</p>
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
	.card.highlight {
		border-color: var(--court);
		box-shadow: 0 0 0 3px rgba(22, 163, 148, 0.16);
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

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
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

	.notice {
		margin: 20px 0 0;
		padding: 14px 18px;
		border-radius: 14px;
		background: rgba(15, 110, 92, 0.08);
		border: 1px solid rgba(15, 110, 92, 0.2);
		font-size: 13.5px;
		color: var(--muted-light);
	}

	.card-title {
		margin: 0 0 14px;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}

	.card-head button {
		padding: 7px 13px;
		font-size: 12.5px;
	}

	.unread-dot {
		display: inline-block;
		margin-left: 6px;
		min-width: 18px;
		padding: 1px 6px;
		border-radius: 100px;
		background: var(--court-deep, #0f6e5c);
		color: #fff;
		font-size: 11px;
		text-align: center;
	}

	.notifications {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.notifications li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 11px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.notifications li:first-child {
		border-top: none;
		padding-top: 0;
	}

	.notifications li.unread .n-title {
		font-weight: 600;
	}

	.n-title {
		font-size: 13.5px;
		color: var(--ink);
		text-decoration: none;
	}

	a.n-title:hover {
		text-decoration: underline;
	}

	.n-body {
		font-size: 12.5px;
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

	.token-badge.token-out {
		background: rgba(180, 113, 26, 0.12);
		color: #b4711a;
	}

	.rewards {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.reward-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 0;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.reward-row:first-child {
		border-top: none;
		padding-top: 0;
	}

	.reward-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.reward-title {
		font-size: 14px;
		font-weight: 600;
	}

	.reward-desc {
		font-size: 12.5px;
		color: var(--muted-light);
	}

	.reward-cost {
		flex-shrink: 0;
		font-size: 15px;
		font-weight: 600;
		color: var(--court-deep, #0f6e5c);
	}

	.reward-row form {
		flex-shrink: 0;
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

	.card input,
	.card select {
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

	.field-label {
		display: block;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--muted-light);
		margin: 14px 0 6px;
	}
	.field-label:first-of-type {
		margin-top: 0;
	}

	.full-name-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 400;
		font-size: 13px;
		color: var(--muted-dark);
		cursor: pointer;
	}

	.full-name-toggle input {
		width: auto;
		margin: 0;
		flex-shrink: 0;
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
