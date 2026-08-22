import { describe, it, expect } from 'vitest';
import { wedgeAngle, targetRotation, landedIndex } from './roulette-wheel';

describe('wedgeAngle', () => {
	it('teilt den Kreis gleichmäßig auf', () => {
		expect(wedgeAngle(4)).toBe(90);
		expect(wedgeAngle(3)).toBeCloseTo(120);
	});

	it('ist 0 ohne Wedges', () => {
		expect(wedgeAngle(0)).toBe(0);
	});
});

describe('targetRotation + landedIndex', () => {
	it('landet nach dem Spin exakt auf dem gewählten Index', () => {
		for (let n = 1; n <= 7; n++) {
			for (let target = 0; target < n; target++) {
				const rotation = targetRotation(0, target, n, 5);
				expect(landedIndex(rotation, n)).toBe(target);
			}
		}
	});

	it('dreht immer strikt vorwärts, auch wenn Start- und Zielwinkel zusammenfallen', () => {
		const first = targetRotation(0, 0, 4, 5);
		// Nochmal auf denselben Wedge drehen, ausgehend von der vorherigen Endposition.
		const second = targetRotation(first, 0, 4, 5);
		expect(second).toBeGreaterThan(first);
		expect(landedIndex(second, 4)).toBe(0);
	});

	it('macht mindestens die geforderten vollen Umdrehungen', () => {
		const rotation = targetRotation(0, 2, 4, 5);
		expect(rotation).toBeGreaterThanOrEqual(5 * 360);
	});

	it('landedIndex ist -1 ohne Wedges', () => {
		expect(landedIndex(123, 0)).toBe(-1);
	});

	it('bleibt über mehrere aufeinanderfolgende Spins konsistent', () => {
		let rotation = 0;
		const sequence = [0, 3, 1, 4, 2, 2, 0];
		for (const target of sequence) {
			rotation = targetRotation(rotation, target, 5, 4);
			expect(landedIndex(rotation, 5)).toBe(target);
		}
	});
});
