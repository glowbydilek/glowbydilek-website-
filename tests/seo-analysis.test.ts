import assert from "node:assert/strict";
import { test } from "node:test";
import { containsKeyword, contentChecks, keywordCount, overall, snippetChecks } from "@/lib/seo-analysis";

test("keyword matching ignores case, accents and hyphens", () => {
  assert.equal(containsKeyword("Wenkbrauwen waxen in Amsterdam", "wenkbrauwen waxen"), true);
  assert.equal(containsKeyword("/waxbehandelingen/gezicht/wenkbrauwen-waxen", "Wenkbrauwen Waxen"), true);
  assert.equal(containsKeyword("Benen waxen", "wenkbrauwen waxen"), false);
  assert.equal(keywordCount("waxen, waxen en nog eens Waxen", "waxen"), 3);
});

test("a good snippet scores green, a missing keyword red", () => {
  const good = snippetChecks({
    keyword: "wenkbrauwen waxen",
    title: "Wenkbrauwen waxen in Amsterdam, alleen voor vrouwen",
    description: "Wenkbrauwen waxen in Amsterdam-Noord bij Glow by Dilek: een strakke, natuurlijke vorm in vijftien minuten, alleen voor vrouwen. Plan je afspraak.",
    path: "/waxbehandelingen/gezicht/wenkbrauwen-waxen",
  });
  assert.equal(good.filter((c) => c.status === "bad").length, 0, JSON.stringify(good));
  assert.equal(overall(good), "good");
  const none = snippetChecks({ keyword: "", title: "Kort", description: "Te kort", path: "/x" });
  assert.equal(overall(none), "bad");
  assert.ok(snippetChecks({ keyword: "x", title: "x", description: "x", path: "/", noindex: true }).some((c) => c.id === "noindex" && c.status === "bad"));
});

test("content checks flag thin text, keyword stuffing and missing alt text", () => {
  const body = Array(400).fill("woord").join(" ") + " wenkbrauwen waxen wenkbrauwen waxen";
  const ok = contentChecks({ h1: "Wenkbrauwen waxen", intro: "Wenkbrauwen waxen bij Glow by Dilek in Amsterdam-Noord.", body, images: 2, imagesWithoutAlt: 0, internalLinks: 5 }, "wenkbrauwen waxen");
  assert.equal(ok.filter((c) => c.status === "bad").length, 0, JSON.stringify(ok));
  const thin = contentChecks({ h1: "", intro: "", body: "waxen waxen waxen waxen", images: 3, imagesWithoutAlt: 2, internalLinks: 0 }, "waxen");
  assert.ok(thin.some((c) => c.id === "words" && c.status === "bad"));
  assert.ok(thin.some((c) => c.id === "density" && c.status === "bad"));
  assert.ok(thin.some((c) => c.id === "alt" && c.status === "bad"));
});

test("a focus keyword is suggested from the default title", async () => {
  const { suggestKeyword } = await import("@/lib/seo-analysis");
  assert.equal(suggestKeyword("Wenkbrauwen waxen in Amsterdam, alleen voor vrouwen"), "wenkbrauwen waxen");
  assert.equal(suggestKeyword("Gezichtsmassage Amsterdam | Glow by Dilek"), "gezichtsmassage");
});
