// ============================================================
// PadelIndex — Motion-Grundlagen für die Landingpage
// ============================================================
// Eine Stelle für alles, was sich bewegt. Zwei Regeln, die überall gelten:
//
//   1. prefers-reduced-motion wird nicht "abgeschwächt", sondern respektiert:
//      Zielzustand sofort setzen, keine Zwischenframes.
//   2. Jede Animation läuft über requestAnimationFrame und hört auf, wenn
//      sie fertig ist — keine Dauerschleifen im Hintergrund.

/** SSR-sicher: auf dem Server gibt es kein matchMedia. */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Weiches Ausrollen — Standardkurve für Zahlen und Balken. */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Sanftes Anlaufen und Ausrollen — für Sequenzen mit Richtungswechsel. */
export const easeInOutCubic = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export type TweenStop = () => void;

/**
 * Zählt `from` -> `to` und ruft `onFrame` pro Frame.
 * Gibt eine Abbruchfunktion zurück (wichtig: in onDestroy aufrufen, sonst
 * schreibt ein laufender Tween in eine zerstörte Komponente).
 */
export function tween(
	from: number,
	to: number,
	duration: number,
	onFrame: (value: number) => void,
	ease: (t: number) => number = easeOutCubic
): TweenStop {
	if (prefersReducedMotion() || duration <= 0 || from === to) {
		onFrame(to);
		return () => {};
	}

	let raf = 0;
	let start = 0;

	const step = (ts: number) => {
		if (!start) start = ts;
		const p = Math.min(1, (ts - start) / duration);
		onFrame(from + (to - from) * ease(p));
		if (p < 1) raf = requestAnimationFrame(step);
	};

	raf = requestAnimationFrame(step);
	return () => cancelAnimationFrame(raf);
}

/**
 * Schrittkette für erzählende Sequenzen (Match -> Bestätigung -> Rating).
 * `onStep` bekommt den Index, `delays` die Wartezeit VOR jedem Schritt.
 * Bei reduzierter Bewegung springt die Kette sofort auf den letzten Schritt.
 */
export function sequence(
	delays: number[],
	onStep: (index: number) => void,
	onDone?: () => void
): TweenStop {
	if (prefersReducedMotion()) {
		onStep(delays.length - 1);
		onDone?.();
		return () => {};
	}

	const timers: ReturnType<typeof setTimeout>[] = [];
	let elapsed = 0;

	delays.forEach((delay, i) => {
		elapsed += delay;
		timers.push(
			setTimeout(() => {
				onStep(i);
				if (i === delays.length - 1) onDone?.();
			}, elapsed)
		);
	});

	return () => timers.forEach(clearTimeout);
}
