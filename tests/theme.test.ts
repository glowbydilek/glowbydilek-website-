import assert from "node:assert/strict";
import { test } from "node:test";
import { APPROVED_THEME, THEME_PRESETS, contrast, themeCss, validateTheme } from "../src/lib/cms/theme.ts";

test("the approved theme and every preset meet the contrast rules and render no overrides by default", () => {
  assert.deepEqual(validateTheme(APPROVED_THEME).errors, []);
  for (const p of THEME_PRESETS) assert.deepEqual(validateTheme(p.theme).errors, [], p.id);
  assert.equal(themeCss(APPROVED_THEME), "");
});

test("unreadable or invalid colours are refused; CSS injection is impossible", () => {
  const bad = validateTheme({ colors: { ink: "#dddddd" } });
  assert.ok(bad.errors.some((e) => e.includes("slecht leesbaar")));
  const inj = validateTheme({ colors: { accent: "red;} body{display:none" }, buttonShape: "x}{" });
  assert.ok(inj.errors.length);
  assert.ok(!themeCss(inj.theme).includes("display:none"));
  assert.equal(inj.theme.buttonShape, "pill");
  assert.ok(contrast("#221a17", "#f5f0e8") > 13);
});

test("changes render as CSS custom properties", () => {
  const { theme, errors } = validateTheme({ ...APPROVED_THEME, colors: { ...APPROVED_THEME.colors, accent: "#8f4a1c" }, spacing: "airy" });
  assert.deepEqual(errors, []);
  const css = themeCss(theme);
  assert.match(css, /--color-accent:#8f4a1c/);
  assert.match(css, /--space-section:/);
});

import { DEFAULT_MENU, validateBusiness, validateMenu } from "../src/lib/cms/menu.ts";

test("menu edits can only link existing public pages, never private ones", () => {
  assert.deepEqual(validateMenu(undefined), DEFAULT_MENU);
  const m = validateMenu({ header: ["about", "admin", "agenda", "../x", "faq", "faq"], footerInfo: ["https://evil.example", "privacy"] });
  assert.deepEqual(m.header, ["treatments", "about", "faq"]);
  assert.deepEqual(m.footerInfo, ["privacy"]);
  assert.deepEqual(validateBusiness({ phone: "+31 6 1234 5678", instagram: "@glow.by_dilek" }), { value: { phone: "+31 6 1234 5678", instagram: "glow.by_dilek" }, errors: [] });
  assert.ok(validateBusiness({ instagram: "https://instagram.com/x" }).errors.length);
  assert.ok(validateBusiness({ phone: "javascript:alert(1)" }).errors.length);
});
