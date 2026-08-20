<script lang="ts">
	// Gemeinsame Nav für die Landingpage und die neuen eigenständigen Routen
	// /rating und /vereine (Website-Audit Block 4) — vorher dreimal
	// dieselbe Nav-Markup, jetzt eine Stelle für Logo/Burger-Verhalten.

	let { links, brandHref = '/' }: { links: { href: string; label: string }[]; brandHref?: string } =
		$props();

	let menuOpen = $state(false);
	const close = () => (menuOpen = false);
</script>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href={brandHref} aria-label="PadelIndex Startseite">
			<svg viewBox="0 0 40 40" aria-hidden="true">
				<circle
					cx="20"
					cy="20"
					r="13"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-dasharray="63.7 81.68"
					stroke-linecap="round"
					transform="rotate(-90 20 20)"
					opacity=".9"
				/>
				<g fill="currentColor">
					<rect x="12.6" y="21.5" width="3" height="6" rx="1.5" />
					<rect x="18.5" y="17.5" width="3" height="10" rx="1.5" />
					<rect x="24.4" y="13.5" width="3" height="14" rx="1.5" />
				</g>
				<circle cx="7.2" cy="17.6" r="2.9" fill="currentColor" />
			</svg>
			<span>Padel<b>Index</b></span>
		</a>

		<div class="nav-links">
			{#each links as item (item.href)}
				<a href={item.href}>{item.label}</a>
			{/each}
		</div>

		<div class="nav-right">
			<a class="nav-login" href="/anmelden">Anmelden</a>
			<a class="btn btn-primary nav-cta" href="/#anmelden">Platz sichern</a>
			<button
				class="nav-burger"
				type="button"
				aria-expanded={menuOpen}
				aria-controls="nav-panel"
				aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class:x={menuOpen}></span>
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div class="nav-panel" id="nav-panel">
			<div class="wrap">
				{#each links as item (item.href)}
					<a href={item.href} onclick={close}>{item.label}</a>
				{/each}
				<a href="/anmelden" onclick={close}>Anmelden</a>
				<a class="btn btn-primary" href="/#anmelden" onclick={close}>Platz sichern</a>
			</div>
		</div>
	{/if}
</nav>
