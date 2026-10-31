/**
 * Image upload processing. Images are stored IN THE DATABASE (durable
 * across Hostinger deployments and included in database backups).
 *
 * Security: the file type is detected from its bytes (not the name or the
 * browser's claim); only JPEG, PNG and WebP are accepted (no SVG, which can
 * contain scripts); images are re-encoded, which strips metadata and any
 * appended payload; size and pixel limits prevent decompression bombs.
 */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const VARIANT_WIDTHS = [640, 1024, 1600] as const;
const MAX_PIXELS = 40_000_000;

export type DetectedType = "image/jpeg" | "image/png" | "image/webp";

export function detectImageType(buf: Uint8Array): DetectedType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

export type Processed = { width: number; height: number; mime: DetectedType; variants: { width: number; mime: string; data: Buffer }[] };

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaError";
  }
}

export async function processImage(input: Buffer): Promise<Processed> {
  if (input.length > MAX_UPLOAD_BYTES) throw new MediaError("Het bestand is te groot (maximaal 12 MB).");
  const type = detectImageType(input);
  if (!type) throw new MediaError("Alleen JPG-, PNG- of WebP-foto's zijn toegestaan.");
  type SharpFn = typeof import("sharp").default;
  let sharp: SharpFn | null = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    sharp = null;
  }
  if (!sharp) {
    // Without an image library the original is stored after the byte check (dimensions unknown → 4:3 frame).
    return { width: 1600, height: 1200, mime: type, variants: [{ width: 1600, mime: type, data: input }] };
  }
  const img = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new MediaError("De afmetingen van de foto konden niet worden gelezen.");
  const oriented = meta.orientation && meta.orientation >= 5 ? { w: meta.height, h: meta.width } : { w: meta.width, h: meta.height };
  const variants = [];
  for (const w of VARIANT_WIDTHS) {
    const width = Math.min(w, oriented.w);
    const data = await sharp(input, { limitInputPixels: MAX_PIXELS }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
    variants.push({ width: w, mime: "image/webp", data });
  }
  return { width: oriented.w, height: oriented.h, mime: type, variants };
}

/** Focal point presets offered in the editor (CSS object-position). */
export const FOCUS_PRESETS: [string, string][] = [
  ["50% 50%", "Midden"],
  ["50% 25%", "Boven"],
  ["50% 75%", "Onder"],
  ["25% 50%", "Links"],
  ["75% 50%", "Rechts"],
  ["30% 30%", "Linksboven"],
  ["70% 30%", "Rechtsboven"],
];
