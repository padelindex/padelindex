// ============================================================
// PadelIndex — Rotationsmathematik fürs Padel-Roulette-Rad
// ============================================================
// Reine Funktionen, getrennt vom Svelte-Component (RouletteWheel.svelte),
// damit die Winkel-Arithmetik unabhängig von DOM/Crypto testbar ist.
//
// Konvention: Wedge 0 beginnt bei -90° (12 Uhr) und läuft im Uhrzeigersinn;
// der Zeiger ist optisch fix bei -90°. "Landen auf Wedge i" heißt: das
// Rad so weit drehen, dass die MITTE von Wedge i unter dem Zeiger steht.

export function wedgeAngle(count: number): number {
	return count > 0 ? 360 / count : 0;
}

function normalizeDeg(deg: number): number {
	return ((deg % 360) + 360) % 360;
}

/**
 * Neue Gesamtrotation, damit Wedge `targetIndex` am Zeiger landet.
 * Dreht immer strikt vorwärts (mindestens `minFullSpins` volle Umdrehungen
 * ab der aktuellen Position), auch wenn Ziel- und Startwinkel zufällig
 * zusammenfallen — sonst wirkt eine Wiederholung des gleichen Ergebnisses
 * wie ein Aussetzer statt wie ein Dreh.
 */
export function targetRotation(
	currentRotation: number,
	targetIndex: number,
	wedgeCount: number,
	minFullSpins: number
): number {
	const angle = wedgeAngle(wedgeCount);
	const targetMod = normalizeDeg(-(targetIndex * angle + angle / 2));
	const currentMod = normalizeDeg(currentRotation);
	let delta = targetMod - currentMod;
	if (delta <= 0) delta += 360;
	return currentRotation + minFullSpins * 360 + delta;
}

/** Welcher Wedge-Index nach einer gegebenen Gesamtrotation am Zeiger steht. */
export function landedIndex(rotation: number, wedgeCount: number): number {
	if (wedgeCount <= 0) return -1;
	const angle = wedgeAngle(wedgeCount);
	const norm = normalizeDeg(-rotation);
	return Math.min(wedgeCount - 1, Math.floor(norm / angle));
}
