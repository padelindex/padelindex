import { describe, expect, it } from 'vitest';
import { readMagicLinkTokensFromHash } from './supabase-browser';

describe('readMagicLinkTokensFromHash', () => {
	it('liest access_token und refresh_token aus einem echten Magic-Link-Fragment', () => {
		const hash =
			'#access_token=eyJabc.def.ghi&expires_at=1787007723&expires_in=3600&refresh_token=554s3vpkdybr&token_type=bearer&type=signup';
		expect(readMagicLinkTokensFromHash(hash)).toEqual({
			accessToken: 'eyJabc.def.ghi',
			refreshToken: '554s3vpkdybr'
		});
	});

	it('funktioniert auch ohne führendes #', () => {
		const hash = 'access_token=a&refresh_token=b';
		expect(readMagicLinkTokensFromHash(hash)).toEqual({ accessToken: 'a', refreshToken: 'b' });
	});

	it('liefert null ohne Fragment', () => {
		expect(readMagicLinkTokensFromHash('')).toBeNull();
		expect(readMagicLinkTokensFromHash('#')).toBeNull();
	});

	it('liefert null, wenn nur eines der beiden Tokens da ist', () => {
		expect(readMagicLinkTokensFromHash('#access_token=a')).toBeNull();
		expect(readMagicLinkTokensFromHash('#refresh_token=b')).toBeNull();
	});

	it('ignoriert ein Fragment ohne Tokens (z.B. ein normaler #anker-Link)', () => {
		expect(readMagicLinkTokensFromHash('#anmelden')).toBeNull();
	});
});
