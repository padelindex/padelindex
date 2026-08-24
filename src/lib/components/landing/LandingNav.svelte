<script lang="ts">
	// Gemeinsame Nav für die Landingpage und die neuen eigenständigen Routen
	// /rating und /vereine (Website-Audit Block 4) — vorher dreimal
	// dieselbe Nav-Markup, jetzt eine Stelle für Logo/Burger-Verhalten.
	//
	// HeaderTicker sitzt hier statt in jeder Route einzeln: eine
	// Einbaustelle erreicht automatisch alle 18 Seiten, die LandingNav
	// schon verwenden. Die Nav selbst muss dafür ihren sticky-Versatz
	// kennen — 34px (Tickerhöhe) statt 0, sobald der Ticker Inhalte zeigt,
	// sonst bliebe bei ausgeblendetem Ticker eine leere Lücke stehen.

	import { page } from '$app/state';
	import HeaderTicker from '$lib/components/HeaderTicker.svelte';
	import { ctaHref } from '$lib/landing/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { links, brandHref = '/' }: { links: { href: string; label: string }[]; brandHref?: string } =
		$props();

	const cta = $derived(ctaHref(page.data.loggedIn));

	let menuOpen = $state(false);
	const close = () => (menuOpen = false);

	let tickerVisible = $state(false);

	// brandHref kommt entweder als seitenrelativer Pfad (Standard "/") oder
	// als Anker auf der aktuellen Seite selbst (Homepage übergibt "#top") —
	// nur der Pfad-Fall braucht localizeHref(), ein reiner Anker bleibt
	// unangetastet.
	const localizedBrandHref = $derived(
		brandHref.startsWith('#') ? brandHref : localizeHref(brandHref)
	);
</script>

<HeaderTicker onVisibleChange={(visible) => (tickerVisible = visible)} />

<nav class="nav" style="top: {tickerVisible ? '34px' : '0'}">
	<div class="wrap nav-in">
		<a class="brand" href={localizedBrandHref} aria-label={m.nav_brand_aria()}>
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
			<a class="nav-login" href={localizeHref('/login')}>{m.nav_login()}</a>
			<a class="btn btn-primary nav-cta" href={cta}>{m.nav_cta()}</a>
			<button
				class="nav-burger"
				type="button"
				aria-expanded={menuOpen}
				aria-controls="nav-panel"
				aria-label={menuOpen ? m.nav_menu_close() : m.nav_menu_open()}
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
				<a href={localizeHref('/login')} onclick={close}>{m.nav_login()}</a>
				<a class="btn btn-primary" href={cta} onclick={close}>{m.nav_cta()}</a>
			</div>
		</div>
	{/if}
</nav>
