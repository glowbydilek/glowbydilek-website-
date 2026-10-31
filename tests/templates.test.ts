import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_TEMPLATES, paragraphsToHtml, renderTemplate, TEMPLATE_KEYS, validateTemplate } from "../src/lib/notifications/templates.ts";

test("every default template is valid in both languages", () => {
  for (const k of TEMPLATE_KEYS) for (const l of ["nl", "en"] as const) assert.deepEqual(validateTemplate(k, DEFAULT_TEMPLATES[k][l]), [], `${k}/${l}`);
});

test("edits that remove required placeholders, add HTML or unknown tags are rejected", () => {
  const t = DEFAULT_TEMPLATES.confirmed.nl;
  assert.ok(validateTemplate("confirmed", { subject: t.subject.replace("{{time}}", ""), body: t.body.replace("{{time}}", "") }).some((e) => e.includes("{{time}}")));
  assert.ok(validateTemplate("confirmed", { ...t, body: `${t.body}<script>x</script>` }).length);
  assert.ok(validateTemplate("confirmed", { ...t, body: `${t.body} {{password}}` }).some((e) => e.includes("Onbekende")));
  assert.ok(validateTemplate("reminder", { ...DEFAULT_TEMPLATES.reminder.nl, body: "{{firstName}} {{treatments}} {{date}} {{time}} {{location}}" }).length === 0);
});

test("rendering escapes values and drops empty optional paragraphs", () => {
  const r = renderTemplate(DEFAULT_TEMPLATES.confirmed.nl, {
    firstName: "<b>Sara</b>",
    treatments: "Brazilian",
    date: "maandag 9 november 2026",
    time: "10:00",
    endTime: "10:45",
    location: "",
    message: "",
  });
  assert.equal(r.subject, "Je afspraak is bevestigd — maandag 9 november 2026 om 10:00");
  assert.ok(!r.text.includes("{{"));
  assert.ok(!r.paragraphs.some((p) => p === ""));
  const html = paragraphsToHtml(r.paragraphs);
  assert.ok(html.includes("&lt;b&gt;Sara&lt;/b&gt;"));
  assert.ok(!html.includes("<b>Sara"));
});
