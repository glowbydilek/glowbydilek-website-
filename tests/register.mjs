// Lets `node --test` resolve the "@/..." path alias and extension-less
// TypeScript imports used by the app source.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const src = new URL("../src/", ${JSON.stringify(import.meta.url)});
const exts = [".ts", ".tsx", "/index.ts"];
export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = new URL(specifier.slice(2), src);
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL && !/\\.[cm]?[jt]sx?$/.test(specifier))
    base = new URL(specifier, context.parentURL);
  if (base) {
    for (const ext of exts) {
      const candidate = new URL(base.href + ext);
      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }
  }
  if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  // Simulates a host where the native image library cannot load.
  if (specifier === "sharp" && process.env.GLOW_TEST_NO_SHARP === "1")
    return { url: "data:text/javascript,throw new Error('GLIBC_2.28 not found (simulated)')", shortCircuit: true };
  // Next.js subpath modules are CommonJS files without an "exports" map.
  if (specifier.startsWith("next/") && !specifier.slice(5).includes(".") && !specifier.slice(5).includes("/")) return next(specifier + ".js", context);
  return next(specifier, context);
}
`),
);
