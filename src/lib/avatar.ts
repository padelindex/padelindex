// Initialen + Farbe für den Avatar-Fallback, wenn kein avatar_url gesetzt ist.
// Farbe wird deterministisch aus dem Namen abgeleitet (kein Zufall), damit
// dieselbe Person bei jedem Rendern denselben Kreis bekommt.

const PALETTE = ['#16A394', '#0C6E64', '#E9B23C', '#B4711A', '#5F7078', '#0B1E26'];

export function avatarInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	const first = parts[0][0] ?? '';
	const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
	return (first + last).toUpperCase() || '?';
}

export function avatarColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	}
	return PALETTE[hash % PALETTE.length];
}
