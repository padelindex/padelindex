// ============================================================
// PadelIndex — Scroll-Reveal und Sichtbarkeits-Trigger
// ============================================================
// Zwei Svelte-Actions statt eines globalen Observers:
//
//   use:reveal     — blendet ein Element beim Scrollen ein (einmalig)
//   use:whenVisible — ruft einen Callback, sobald das Element sichtbar wird
//                     (für Sequenzen, die erst starten sollen, wenn man
//                     sie auch sieht — sonst laufen sie oberhalb des
//                     Viewports ins Leere)
//
// Beide räumen ihren Observer wieder ab; ohne destroy() hält ein
// IntersectionObserver das Element am Leben.

import { prefersReducedMotion } from './motion';

interface RevealOptions {
	/** Verzögerung in Sekunden — staffelt Karten in einem Raster. */
	delay?: number;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	if (options.delay) node.style.transitionDelay = `${options.delay}s`;

	// Ohne Bewegung: sofort sichtbar, kein Observer nötig.
	if (prefersReducedMotion()) {
		node.classList.add('in');
		return {};
	}

	node.classList.add('rv');

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.classList.add('in');
				io.disconnect();
			}
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);

	io.observe(node);
	return { destroy: () => io.disconnect() };
}

interface WhenVisibleOptions {
	/** Wird beim ersten Sichtbarwerden aufgerufen. */
	onVisible: () => void;
	/** Anteil des Elements, der sichtbar sein muss. */
	threshold?: number;
	/** Mehrfach feuern statt nur einmal. */
	repeat?: boolean;
}

export function whenVisible(node: HTMLElement, options: WhenVisibleOptions) {
	let current = options;

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				current.onVisible();
				if (!current.repeat) io.disconnect();
			}
		},
		{ threshold: current.threshold ?? 0.3 }
	);

	io.observe(node);

	return {
		update: (next: WhenVisibleOptions) => {
			current = next;
		},
		destroy: () => io.disconnect()
	};
}
