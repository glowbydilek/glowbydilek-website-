/**
 * Converts original photos in assets/photos/ into optimised, responsive WebP
 * files in public/images/photos/ (640, 1024, 1600 and 2200 px wide).
 *
 * Usage: npm run photos
 * Run this locally (it uses `sharp`, which ships with Next.js). The generated
 * WebP files are committed, so the Hostinger server never has to process
 * images at runtime.
 */
import { mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const SRC = "assets/photos";
const OUT = "public/images/photos";
const WIDTHS = [640, 1024, 1600, 2200];

mkdirSync(OUT, { recursive: true });
let files = [];
try {
  files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f));
} catch {
  console.log(`No ${SRC} folder yet — nothing to optimise.`);
  process.exit(0);
}

for (const file of files) {
  const id = basename(file, extname(file));
  for (const width of WIDTHS) {
    await sharp(join(SRC, file))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(join(OUT, `${id}-${width}.webp`));
  }
  console.log(`✓ ${id}`);
}
