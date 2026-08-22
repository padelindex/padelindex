<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const claimLabel: Record<string, string> = {
		unclaimed: 'Nicht beansprucht',
		pending: 'Wird geprüft',
		awaiting_review: 'Wartet auf Freigabe',
		claimed: 'Bestätigt',
		rejected: 'Abgelehnt'
	};

	const birthDateLabel = $derived(
		data.profile.birthDate
			? new Date(`${data.profile.birthDate}T12:00:00Z`).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				})
			: '—'
	);

	const fullName = $derived(
		[data.profile.firstName, data.profile.lastName].filter(Boolean).join(' ') ||
			data.profile.displayName
	);
</script>

<svelte:head>
	<title>Mein Profil — PadelIndex</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" aria-label="PadelIndex Startseite">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
		<a class="btn btn-ghost" href="/konto">Mein Konto</a>
	</div>
</nav>

<section class="sec sec-light">
	<div class="wrap" style="max-width: 640px">
		<div class="sec-head">
			<span class="eyebrow">Mein Profil</span>
			<h2>{fullName}</h2>
		</div>

		<div class="card">
			<h3 class="card-title">Persönliche Daten</h3>
			<dl class="facts">
				<div class="fact">
					<dt>Vorname</dt>
					<dd>{data.profile.firstName ?? '—'}</dd>
				</div>
				<div class="fact">
					<dt>Nachname</dt>
					<dd>{data.profile.lastName ?? '—'}</dd>
				</div>
				<div class="fact">
					<dt>Geburtsdatum <span class="priv">nur privat sichtbar</span></dt>
					<dd>{birthDateLabel}</dd>
				</div>
				<div class="fact">
					<dt>Verein</dt>
					<dd>{data.profile.clubName ?? '—'}</dd>
				</div>
				<div class="fact">
					<dt>E-Mail</dt>
					<dd>{data.email ?? '—'}</dd>
				</div>
			</dl>
		</div>

		<div class="card">
			<h3 class="card-title">Ranking</h3>
			<div class="stat-row">
				<div class="stat">
					<span class="stat-v">{data.profile.rating.toFixed(2)}</span>
					<span class="stat-l">Rating{data.profile.isProvisional ? ' (vorläufig)' : ''}</span>
				</div>
				<div class="stat">
					<span class="stat-v">{data.profile.matchesPlayed}</span>
					<span class="stat-l">Matches</span>
				</div>
				<div class="stat">
					<span class="stat-v"
						>{claimLabel[data.profile.claimStatus] ?? data.profile.claimStatus}</span
					>
					<span class="stat-l">Status</span>
				</div>
			</div>
			<div class="action-row">
				<a class="btn btn-ghost-light" href="/p/{data.profile.handle}">Öffentliches Profil</a>
				<a class="btn btn-ghost-light" href="/konto">Zum Konto</a>
			</div>
		</div>

		<form method="POST" action="?/logout" class="logout-row">
			<button class="btn btn-ghost-light" type="submit">Abmelden</button>
		</form>
	</div>
</section>

<style>
	.card {
		margin-top: 24px;
		padding: 22px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.6);
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-light);
		margin: 0 0 16px;
	}

	.facts {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin: 0;
	}

	.fact {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--line-light, rgba(0, 0, 0, 0.08));
	}

	.fact:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.fact dt {
		font-size: 13.5px;
		color: var(--muted-light);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.fact dd {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		color: var(--ink);
		text-align: right;
	}

	.priv {
		font-size: 10.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #b4711a;
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
		font-size: 20px;
		font-weight: 600;
	}

	.stat-l {
		font-size: 12px;
		color: var(--muted-light);
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
	}

	.logout-row {
		margin-top: 28px;
		text-align: center;
	}

	@media (max-width: 480px) {
		.fact {
			flex-direction: column;
			gap: 4px;
		}
		.fact dd {
			text-align: left;
		}
	}
</style>
