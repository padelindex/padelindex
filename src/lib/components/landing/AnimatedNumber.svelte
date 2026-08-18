<script lang="ts">
	// Zahl, die auf ihren neuen Wert zuzählt statt zu springen.
	// Überall dort verwendet, wo sich ein Rating ändert — die Bewegung ist
	// die Aussage ("dein Wert hat sich verändert"), nicht Dekoration.
	import { untrack } from 'svelte';
	import { tween } from '$lib/landing/motion';

	let {
		value,
		decimals = 2,
		duration = 750,
		signed = false,
		class: klass = ''
	}: {
		value: number;
		decimals?: number;
		duration?: number;
		/** Vorzeichen immer zeigen (+0.16 statt 0.16) — für Deltas. */
		signed?: boolean;
		class?: string;
	} = $props();

	// Startwert bewusst einmalig übernommen — spätere Änderungen von `value`
	// behandelt der Effekt unten als Tween, nicht als Sprung. Genau deshalb
	// soll der Initializer NICHT reaktiv sein.
	// svelte-ignore state_referenced_locally
	let shown = $state(value);

	$effect(() => {
		const target = value;
		// untrack: sonst wäre `shown` eine Abhängigkeit und der Effekt
		// würde sich bei jedem Frame selbst neu auslösen.
		const start = untrack(() => shown);
		return tween(start, target, duration, (v) => {
			shown = v;
		});
	});

	const text = $derived.by(() => {
		const body = Math.abs(shown).toFixed(decimals);
		if (!signed) return shown < 0 ? `−${body}` : body;
		// Echtes Minuszeichen statt Bindestrich — sieht in tabellarischen
		// Ziffern deutlich ruhiger aus.
		return shown < 0 ? `−${body}` : `+${body}`;
	});
</script>

<span class="num {klass}">{text}</span>
