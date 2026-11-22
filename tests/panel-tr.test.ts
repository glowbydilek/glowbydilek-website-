import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { tx } from "../src/lib/private/panelT.ts";
import { TR, TR_PATTERNS } from "../src/lib/private/panelTr.ts";
import { pt, toPanelLang } from "../src/lib/private/panelLang.ts";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}
const SRC = ["src/app/(private)", "src/components/private"].flatMap(files);

describe("panel Turkish", () => {
  test("Turkish is the default panel language; Dutch stays available", () => {
    assert.equal(toPanelLang(undefined), "tr");
    assert.equal(toPanelLang("tr"), "tr");
    assert.equal(toPanelLang("nl"), "nl");
  });

  test("every t(\"…\") text in Agenda/Admin has a Turkish translation", () => {
    const missing: string[] = [];
    for (const f of SRC) {
      const s = readFileSync(f, "utf8");
      for (const m of s.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)+)"\s*\)/g)) {
        const key = JSON.parse(`"${m[1]}"`) as string;
        // Shell/menu keys (e.g. "logout") live in the older route dictionary of panelLang.ts.
        const shellKey = pt("tr", key, "\u0000") !== "\u0000";
        if (!shellKey && !TR[key] && !TR_PATTERNS.some(([re]) => re.test(key))) missing.push(`${f}: ${key}`);
      }
    }
    assert.deepEqual(missing, [], `missing Turkish:\n${missing.join("\n")}`);
  });

  test("translation keeps whitespace and handles variable texts", () => {
    assert.equal(tx("tr", "Opslaan"), "Kaydet");
    assert.equal(tx("tr", " Opslaan "), " Kaydet ");
    assert.equal(tx("nl", "Opslaan"), "Opslaan");
    assert.equal(tx("tr", "Automatisch: 45 min"), "Otomatik: 45 dk");
    assert.equal(tx("tr", "Onbekende tekst"), "Onbekende tekst");
  });

  test("no empty or untranslated (identical) Turkish entries", () => {
    const bad = Object.entries(TR).filter(([k, v]) => !v.trim() || (v === k && !/^[\W\d]*$|^(iPhone\/iPad:|Android:)$/.test(k)));
    assert.deepEqual(bad, []);
  });
});
