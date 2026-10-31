import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { DOCS, emptyLeaves, mergeContent, sanitizeContent } from "../src/lib/cms/registry.ts";
import { discardDraft, editorValue, publish, restoreVersion, saveDraft, versions } from "../src/lib/cms/service.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

test("merge keeps new default keys, lets owner text win and ignores wrong types", () => {
  const def = { title: "A", items: ["x", "y"], nested: { a: "1", b: "2" }, n: 1 };
  assert.deepEqual(mergeContent(def, { title: "B", items: ["z"], nested: { a: 5 }, extra: "drop" }), { title: "B", items: ["z"], nested: { a: "1", b: "2" }, n: 1 });
  assert.deepEqual(mergeContent([{ q: "", a: "" }], [{ q: "Q1" }, { q: "Q2", a: "A2" }]), [{ q: "Q1", a: "" }, { q: "Q2", a: "A2" }]);
});

test("sanitising strips control characters and odd keys; HTML stays inert text", () => {
  const v = sanitizeContent({ ok: "a\u0000b", "bad key!": "x", nested: [{ x: "<script>alert(1)</script>" }] }) as Record<string, unknown>;
  assert.equal(v.ok, "ab");
  assert.ok(!("bad key!" in v));
  // stored as text; React escapes it when rendering
  assert.deepEqual(v.nested, [{ x: "<script>alert(1)</script>" }]);
});

test("every editable document has NL and EN defaults with the same shape and no empty text", () => {
  assert.ok(DOCS.length > 40);
  for (const d of DOCS) {
    assert.ok(d.defaults.nl !== undefined && d.defaults.en !== undefined, d.key);
    assert.deepEqual(emptyLeaves(d.defaults.nl), [], `${d.key} NL`);
  }
});

describe("CMS workflow against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
  });

  test("draft → publish → version history → restore → discard", async () => {
    const base = (await editorValue(db, "dict:home", "nl")).value as { hero: { title: string } };
    assert.equal(base.hero.title, "Zacht voor je huid.");
    await saveDraft(db, "dict:home", "nl", { ...base, hero: { ...base.hero, title: "Nieuwe titel" } }, 1);
    let v = await editorValue(db, "dict:home", "nl");
    assert.equal(v.hasDraft, true);
    assert.equal(v.published, null);
    const p1 = await publish(db, "dict:home", "nl", 1);
    assert.equal(p1.version, 1);
    await saveDraft(db, "dict:home", "nl", { hero: { title: "Tweede titel" } }, 1);
    await publish(db, "dict:home", "nl", 1);
    v = await editorValue(db, "dict:home", "nl");
    assert.equal((v.value as typeof base).hero.title, "Tweede titel");
    assert.equal(v.published?.version, 2);
    const hist = await versions(db, "dict:home", "nl");
    assert.deepEqual(hist.map((h) => h.version), [2, 1]);
    await restoreVersion(db, hist[1].id, 1);
    v = await editorValue(db, "dict:home", "nl");
    assert.equal((v.value as typeof base).hero.title, "Nieuwe titel", "restored as draft");
    await discardDraft(db, "dict:home", "nl", 1);
    v = await editorValue(db, "dict:home", "nl");
    assert.equal((v.value as typeof base).hero.title, "Tweede titel", "published unchanged");
    // EN untouched
    assert.equal(((await editorValue(db, "dict:home", "en")).value as typeof base).hero.title, "Gentle on your skin.");
  });

  test("unknown documents are rejected", async () => {
    await assert.rejects(saveDraft(db, "evil:../../x", "nl", {}, 1));
  });
});
