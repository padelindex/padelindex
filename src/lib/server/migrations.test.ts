import { describe, expect, test } from 'vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';

// Supabase CLI tracks applied migrations by the numeric prefix before the
// first underscore (supabase_migrations.schema_migrations.version) — two
// files sharing a prefix collide there even though they're distinct files
// on disk. This has already happened once (three different PRs merged the
// same day each grabbed "0020"), so this guards against it recurring.
describe('supabase migrations', () => {
	const dir = path.resolve(process.cwd(), 'supabase/migrations');
	const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));

	test('every migration has a unique numeric prefix', () => {
		const byPrefix = new Map<string, string[]>();
		for (const file of files) {
			const prefix = file.split('_')[0];
			byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), file]);
		}
		const duplicates = [...byPrefix.values()].filter((group) => group.length > 1);
		expect(duplicates).toEqual([]);
	});
});
