import assert from "node:assert/strict";
import { test } from "node:test";
import { inflateRawSync } from "node:zlib";
import { buildZip, crc32 } from "../src/lib/zip.ts";

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("zip archive: entries readable, text deflated, binaries stored, names unique", () => {
  const csv = Buffer.from("soort;datum\r\nfactuur;2026-11-01\r\n".repeat(20));
  const pdf = Buffer.from("%PDF-1.7 example");
  const zip = buildZip([
    { name: "overzicht.csv", data: csv },
    { name: "facturen/F-1.pdf", data: pdf },
    { name: "facturen/F-1.pdf", data: pdf },
    { name: "../evil.txt", data: Buffer.from("x") },
  ]);
  // End of central directory: 4 entries.
  const eocd = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocd), 0x06054b50);
  assert.equal(zip.readUInt16LE(eocd + 10), 4);
  // Walk the local headers.
  const names: string[] = [];
  let off = 0;
  for (let i = 0; i < 4; i++) {
    assert.equal(zip.readUInt32LE(off), 0x04034b50);
    const method = zip.readUInt16LE(off + 8);
    const crc = zip.readUInt32LE(off + 14);
    const size = zip.readUInt32LE(off + 18);
    const nameLen = zip.readUInt16LE(off + 26);
    const name = zip.subarray(off + 30, off + 30 + nameLen).toString("utf8");
    const body = zip.subarray(off + 30 + nameLen, off + 30 + nameLen + size);
    const raw = method === 8 ? inflateRawSync(body) : body;
    assert.equal(crc32(raw), crc, name);
    if (name === "overzicht.csv") {
      assert.equal(method, 8);
      assert.ok(size < csv.length);
      assert.deepEqual(Buffer.from(raw), csv);
    }
    if (name.endsWith(".pdf")) assert.equal(method, 0);
    names.push(name);
    off += 30 + nameLen + size;
  }
  assert.deepEqual(names, ["overzicht.csv", "facturen/F-1.pdf", "facturen/F-1-2.pdf", "evil.txt"]);
});
