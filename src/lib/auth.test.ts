import { describe, expect, it } from 'vitest';
import { safeRedirectTarget } from './auth';

describe('safeRedirectTarget', () => {
	it('lässt normale interne Pfade durch', () => {
		expect(safeRedirectTarget('/konto')).toBe('/konto');
		expect(safeRedirectTarget('/c/stc-oberland')).toBe('/c/stc-oberland');
	});

	it('fällt ohne Angabe auf den Fallback zurück', () => {
		expect(safeRedirectTarget(null)).toBe('/');
		expect(safeRedirectTarget(undefined)).toBe('/');
		expect(safeRedirectTarget('', { fallback: '/konto' })).toBe('/konto');
	});

	it('lehnt absolute URLs ohne bekannten Origin ab', () => {
		expect(safeRedirectTarget('https://böse.example')).toBe('/');
		expect(safeRedirectTarget('http://böse.example/x')).toBe('/');
	});

	it('lehnt protokollrelative URLs ab', () => {
		expect(safeRedirectTarget('//böse.example')).toBe('/');
	});

	it('lehnt Pfade ohne führenden Slash ab', () => {
		expect(safeRedirectTarget('konto')).toBe('/');
	});

	it('respektiert einen eigenen Fallback', () => {
		expect(safeRedirectTarget('javascript:alert(1)', { fallback: '/konto' })).toBe('/konto');
	});

	// {{ .RedirectTo }} aus dem Supabase-E-Mail-Template ist immer absolut
	// (emailRedirectTo verlangt eine volle URL) — der Normalfall nach einem
	// Magic-Link-Login.
	describe('mit bekanntem origin (Fall aus /auth/confirm)', () => {
		const origin = 'https://padelindex.de';

		it('reduziert eine Same-Origin-URL auf ihren Pfad', () => {
			expect(safeRedirectTarget(`${origin}/konto`, { origin })).toBe('/konto');
		});

		it('erhält Query und Hash einer Same-Origin-URL', () => {
			expect(safeRedirectTarget(`${origin}/c/stc-oberland?page=2#top`, { origin })).toBe(
				'/c/stc-oberland?page=2#top'
			);
		});

		it('lehnt eine fremde absolute URL trotz bekanntem origin ab', () => {
			expect(safeRedirectTarget('https://böse.example/konto', { origin })).toBe('/');
		});

		it('kommt mit unparsbaren URLs klar', () => {
			expect(safeRedirectTarget('https://', { origin })).toBe('/');
		});

		it('nimmt weiterhin relative Pfade an', () => {
			expect(safeRedirectTarget('/konto', { origin })).toBe('/konto');
		});
	});
});
