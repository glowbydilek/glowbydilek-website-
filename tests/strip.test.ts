import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { stripMetadata } from "../src/lib/cms/strip.ts";

const exif = { IFD0: { Copyright: "SECRET-OWNER", ImageDescription: "SECRET-PLACE" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "52/1 22/1 0/1" } };

async function source(format: "jpeg" | "png" | "webp") {
  const base = sharp({ create: { width: 64, height: 48, channels: 3, background: { r: 200, g: 170, b: 150 } } });
  const withMeta = base.withExif(exif).withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description>SECRET-XMP</rdf:Description></rdf:RDF></x:xmpmeta>');
  return withMeta.toFormat(format).toBuffer();
}

for (const format of ["jpeg", "png", "webp"] as const) {
  test(`fallback removes EXIF/XMP/GPS from ${format} and keeps a valid image`, async () => {
    const input = await source(format);
    const before = await sharp(input).metadata();
    assert.ok(before.exif || before.xmp, "test image should carry metadata");
    assert.ok(input.includes("SECRET-OWNER") || input.includes("SECRET-XMP"));

    const out = stripMetadata(input, `image/${format}`);
    assert.equal(out.width, 64);
    assert.equal(out.height, 48);
    for (const s of ["SECRET-OWNER", "SECRET-PLACE", "SECRET-XMP", "Exif\0\0"]) assert.ok(!out.data.includes(s), `${s} still present`);

    const after = await sharp(out.data).metadata();
    assert.equal(after.exif, undefined);
    assert.equal(after.xmp, undefined);
    assert.equal(after.width, 64);
    const { data } = await sharp(out.data).raw().toBuffer({ resolveWithObject: true });
    assert.equal(data.length, 64 * 48 * 3);
  });
}

test("fallback refuses a corrupt file", () => {
  assert.throws(() => stripMetadata(Buffer.from([0xff, 0xd8, 0x00, 0x01]), "image/jpeg"));
  assert.throws(() => stripMetadata(Buffer.from("RIFF0000WEBPVP8X"), "image/webp"));
});

test("upload processing without sharp stores a metadata-free original", async () => {
  // Runs in a child process (GLOW_TEST_NO_SHARP=1 must be set before media.ts loads).
  // Input and output go through temporary files, not argv/stdout, so the check
  // does not depend on how a CI runner captures child output (v13 QA note).
  const { spawnSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "glow-nosharp-"));
  try {
    const inFile = join(dir, "in.jpg");
    const outFile = join(dir, "out.json");
    writeFileSync(inFile, await source("jpeg"));
    const script = `
      import { readFileSync, writeFileSync } from "node:fs";
      import { processImage } from "./src/lib/cms/media.ts";
      const out = await processImage(readFileSync(process.env.GLOW_IN));
      writeFileSync(process.env.GLOW_OUT, JSON.stringify({ w: out.width, h: out.height, n: out.variants.length, mime: out.variants[0].mime, data: out.variants[0].data.toString("base64") }));
    `;
    const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--import", "./tests/register.mjs", "--input-type=module", "-e", script], {
      env: { ...process.env, GLOW_TEST_NO_SHARP: "1", GLOW_IN: inFile, GLOW_OUT: outFile },
      encoding: "utf8",
      timeout: 60_000,
    });
    const why = `child exit=${r.status} signal=${r.signal ?? "-"} error=${r.error?.message ?? "-"}\nstderr: ${r.stderr}\nstdout: ${r.stdout}`;
    assert.equal(r.status, 0, why);
    assert.ok(existsSync(outFile), `child wrote no result file\n${why}`);
    const out = JSON.parse(readFileSync(outFile, "utf8"));
    assert.deepEqual([out.w, out.h, out.n, out.mime], [64, 48, 1, "image/jpeg"]);
    const data = Buffer.from(out.data, "base64");
    assert.ok(!data.includes("SECRET-OWNER") && !data.includes("SECRET-XMP"), "metadata removed");
    assert.equal((await sharp(data).metadata()).exif, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
