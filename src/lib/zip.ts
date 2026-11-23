import "server-only";
import { deflateRawSync } from "node:zlib";

/**
 * Minimal ZIP writer (no dependency). Text is deflated; PDFs and images,
 * which are already compressed, are stored as they are.
 */
export type ZipEntry = { name: string; data: Buffer | Uint8Array; date?: Date };

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

const COMPRESSIBLE = /\.(csv|txt|json|md|html)$/i;

export function buildZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  const used = new Set<string>();
  for (const e of entries) {
    // Unique, safe names (no absolute paths or "..").
    let name = e.name.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\.\.\//g, "");
    if (used.has(name)) {
      const dot = name.lastIndexOf(".");
      let i = 2;
      while (used.has(`${dot > 0 ? name.slice(0, dot) : name}-${i}${dot > 0 ? name.slice(dot) : ""}`)) i++;
      name = `${dot > 0 ? name.slice(0, dot) : name}-${i}${dot > 0 ? name.slice(dot) : ""}`;
    }
    used.add(name);
    const raw = Buffer.from(e.data);
    const deflate = COMPRESSIBLE.test(name);
    const body = deflate ? deflateRawSync(raw) : raw;
    const crc = crc32(raw);
    const nameBuf = Buffer.from(name, "utf8");
    const { time, date } = dosTime(e.date ?? new Date());
    const flags = 0x0800; // UTF-8 names
    const method = deflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + body.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}
