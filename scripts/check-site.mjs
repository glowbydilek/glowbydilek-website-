/**
 * Crawls a running build (default http://localhost:3000) and checks every
 * page from the sitemap. No dependencies; used in CI after `next build`.
 *
 *   node scripts/check-site.mjs [baseUrl]
 *
 * Checks per page: HTTP 200, exactly one <h1>, a canonical URL equal to the
 * page itself, nl-NL / en / x-default hreflang links, a <title> and meta
 * description, no forbidden location wording; and for every internal link
 * on any page: it resolves (no 4xx/5xx), and booking links only preselect
 * known treatment ids.
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const FORBIDDEN = /vanuit huis|thuisstudio|\bthuis\b|home[- ]based|\bat home\b|from home|wachtkamer|waiting room/i;
const problems = [];

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
if (pages.length < 50) problems.push(`sitemap lists only ${pages.length} pages`);

const appointmentSource = await fetch(`${base}/afspraak-maken`).then((r) => r.text());
const treatmentIds = new Set([...appointmentSource.matchAll(/\\"id\\":\\"([a-z-]+)\\",\\"name\\"/g)].map((m) => m[1]));

const links = new Map();
for (const path of pages) {
  const res = await fetch(base + path);
  if (res.status !== 200) {
    problems.push(`${path}: HTTP ${res.status}`);
    continue;
  }
  const html = await res.text();
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problems.push(`${path}: ${h1} <h1> elements`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical || new URL(canonical).pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")) {
    if (!(path === "/" && canonical && new URL(canonical).pathname === "/")) problems.push(`${path}: canonical ${canonical}`);
  }
  for (const lang of ["nl-NL", "en", "x-default"]) {
    if (!html.includes(`hrefLang="${lang}"`)) problems.push(`${path}: missing hreflang ${lang}`);
  }
  if (!/<title>[^<]{5,}<\/title>/.test(html)) problems.push(`${path}: missing title`);
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) problems.push(`${path}: missing/short description`);
  if (FORBIDDEN.test(strip(html))) problems.push(`${path}: forbidden location wording`);
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    if (href.startsWith("/")) links.set(href, path);
  }
}

for (const [href, from] of links) {
  const url = new URL(href, base);
  const res = await fetch(url, { redirect: "manual" });
  if (res.status >= 400) problems.push(`dead link ${href} (on ${from}) → ${res.status}`);
  const pre = url.searchParams.get("behandeling") ?? url.searchParams.get("treatment");
  if (pre && treatmentIds.size && !treatmentIds.has(pre)) problems.push(`booking link preselects unknown treatment "${pre}" (on ${from})`);
}

console.log(`Checked ${pages.length} pages and ${links.size} internal links.`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("All checks passed.");
