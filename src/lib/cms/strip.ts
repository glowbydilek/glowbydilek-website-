/**
 * Image metadata removal without native libraries. Used only when `sharp`
 * cannot load (e.g. an older glibc on the host): uploaded photos must never
 * keep EXIF/XMP/IPTC data, which can contain GPS coordinates and so reveal
 * where a photo was taken. Pixel data is left untouched.
 */

export type Stripped = { data: Buffer; width: number | null; height: number | null };

export class StripError extends Error {}

/** JPEG: drop APP1..APP15 (EXIF, XMP, IPTC, …) and comments; keep APP0 (JFIF), tables and image data. */
export function stripJpeg(input: Buffer): Stripped {
  if (input[0] !== 0xff || input[1] !== 0xd8) throw new StripError("not a jpeg");
  const out: Buffer[] = [input.subarray(0, 2)];
  let i = 2;
  let width: number | null = null;
  let height: number | null = null;
  while (i < input.length) {
    if (input[i] !== 0xff) throw new StripError("corrupt jpeg");
    const marker = input[i + 1];
    if (marker === 0xff) {
      i++;
      continue;
    }
    if (marker === 0xd9) {
      out.push(input.subarray(i, i + 2));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(input.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 4 > input.length) throw new StripError("truncated jpeg");
    const len = input.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > input.length) throw new StripError("truncated jpeg");
    const seg = input.subarray(i, i + 2 + len);
    const isApp = marker >= 0xe1 && marker <= 0xef;
    const isComment = marker === 0xfe;
    // SOF0..SOF15 except DHT (C4), JPG (C8) and DAC (CC) carry the dimensions.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && len >= 7) {
      height = input.readUInt16BE(i + 5);
      width = input.readUInt16BE(i + 7);
    }
    if (!isApp && !isComment) out.push(seg);
    i += 2 + len;
    if (marker === 0xda) {
      // Start of scan: the rest is entropy-coded image data up to EOI.
      out.push(input.subarray(i));
      break;
    }
  }
  return { data: Buffer.concat(out), width, height };
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

/** PNG: drop text, EXIF and timestamp chunks. */
export function stripPng(input: Buffer): Stripped {
  if (!input.subarray(0, 8).equals(PNG_SIG)) throw new StripError("not a png");
  const out: Buffer[] = [PNG_SIG];
  let i = 8;
  let width: number | null = null;
  let height: number | null = null;
  while (i + 12 <= input.length) {
    const len = input.readUInt32BE(i);
    const type = input.toString("latin1", i + 4, i + 8);
    const end = i + 12 + len;
    if (end > input.length) throw new StripError("truncated png");
    if (type === "IHDR") {
      width = input.readUInt32BE(i + 8);
      height = input.readUInt32BE(i + 12);
    }
    if (!PNG_DROP.has(type)) out.push(input.subarray(i, end));
    i = end;
    if (type === "IEND") break;
  }
  return { data: Buffer.concat(out), width, height };
}

/** WebP: drop EXIF and XMP chunks and clear their flags in VP8X. */
export function stripWebp(input: Buffer): Stripped {
  if (input.toString("latin1", 0, 4) !== "RIFF" || input.toString("latin1", 8, 12) !== "WEBP") throw new StripError("not a webp");
  const chunks: Buffer[] = [];
  let i = 12;
  let width: number | null = null;
  let height: number | null = null;
  while (i + 8 <= input.length) {
    const type = input.toString("latin1", i, i + 4);
    const size = input.readUInt32LE(i + 4);
    const end = i + 8 + size + (size % 2);
    if (i + 8 + size > input.length) throw new StripError("truncated webp");
    let chunk = input.subarray(i, Math.min(end, input.length));
    if (type === "VP8X" && size >= 10) {
      chunk = Buffer.from(chunk);
      chunk[8] &= ~(0x08 | 0x04); // EXIF and XMP flags
      width = 1 + chunk.readUIntLE(12, 3);
      height = 1 + chunk.readUIntLE(15, 3);
    } else if (type === "VP8 " && size >= 10 && width === null) {
      width = input.readUInt16LE(i + 14) & 0x3fff;
      height = input.readUInt16LE(i + 16) & 0x3fff;
    } else if (type === "VP8L" && size >= 5 && width === null) {
      const b = input.readUInt32LE(i + 9);
      width = (b & 0x3fff) + 1;
      height = ((b >> 14) & 0x3fff) + 1;
    }
    if (type !== "EXIF" && type !== "XMP ") chunks.push(chunk);
    i = end;
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "latin1");
  header.writeUInt32LE(4 + body.length, 4);
  header.write("WEBP", 8, "latin1");
  return { data: Buffer.concat([header, body]), width, height };
}

export function stripMetadata(input: Buffer, mime: "image/jpeg" | "image/png" | "image/webp"): Stripped {
  const out = mime === "image/jpeg" ? stripJpeg(input) : mime === "image/png" ? stripPng(input) : stripWebp(input);
  // No dimensions means no image header was found: refuse rather than store unknown bytes.
  if (!out.width || !out.height) throw new StripError("no image data");
  return out;
}
