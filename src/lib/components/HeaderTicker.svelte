<script lang="ts">
	// Dezenter Live-Ticker über dem Hauptmenü, eingebunden direkt in
	// LandingNav.svelte (einzige Einbaustelle statt einer Kopie pro
	// Route). Holt seine Daten selbst per fetch — bewusst kein Server-
	// Load: die Route drumherum soll den Ticker nicht kennen müssen, und
	// $effect läuft ohnehin nur im Browser, nie beim SSR-Rendern.
	//
	// onVisibleChange meldet dem Elternteil (LandingNav), ob gerade eine
	// Leiste zu sehen ist — die Nav braucht das, um ihren eigenen
	// sticky-Versatz (top: 34px vs. 0) passend zu setzen.

	import { CATEGORY_META, type FeedItem } from '$lib/feed';

	let { onVisibleChange }: { onVisibleChange?: (visible: boolean) => void } = $props();

	let items = $state<FeedItem[]>([]);
	let failed = $state(false);

	$effect(() => {
		let cancelled = false;

		fetch('/api/ticker')
			.then((res) => {
				if (!res.ok) throw new Error('ticker request failed');
				return res.json();
			})
			.then((data: unknown) => {
				if (cancelled) return;
				items = Array.isArray(data) ? (data as FeedItem[]) : [];
			})
			.catch(() => {
				if (!cancelled) failed = true;
			});

		return () => {
			cancelled = true;
		};
	});

	const visible = $derived(!failed && items.length > 0);
	// Zweite, für Screenreader/Tastatur unsichtbare Kopie hinter der
	// echten Liste macht die CSS-Animation nahtlos endlos (Standard-
	// Marquee-Technik: beide Hälften gleich breit, Transform läuft nur
	// bis -50%).
	const duration = $derived(Math.max(24, items.length * 5));

	$effect(() => {
		onVisibleChange?.(visible);
	});
</script>

{#if visible}
	<div class="ticker" role="region" aria-label="Aktuelles von PadelIndex">
		<div class="track" style="--duration: {duration}s">
			<div class="group">
				{#each items as entry (entry.id)}
					{@const meta = CATEGORY_META[entry.category]}
					<a class="item" href={entry.link}>
						<span class="badge" style="--badge-bg: {meta.background}; --badge-fg: {meta.color}">
							{meta.label}
						</span>
						<span class="title">{entry.title}</span>
					</a>
				{/each}
			</div>
			<div class="group" aria-hidden="true">
				{#each items as entry (entry.id + '-dup')}
					{@const meta = CATEGORY_META[entry.category]}
					<a class="item" href={entry.link} tabindex="-1">
						<span class="badge" style="--badge-bg: {meta.background}; --badge-fg: {meta.color}">
							{meta.label}
						</span>
						<span class="title">{entry.title}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.ticker {
		position: sticky;
		top: 0;
		z-index: 60;
		height: 34px;
		overflow: hidden;
		display: flex;
		align-items: center;
		background: #0f172a;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.track {
		display: flex;
		width: max-content;
		animation: ticker-scroll var(--duration) linear infinite;
	}

	.ticker:hover .track,
	.ticker:focus-within .track {
		animation-play-state: paused;
	}

	.group {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.item {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 0 22px;
		text-decoration: none;
		color: #e2e8f0;
		font-family: var(--body);
		font-size: 12.5px;
		white-space: nowrap;
	}

	.item:hover .title,
	.item:focus-visible .title {
		text-decoration: underline;
	}

	.badge {
		font-family: var(--mono);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 2px 7px;
		border-radius: 100px;
		background: var(--badge-bg);
		color: var(--badge-fg);
		flex-shrink: 0;
	}

	@keyframes ticker-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ticker {
			overflow-x: auto;
		}
		.track {
			animation: none;
		}
		.group[aria-hidden] {
			display: none;
		}
	}
</style>
