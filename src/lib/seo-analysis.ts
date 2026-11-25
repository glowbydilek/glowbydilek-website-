/**
 * Yoast-style SEO analysis for the admin SEO screen. Pure functions, no I/O:
 * the snippet checks run on the title/description/path, the content checks on
 * text extracted from the live page (H1, intro, body, images, links).
 */

export type CheckStatus = "good" | "ok" | "bad";
export type SeoCheck = { id: string; status: CheckStatus; text: string };

export type SnippetInput = { keyword: string; title: string; description: string; path: string; noindex?: boolean; brand?: string };
export type ContentInput = { h1: string; intro: string; body: string; imagesWithoutAlt: number; images: number; internalLinks: number };

/** Lowercase, strip accents and punctuation so "Wenkbrauwen waxen" matches "wenkbrauwen-waxen". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ğüşıöç]+/g, " ")
    .trim();
}

export function containsKeyword(text: string, keyword: string): boolean {
  const k = normalize(keyword);
  if (!k) return false;
  return ` ${normalize(text)} `.includes(` ${k} `);
}

export function countWords(text: string): number {
  const n = normalize(text);
  return n ? n.split(/\s+/).length : 0;
}

/** Occurrences of the keyword phrase in the text. */
export function keywordCount(text: string, keyword: string): number {
  const k = normalize(keyword);
  if (!k) return 0;
  const hay = ` ${normalize(text)} `;
  let n = 0;
  let i = hay.indexOf(` ${k} `);
  while (i !== -1) {
    n++;
    i = hay.indexOf(` ${k} `, i + k.length + 1);
  }
  return n;
}

export function snippetChecks(i: SnippetInput): SeoCheck[] {
  const out: SeoCheck[] = [];
  const kw = i.keyword.trim();
  const tl = i.title.trim().length;
  const dl = i.description.trim().length;

  if (i.noindex) out.push({ id: "noindex", status: "bad", text: "Deze pagina staat op ‘niet laten vinden’ (noindex): Google toont haar niet." });

  if (!kw) out.push({ id: "keyword", status: "bad", text: "Geen focus-zoekwoord. Vul in waarop klanten zoeken, bijvoorbeeld ‘wenkbrauwen waxen amsterdam’." });
  else {
    const inTitle = containsKeyword(i.title, kw);
    const atStart = inTitle && normalize(i.title).indexOf(normalize(kw)) <= normalize(i.title).length / 2;
    out.push(
      inTitle
        ? { id: "kw-title", status: atStart ? "good" : "ok", text: atStart ? "Focus-zoekwoord staat vooraan in de SEO-titel." : "Focus-zoekwoord staat in de titel; nog beter vooraan." }
        : { id: "kw-title", status: "bad", text: "Focus-zoekwoord ontbreekt in de SEO-titel." },
    );
    out.push(
      containsKeyword(i.description, kw)
        ? { id: "kw-desc", status: "good", text: "Focus-zoekwoord staat in de meta-omschrijving." }
        : { id: "kw-desc", status: "bad", text: "Focus-zoekwoord ontbreekt in de meta-omschrijving." },
    );
    const slugWords = normalize(i.path.replace(/[/-]/g, " "));
    const kwWords = normalize(kw).split(" ").filter((w) => w.length > 2 && w !== "amsterdam");
    const hit = kwWords.filter((w) => slugWords.includes(w)).length;
    out.push(
      kwWords.length && hit === kwWords.length
        ? { id: "kw-url", status: "good", text: "Het adres (URL) bevat het zoekwoord." }
        : hit > 0
          ? { id: "kw-url", status: "ok", text: "Het adres bevat een deel van het zoekwoord. (Adressen veranderen we niet zonder doorverwijzing.)" }
          : { id: "kw-url", status: "ok", text: "Het zoekwoord staat niet in het adres. Geen probleem als titel en tekst het wel bevatten." },
    );
  }

  out.push(
    tl >= 30 && tl <= 60
      ? { id: "title-len", status: "good", text: `SEO-titel heeft een goede lengte (${tl} tekens).` }
      : tl > 60 && tl <= 65
        ? { id: "title-len", status: "ok", text: `SEO-titel is iets lang (${tl} tekens); Google kan hem afkappen.` }
        : { id: "title-len", status: "bad", text: tl < 30 ? `SEO-titel is kort (${tl} tekens). Gebruik 30–60 tekens.` : `SEO-titel is te lang (${tl} tekens). Maximaal 60.` },
  );
  out.push(
    dl >= 120 && dl <= 160
      ? { id: "desc-len", status: "good", text: `Meta-omschrijving heeft een goede lengte (${dl} tekens).` }
      : (dl >= 70 && dl < 120) || (dl > 160 && dl <= 175)
        ? { id: "desc-len", status: "ok", text: `Meta-omschrijving: ${dl} tekens. Ideaal is 120–160.` }
        : { id: "desc-len", status: "bad", text: dl < 70 ? `Meta-omschrijving is te kort (${dl} tekens).` : `Meta-omschrijving is te lang (${dl} tekens); Google kapt af.` },
  );
  const local = /amsterdam/i.test(`${i.title} ${i.description}`);
  out.push(
    local
      ? { id: "local", status: "good", text: "‘Amsterdam’ staat in titel of omschrijving (lokaal gevonden worden)." }
      : { id: "local", status: "ok", text: "Noem ‘Amsterdam’ (of Amsterdam-Noord) in titel of omschrijving voor lokale zoekopdrachten." },
  );
  return out;
}

