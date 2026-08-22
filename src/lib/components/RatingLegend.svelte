<!--
	============================================================
	Level & Sicherheit — Erklärung
	============================================================
	Natives <details>/<summary> statt einer selbstgebauten Tooltip-
	Komponente: per Tastatur bedienbar, screenreader-verständlich und
	auf Touch-Geräten antippbar, alles ohne eigenes JS. Ein bloßes
	title-Attribut (wie bisher bei der Sicherheit-Prozentzahl) leistet
	das nicht — es erscheint nicht bei Tastaturfokus und nie auf Touch.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
</script>

<details class="rlegend">
	<summary>{m.rl_summary()}</summary>
	<div class="rlegend-body">
		<p>
			<strong>{m.rl_level_label()}</strong>
			{m.rl_level_text()}
		</p>
		<p>
			<strong>{m.rl_confidence_label()}</strong>
			{m.rl_confidence_text()}
		</p>
	</div>
</details>

<style>
	.rlegend {
		font-size: 13px;
	}
	.rlegend summary {
		display: inline-block;
		cursor: pointer;
		color: var(--court-deep, #0f6e5c);
		font-weight: 600;
		list-style: none;
	}
	.rlegend summary::-webkit-details-marker {
		display: none;
	}
	.rlegend summary::marker {
		content: '';
	}
	.rlegend[open] summary {
		margin-bottom: 8px;
	}
	.rlegend-body {
		padding: 12px 14px;
		border-radius: 12px;
		background: rgba(15, 110, 92, 0.06);
		color: var(--muted-light);
		max-width: 48ch;
	}
	.rlegend-body p {
		margin: 0;
	}
	.rlegend-body p + p {
		margin-top: 8px;
	}
	.rlegend-body strong {
		color: var(--ink);
	}
</style>
