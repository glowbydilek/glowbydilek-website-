/**
 * Makes the Next.js WebAssembly compiler available offline.
 *
 * Why: Hostinger's Node.js build environment has an older glibc (< 2.29),
 * so Next.js's native SWC binaries (@next/swc-linux-x64-gnu / -musl) cannot
 * load. Next.js then falls back to its WebAssembly build of SWC. However,
 * Next.js 16 does not pick up `@next/swc-wasm-nodejs` from node_modules: it
 * always looks in `node_modules/next/wasm/` and otherwise tries to download
 * the package during the build, which fails on Hostinger.
 *
 * This script copies the pinned `@next/swc-wasm-nodejs` dependency into the
 * place Next.js checks, so no download is needed. It is safe to run on any
 * platform: where the native compiler works, Next.js simply never uses it.
 *
 * Note: the WASM compiler only supports webpack (not Turbopack), which is
 * why `npm run build` uses `next build --webpack`.
 */
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

const nextDir = dirname(require.resolve("next/package.json"));
const wasmPkgDir = dirname(require.resolve("@next/swc-wasm-nodejs/package.json"));

const nextVersion = JSON.parse(readFileSync(join(nextDir, "package.json"), "utf8")).version;
const wasmVersion = JSON.parse(readFileSync(join(wasmPkgDir, "package.json"), "utf8")).version;

if (nextVersion !== wasmVersion) {
  console.error(
    `[prepare-swc-wasm] Version mismatch: next@${nextVersion} but @next/swc-wasm-nodejs@${wasmVersion}.\n` +
      `Install matching versions, e.g. npm install --save-exact next@${nextVersion} @next/swc-wasm-nodejs@${nextVersion}`,
  );
  process.exit(1);
}

const target = join(nextDir, "wasm", "@next", "swc-wasm-nodejs");
const targetPkg = join(target, "package.json");

if (existsSync(targetPkg) && JSON.parse(readFileSync(targetPkg, "utf8")).version === wasmVersion) {
  console.log(`[prepare-swc-wasm] SWC WebAssembly fallback ${wasmVersion} already in place.`);
} else {
  rmSync(target, { recursive: true, force: true });
  cpSync(wasmPkgDir, target, { recursive: true });
  console.log(`[prepare-swc-wasm] SWC WebAssembly fallback ${wasmVersion} installed.`);
}