export function contentChecks(c: ContentInput, keyword: string): SeoCheck[] {
  const out: SeoCheck[] = [];
  const kw = keyword.trim();
  const words = countWords(c.body);
  out.push(
    words >= 300
      ? { id: "words", status: "good", text: `De pagina heeft genoeg tekst (${words} woorden).` }
      : words >= 150
        ? { id: "words", status: "ok", text: `De pagina heeft ${words} woorden; 300+ helpt Google beter.` }
        : { id: "words", status: "bad", text: `Weinig tekst op de pagina (${words} woorden).` },
  );
  if (kw) {
    out.push(
      containsKeyword(c.h1, kw)
        ? { id: "kw-h1", status: "good", text: "Focus-zoekwoord staat in de hoofdkop (H1)." }
        : { id: "kw-h1", status: "ok", text: "Focus-zoekwoord staat niet letterlijk in de hoofdkop (H1)." },
    );
    out.push(
      containsKeyword(c.intro, kw)
        ? { id: "kw-intro", status: "good", text: "Focus-zoekwoord staat in de eerste alinea." }
        : { id: "kw-intro", status: "ok", text: "Focus-zoekwoord staat niet in de eerste alinea." },
    );
    const n = keywordCount(c.body, kw);
    const density = words ? (n * countWords(kw) * 100) / words : 0;
    out.push(
      n === 0
        ? { id: "density", status: "bad", text: "Het focus-zoekwoord komt niet voor in de tekst." }
        : density > 3.5
          ? { id: "density", status: "bad", text: `Zoekwoord komt te vaak voor (${n}×, ${density.toFixed(1)}%). Dat oogt als spam.` }
          : { id: "density", status: n >= 2 ? "good" : "ok", text: `Zoekwoord komt ${n}× voor in de tekst (${density.toFixed(1)}%).` },
    );
  }
  out.push(
    c.images === 0
      ? { id: "alt", status: "ok", text: "Geen afbeeldingen op de pagina." }
      : c.imagesWithoutAlt === 0
        ? { id: "alt", status: "good", text: `Alle ${c.images} afbeeldingen hebben een omschrijving (alt-tekst).` }
        : { id: "alt", status: "bad", text: `${c.imagesWithoutAlt} van ${c.images} afbeeldingen missen een omschrijving (alt-tekst).` },
  );
  out.push(
    c.internalLinks >= 3
      ? { id: "links", status: "good", text: `Goede interne links (${c.internalLinks}).` }
      : { id: "links", status: "ok", text: `Weinig interne links (${c.internalLinks}).` },
  );
  return out;
}

export function overall(checks: SeoCheck[]): CheckStatus {
  if (!checks.length) return "ok";
  const bad = checks.filter((c) => c.status === "bad").length;
  const good = checks.filter((c) => c.status === "good").length;
  if (bad === 0 && good >= checks.length * 0.7) return "good";
  if (bad <= 1) return "ok";
  return "bad";
}

/** Extract the parts the content checks need from a page's HTML (browser only: uses DOMParser). */
export function extractContent(html: string, origin: string): ContentInput {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const main = doc.querySelector("main") ?? doc.body;
  main.querySelectorAll("script,style,noscript,form,nav").forEach((e) => e.remove());
  const h1 = main.querySelector("h1")?.textContent ?? "";
  const intro = [...main.querySelectorAll("p")].map((p) => p.textContent ?? "").find((t) => t.trim().length > 40) ?? "";
  const imgs = [...main.querySelectorAll("img")].filter((img) => img.getAttribute("aria-hidden") !== "true");
  const links = [...main.querySelectorAll("a[href]")].filter((a) => {
    const h = a.getAttribute("href") ?? "";
    return h.startsWith("/") || h.startsWith(origin);
  });
  return {
    h1,
    intro,
    body: main.textContent ?? "",
    images: imgs.length,
    imagesWithoutAlt: imgs.filter((img) => !(img.getAttribute("alt") ?? "").trim() && img.getAttribute("role") !== "presentation").length,
    internalLinks: new Set(links.map((a) => a.getAttribute("href"))).size,
  };
}

/** Suggested focus keyword from a default SEO title: the part before " in Amsterdam", "," or "|". */
export function suggestKeyword(title: string): string {
  const head = title.split(/\s+in\s+amsterdam|\s+amsterdam|[,|:–—(]/i)[0] ?? "";
  return head.trim().toLowerCase();
}
