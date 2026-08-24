// Clientseitige Bildkompression vor dem Avatar-Upload: verkleinert auf
// max. 1024px (Kante) und kodiert per <canvas>.toBlob() nach WebP (Fallback
// JPEG, falls der Browser WebP-Encoding nicht unterstützt — Canvas-Encoding
// ist eine andere Fähigkeit als WebP-Decoding, ältere Safari-Versionen
// können z.B. WebP anzeigen, aber nicht erzeugen). Qualität wird
// schrittweise gesenkt, bis die Zielgröße erreicht ist oder die
// Qualitäts-Untergrenze greift — Handyfotos (oft 5–15MB) kommen so
// zuverlässig unter 500KB, ohne für ein Avatar-Rund sichtbar zu matschen.

const MAX_DIMENSION = 1024;
const TARGET_BYTES = 500 * 1024;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;
const START_QUALITY = 0.85;

export type CompressedImage = { blob: Blob; ext: 'webp' | 'jpg' };

let webpSupport: Promise<boolean> | null = null;

function canEncodeWebp(): Promise<boolean> {
	webpSupport ??= new Promise((resolve) => {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		canvas.toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp');
	});
	return webpSupport;
}

function loadImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('decode-failed'));
		};
		img.src = url;
	});
}

function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality: number
): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Skaliert file auf max. MAX_DIMENSION je Kante und komprimiert Richtung TARGET_BYTES. */
export async function compressImage(file: File): Promise<CompressedImage> {
	const img = await loadImage(file);

	const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
	const width = Math.max(1, Math.round(img.naturalWidth * scale));
	const height = Math.max(1, Math.round(img.naturalHeight * scale));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('canvas-unsupported');
	ctx.drawImage(img, 0, 0, width, height);

	const useWebp = await canEncodeWebp();
	const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
	const ext: CompressedImage['ext'] = useWebp ? 'webp' : 'jpg';

	let quality = START_QUALITY;
	let blob = await canvasToBlob(canvas, mimeType, quality);
	while (blob && blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
		quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
		blob = await canvasToBlob(canvas, mimeType, quality);
		if (quality === MIN_QUALITY) break;
	}
	if (!blob) throw new Error('encode-failed');

	return { blob, ext };
}
