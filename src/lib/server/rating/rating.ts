// Re-Export des reinen Rating-Kerns.
//
// Der Kern liegt bewusst NICHT mehr unter $lib/server: er ist frei von
// DB-Zugriff, Secrets und Server-APIs, und die Landingpage rechnet den
// Match-Simulator damit im Browser — mit demselben Code, der auch
// produktiv die Ratings vergibt. $lib/server/* darf SvelteKit nicht ins
// Client-Bundle lassen, deshalb der Umzug nach $lib/rating-core.
//
// Dieser Re-Export bleibt bestehen, damit die serverseitigen Aufrufer
// (confirm.ts, league-seed.ts, external-claims.ts, Tests, Import-Skript)
// unverändert weiterlaufen.
export * from '$lib/rating-core';
