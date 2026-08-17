<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const claimLabel: Record<'unclaimed' | 'pending' | 'claimed', string> = {
		unclaimed: 'Nicht beansprucht',
		pending: 'Wird geprüft',
		claimed: 'Bestätigt'
	};
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
		{#if !data.email}
			<div class="sec-head">
				<h2>Nicht eingeloggt</h2>
				<p class="muted">
					Du bist gerade nicht angemeldet. Über die Vereinsseite kannst du dein Profil beanspruchen
					und bekommst einen Bestätigungslink per E-Mail.
				</p>
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
</style>
