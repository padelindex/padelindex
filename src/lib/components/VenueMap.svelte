<script lang="ts">
	// ============================================================
	// PadelIndex — Deutschlandkarte der Padel-Anlagen
	// ============================================================
	// Leaflet ist die einzige neue Abhängigkeit (~42 kB gzip). Begründung:
	// eine schwenk-/zoombare Karte mit Kartenmaterial lässt sich nicht
	// sinnvoll selbst bauen, und Leaflet ist der schlankste etablierte
	// Weg dorthin — kein React-Zwang, kein API-Key, keine Telemetrie.
	//
	// DYNAMISCH GELADEN: Leaflet greift beim Import auf window zu und
	// würde das SSR-Rendering dieser Seite sonst zerlegen. Deshalb erst
	// in onMount() importieren — die Seite selbst rendert serverseitig
	// ganz normal, inklusive der Anlagenliste unten.
	//
	// KEINE STANDARD-MARKER: Leaflets Default-Icon lädt PNGs über relative
	// Pfade, die unter einem Bundler regelmäßig ins Leere zeigen.
	// circleMarker vermeidet das Problem vollständig und lässt sich
	// nebenbei in den Markenfarben einfärben.
	//
	// KACHELN von tile.openstreetmap.org: kostenlos, aber die
	// OSM-Nutzungsrichtlinie untersagt kommerzielle Dauerlast. Für den
	// Produktivbetrieb ist ein bezahlter Anbieter einzuplanen — siehe
	// docs/karte.md.

	import { onMount } from 'svelte';
	import type { Map as LeafletMap, CircleMarker } from 'leaflet';
	import type { Venue } from '$lib/server/venues';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';
	// Leaflets eigenes CSS. Statischer Import (anders als das JS): Vite
	// zieht daraus eine normale Stylesheet-Datei, das läuft durch SSR
	// hindurch. Ohne dieses CSS sitzen die Kacheln versetzt und die
	// Zoom-Bedienelemente sind unsichtbar.
	import 'leaflet/dist/leaflet.css';

	let { venues, selectedId = $bindable(null) }: { venues: Venue[]; selectedId?: string | null } =
		$props();

	let container: HTMLDivElement;
	let map: LeafletMap | null = null;
	let markers = new Map<string, CircleMarker>();
	let ready = $state(false);
	let failed = $state(false);

	// Deutschland-Mitte, Zoomstufe zeigt das ganze Land.
	const CENTER: [number, number] = [51.1657, 10.4515];
	const ZOOM = 6;

	const PARTNER = '#16A394';
	const NON_PARTNER = '#E9B23C';

	function styleFor(v: Venue) {
		const color = v.isPartner ? PARTNER : NON_PARTNER;
		return {
			radius: v.isPartner ? 9 : 7,
			color: '#0B1E26',
			weight: 1.5,
			fillColor: color,
			fillOpacity: 0.9
		};
	}

	onMount(() => {
		let cancelled = false;

		(async () => {
			try {
				const L = await import('leaflet');
				if (cancelled) return;

				map = L.map(container, {
					center: CENTER,
					zoom: ZOOM,
					scrollWheelZoom: false // sonst "fängt" die Karte das Seiten-Scrollen ab
				});

				L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 18,
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				}).addTo(map);

				// Tastaturbedienung: Leaflet macht den Container fokussierbar,
				// aber ohne Beschriftung weiß ein Screenreader nicht, was das ist.
				container.setAttribute('role', 'application');
				container.setAttribute('aria-label', m.venuemap_aria_label());

				ready = true;
			} catch {
				// Kein Netz, blockierte Kacheln, was auch immer — die Liste
				// unter der Karte trägt die Information ohnehin allein.
				failed = true;
			}
		})();

		return () => {
			cancelled = true;
			map?.remove();
			map = null;
		};
	});

	// Marker neu setzen, wenn sich die gefilterte Liste ändert.
	$effect(() => {
		const currentVenues = venues;
		if (!ready || !map) return;

		(async () => {
			const L = await import('leaflet');
			if (!map) return;

			for (const m of markers.values()) m.remove();
			markers = new Map();

			for (const v of currentVenues) {
				if (v.lat === null || v.lng === null) continue;

				const marker = L.circleMarker([v.lat, v.lng], styleFor(v))
					.addTo(map)
					.bindPopup(popupHtml(v));

				marker.on('click', () => (selectedId = v.id));
				markers.set(v.id, marker);
			}
		})();
	});

	// Von außen (Liste) ausgewählte Anlage anspringen.
	$effect(() => {
		const id = selectedId;
		if (!ready || !map || id === null) return;
		const marker = markers.get(id);
		if (!marker) return;
		map.setView(marker.getLatLng(), Math.max(map.getZoom(), 11));
		marker.openPopup();
	});

	/**
	 * Popup-Inhalt. Leaflet nimmt hier rohes HTML entgegen — alles, was
	 * aus der Datenbank kommt, MUSS deshalb escaped werden, sonst wäre ein
	 * Anlagenname mit <script> eine XSS-Lücke.
	 */
	function esc(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function popupHtml(v: Venue): string {
		const lines: string[] = [];
		lines.push(`<strong class="vp-name">${esc(v.name)}</strong>`);

		const place = [v.postalCode, v.city].filter(Boolean).join(' ');
		if (v.address) lines.push(`<span class="vp-line">${esc(v.address)}</span>`);
		if (place) lines.push(`<span class="vp-line">${esc(place)}</span>`);

		if (v.website) {
			lines.push(
				`<a class="vp-link" href="${esc(v.website)}" target="_blank" rel="noopener noreferrer">${esc(m.venuemap_website())}</a>`
			);
		}

		if (v.isPartner) {
			lines.push(`<span class="vp-status vp-partner">${esc(m.venuemap_partner_badge())}</span>`);
			if (v.clubSlug) {
				lines.push(
					`<a class="vp-link" href="${esc(localizeHref(`/c/${v.clubSlug}`))}">${esc(m.venuemap_ranking_link())}</a>`
				);
			}
		} else {
			lines.push(`<span class="vp-status vp-open">${esc(m.venuemap_not_partner_badge())}</span>`);
			lines.push(`<span class="vp-cta">${esc(m.venuemap_cta_text())}</span>`);
			lines.push(
				`<a class="vp-btn" href="${esc(localizeHref('/vereine#demo'))}">${esc(m.venuemap_interest_link())}</a>` +
					`<a class="vp-link" href="mailto:kontakt@padelindex.de?subject=${encodeURIComponent(
						m.venuemap_email_subject({ name: v.name })
					)}">kontakt@padelindex.de</a>`
			);
		}

		return `<div class="vp">${lines.join('')}</div>`;
	}
</script>

<div class="mapwrap">
	<div bind:this={container} class="map" class:hidden={failed}></div>

	{#if failed}
		<p class="mapfail">
			{m.venuemap_load_failed()}
		</p>
	{/if}
</div>

<style>
	.mapwrap {
		position: relative;
		margin-top: 24px;
	}
	.map {
		height: clamp(320px, 60vh, 620px);
		width: 100%;
		border-radius: 16px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2);
		z-index: 0; /* sonst legt sich Leaflet über die sticky Navigation */
	}
	.map.hidden {
		display: none;
	}
	.mapfail {
		padding: 24px;
		border-radius: 16px;
		border: 1px solid var(--line-light);
		background: var(--chalk-2);
		color: var(--muted-light);
		font-size: 14px;
	}

	/* Popup-Inhalt: von Leaflet außerhalb dieser Komponente in den DOM
	   gehängt, deshalb :global. */
	:global(.vp) {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-family: var(--body);
		min-width: 190px;
	}
	:global(.vp-name) {
		font-family: var(--display);
		font-size: 15px;
		color: var(--ink);
	}
	:global(.vp-line) {
		font-size: 13px;
		color: var(--muted-light);
	}
	:global(.vp-status) {
		margin-top: 6px;
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	:global(.vp-partner) {
		color: var(--court-deep, #0f6e5c);
	}
	:global(.vp-open) {
		color: #7a5300;
	}
	:global(.vp-cta) {
		margin-top: 6px;
		font-size: 13px;
		color: var(--ink);
	}
	:global(.vp-btn) {
		display: inline-block;
		margin-top: 8px;
		padding: 7px 14px;
		border-radius: 100px;
		background: var(--court);
		color: #04231f !important;
		font-size: 13px;
		font-weight: 600;
		text-align: center;
		text-decoration: none !important;
	}
	:global(.vp-link) {
		font-size: 13px;
		color: var(--court-deep, #0f6e5c) !important;
	}
</style>
