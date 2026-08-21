<script lang="ts">
	// ============================================================
	// PadelIndex — Padel-Roulette-Rad
	// ============================================================
	// Angelehnt an das Rad von sportcenter-hahn.de, aber vereinfacht: statt
	// über alle Tage eines Kalendermonats zu drehen (dort nötig, weil die
	// Termine dort lose über den Monat verteilt sind), dreht dieses Rad
	// direkt über die offenen Termine selbst — bei wenigen, konkreten
	// Terminen pro Verein ist das die direktere Version derselben Idee.
	//
	// Der Zufall hier ist rein kosmetisch (Web Crypto statt Math.random,
	// aus Gewohnheit sauberer, aber ohne Spielrelevanz im Sinne von Gewinn
	// oder Wertung): das Rad schlägt nur vor, wem man zuerst zusagen
	// könnte. Verbindlich ist ausschließlich, was roulette_join() in der
	// Datenbank durchlässt (siehe 0018) — wer das Ergebnis im Browser
	// manipuliert, bekommt nichts, was ein Klick auf die Liste darunter
	// nicht auch gäbe.

	import { wedgeAngle as wedgeAngleFor, targetRotation, landedIndex } from '$lib/roulette-wheel';

	type WheelSlot = { id: string; label: string };

	let {
		slots,
		selectedId = $bindable(null)
	}: { slots: WheelSlot[]; selectedId: string | null } = $props();

	let rotation = $state(0);
	let spinning = $state(false);

	const n = $derived(slots.length);
	const wedgeAngle = $derived(wedgeAngleFor(n));
	const colors = ['#16A394', '#0B1E26'];

	function randomIndex(count: number): number {
		const buf = new Uint32Array(1);
		crypto.getRandomValues(buf);
		return buf[0] % count;
	}

	function wedgePath(i: number): string {
		const start = -90 + i * wedgeAngle;
		const end = start + wedgeAngle;
		const r = 100;
		const toXY = (deg: number) => {
			const rad = (deg * Math.PI) / 180;
			return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)];
		};
		const [x1, y1] = toXY(start);
		const [x2, y2] = toXY(end);
		const large = wedgeAngle > 180 ? 1 : 0;
		return `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
	}

	function labelPos(i: number): { x: number; y: number; rot: number } {
		const mid = -90 + i * wedgeAngle + wedgeAngle / 2;
		const rad = (mid * Math.PI) / 180;
		const r = 62;
		// Ohne Korrektur stünde die Beschriftung in der unteren Hälfte des
		// Rads kopfüber (rot wäre zwischen 90° und 270°) — dort zusätzlich
		// um 180° drehen, damit sie immer lesbar bleibt.
		let rot = mid + 90;
		const rotNorm = ((rot % 360) + 360) % 360;
		if (rotNorm > 90 && rotNorm < 270) rot += 180;
		return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad), rot };
	}

	function spin() {
		if (spinning || n === 0) return;
		spinning = true;
		selectedId = null;

		const i = randomIndex(n);
		const fullSpins = 4 + randomIndex(3); // 4–6 volle Umdrehungen, wirkt lebendiger als immer gleich viele
		rotation = targetRotation(rotation, i, n, fullSpins);
	}

	function onTransitionEnd() {
		if (!spinning) return;
		spinning = false;
		// Rückrechnung, welcher Wedge tatsächlich am Zeiger steht — robuster
		// als sich den Index aus spin() zu merken, falls der Nutzer während
		// der Animation die Liste verändert (Slot füllt sich, neuer Slot kommt).
		const i = landedIndex(rotation, n);
		selectedId = slots[i]?.id ?? null;
	}
</script>

{#if n > 0}
	<div class="wheel-wrap">
		<div class="pointer" aria-hidden="true">▼</div>
		<svg
			class="wheel"
			class:spinning
			viewBox="0 0 200 200"
			style="transform: rotate({rotation}deg)"
			ontransitionend={onTransitionEnd}
			role="img"
			aria-label="Roulette-Rad mit {n} offenen Terminen"
		>
			{#each slots as s, i (s.id)}
				<path d={wedgePath(i)} fill={colors[i % 2]} stroke="#EFF2ED" stroke-width="1" />
				{@const pos = labelPos(i)}
				<text
					x={pos.x}
					y={pos.y}
					transform="rotate({pos.rot} {pos.x} {pos.y})"
					text-anchor="middle"
					font-size="9"
					fill="#EFF2ED"
				>
					{s.label}
				</text>
			{/each}
		</svg>
		<button class="btn btn-primary spin-btn" type="button" onclick={spin} disabled={spinning}>
			{spinning ? 'Die Kugel rollt …' : 'Roulette starten'}
		</button>
	</div>
{/if}

<style>
	.wheel-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		margin: 20px 0 28px;
	}

	.pointer {
		font-size: 22px;
		line-height: 1;
		color: var(--court-deep, #0f6e5c);
		margin-bottom: -8px;
	}

	.wheel {
		width: min(260px, 70vw);
		height: min(260px, 70vw);
		transition: transform 3.2s cubic-bezier(0.17, 0.67, 0.16, 0.99);
	}

	.spin-btn {
		padding: 12px 28px;
	}
</style>
