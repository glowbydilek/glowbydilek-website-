"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { audit } from "../db/audit";
import { contentEntries, customPages, notificationTemplates, redirects, treatments } from "../db/schema";
import { BLANK_CUSTOM, validSlug } from "../cms/custom";
import { invalidateContent } from "../cms/store";
import { ContentError, discardDraft, editorValue, publish, resetToDefault, restoreVersion, saveDraft, type Loc } from "../cms/service";
import { PAGE_SECTIONS } from "../cms/registry";
import { validateTheme } from "../cms/theme";
import { validateAnalytics, validateBusiness, validateSocial, validateMenu } from "../cms/menu";
import { TEMPLATE_KEYS, validateTemplate, type TemplateKey } from "../notifications/templates";
import { allPages, matchPage, pagePath } from "@/i18n/config";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");
const loc = (v: string): Loc => (v === "en" ? "en" : v === "all" ? "all" : "nl");

function revalidateSite() {
  invalidateContent();
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
}

function parseJson(raw: string): unknown {
  if (raw.length > 400_000) throw new ContentError("Deze inhoud is te groot.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new ContentError("De inhoud kon niet worden gelezen.");
  }
}

/** Save draft / publish / discard / reset for one content document. */
export async function contentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const docKey = str(f, "docKey");
  const locale = loc(str(f, "locale"));
  const op = str(f, "op");
  try {
    if (op === "save" || op === "publish" || op === "preview") {
      let data = parseJson(str(f, "data"));
      if (docKey === "menu") data = validateMenu(data);
      if (docKey === "business") {
        const b = validateBusiness(data);
        if (b.errors.length) return { error: b.errors.join(" ") };
        data = b.value;
      }
      if (docKey === "social") {
        const v = validateSocial(data);
        if (v.errors.length) return { error: v.errors.join(" ") };
        data = v.value;
      }
      if (docKey === "analytics") {
        const v = validateAnalytics(data);
        if (v.errors.length) return { error: v.errors.join(" ") };
        data = v.value;
      }
      if (docKey === "theme") {
        const v = validateTheme(data);
        if (v.errors.length) return { error: v.errors.join(" ") };
        data = v.theme;
      }
      await saveDraft(db, docKey, locale, data, s.user.id);
    }
    if (op === "publish") {
      const r = await publish(db, docKey, locale, s.user.id, str(f, "note"));
      revalidateSite();
      return { ok: true, message: `Gepubliceerd (versie ${r.version}). De website is bijgewerkt.${r.warnings.length ? ` Let op: ${r.warnings.join(", ")}.` : ""}` };
    }
    if (op === "preview") {
      const path = str(f, "path");
      redirect(`/api/preview?path=${encodeURIComponent(path || "/")}`);
    }
    if (op === "discard") {
      await discardDraft(db, docKey, locale, s.user.id);
      return { ok: true, message: "Concept verwijderd. De gepubliceerde versie blijft staan." };
    }
    if (op === "reset") {
      await resetToDefault(db, docKey, locale, s.user.id);
      revalidateSite();
      return { ok: true, message: "De oorspronkelijke tekst staat weer op de website. Eerdere versies blijven in de geschiedenis." };
    }
    return { ok: true, message: "Concept opgeslagen. Nog niet zichtbaar op de website — klik op Publiceren." };
  } catch (err) {
    if (err instanceof ContentError) return { error: err.message };
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[cms] content action failed:", err instanceof Error ? err.message.slice(0, 160) : err);
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }
}

export async function restoreVersionAction(f: FormData) {
  const s = await assertOwner();
  const r = await restoreVersion(getDb(), Number(f.get("versionId")), s.user.id);
  redirect(`${str(f, "back")}${str(f, "back").includes("?") ? "&" : "?"}hersteld=1&taal=${r.locale}`);
}

export async function sectionsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const page = str(f, "page");
  const defs = PAGE_SECTIONS[page];
  if (!defs) return { error: "Onbekende pagina." };
  const order = f.getAll("order").map(String).filter((id) => defs.some((d) => d.id === id));
  const hidden = defs.filter((d) => !d.locked && f.get(`show-${d.id}`) !== "on").map((d) => d.id);
  const db = getDb();
  await saveDraft(db, `sections:${page}`, "all", { order, hidden }, s.user.id);
  await publish(db, `sections:${page}`, "all", s.user.id);
  revalidateSite();
  return { ok: true, message: "Volgorde en zichtbaarheid opgeslagen en gepubliceerd." };
}

// ─────────────────────────────────────────────────────── Treatments & prices

export async function treatmentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = str(f, "id");
  const db = getDb();
  const [t] = await db.select().from(treatments).where(eq(treatments.id, id));
  if (!t) return { error: "Behandeling niet gevonden." };
  const price = str(f, "price").replace(",", ".").trim();
  const duration = str(f, "duration").trim();
  const buffer = str(f, "buffer").trim();
  const priceCents = price === "" ? null : Math.round(Number(price) * 100);
  if (priceCents !== null && (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 100000)) return { error: "Controleer de prijs (bijv. 35 of 42,50)." };
  const durationMinutes = duration === "" ? null : Number(duration);
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480)) return { error: "De duur moet tussen 5 en 480 minuten liggen." };
  const bufferMinutes = buffer === "" ? 0 : Number(buffer);
  if (!Number.isInteger(bufferMinutes) || bufferMinutes < 0 || bufferMinutes > 120) return { error: "De opruimtijd moet tussen 0 en 120 minuten liggen." };
  const bookableOnline = f.get("bookableOnline") === "on";
  if (bookableOnline && !durationMinutes) return { error: "Een behandeling is pas online boekbaar als de duur is ingevuld." };
  const nameNl = str(f, "nameNl").trim().slice(0, 120);
  const nameEn = str(f, "nameEn").trim().slice(0, 120);
  if (!nameNl || !nameEn) return { error: "Vul de naam in het Nederlands en Engels in." };
  await db
    .update(treatments)
    .set({
      nameNl,
      nameEn,
      descriptionNl: str(f, "descriptionNl").slice(0, 600),
      descriptionEn: str(f, "descriptionEn").slice(0, 600),
      priceCents,
      priceFrom: f.get("priceFrom") === "on",
      durationMinutes,
      bufferMinutes,
      active: f.get("active") === "on",
      visible: f.get("visible") === "on",
      featured: f.get("featured") === "on",
      bookableOnline,
    })
    .where(eq(treatments.id, id));
  await audit(db, { userId: s.user.id, action: "treatment.updated", entity: "treatment", entityId: id, details: { priceCents, durationMinutes, bufferMinutes } });
  revalidateSite();
  return { ok: true, message: "Opgeslagen. De website en de agenda gebruiken direct de nieuwe gegevens." };
}

// ──────────────────────────────────────────────────────────────── Redirects

const PATH = /^\/[a-z0-9\-/]*$/;

export async function redirectAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  if (str(f, "op") === "delete") {
    await db.delete(redirects).where(eq(redirects.id, Number(f.get("id"))));
    await audit(db, { userId: s.user.id, action: "redirect.deleted", entityId: Number(f.get("id")) });
    return { ok: true, message: "Doorverwijzing verwijderd." };
  }
  const from = str(f, "from").trim().toLowerCase().replace(/\/+$/, "") || "/";
  const to = str(f, "to").trim();
  if (!PATH.test(from) || from === "/") return { error: "Het oude adres moet beginnen met / (bijv. /oude-pagina)." };
  if (matchPage(from)) return { error: "Dit adres is een bestaande pagina en kan niet worden doorverwezen." };
  if (/^\/(admin|agenda|ajanda|login|api|_next|media)(\/|$)/.test(from)) return { error: "Dit adres is gereserveerd." };
  const validTargets = new Set(allPages().flatMap((p) => [pagePath("nl", p), pagePath("en", p)]));
  if (!validTargets.has(to) && !/^\/(en\/)?info\/[a-z0-9-]+$/.test(to)) return { error: "Kies een bestaande pagina als nieuw adres." };
  await db.insert(redirects).values({ fromPath: from, toPath: to, permanent: f.get("permanent") !== "off" }).onDuplicateKeyUpdate({ set: { toPath: to } });
  await audit(db, { userId: s.user.id, action: "redirect.saved", details: { from, to } });
  return { ok: true, message: `Doorverwijzing ${from} → ${to} opgeslagen.` };
}

// ───────────────────────────────────────────────────────── Email templates

export async function templateAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const key = str(f, "key") as TemplateKey;
  const locale = str(f, "locale") === "en" ? "en" : "nl";
  if (!TEMPLATE_KEYS.includes(key)) return { error: "Onbekende e-mail." };
  const db = getDb();
  if (str(f, "op") === "reset") {
    await db.delete(notificationTemplates).where(eq(notificationTemplates.key, key));
    await audit(db, { userId: s.user.id, action: "template.reset", entityId: key });
    return { ok: true, message: "De standaardtekst wordt weer gebruikt." };
  }
  const t = { subject: str(f, "subject").trim(), body: str(f, "body").replace(/\r\n/g, "\n").trim() };
  const errors = validateTemplate(key, t);
  if (errors.length) return { error: errors.join(" ") };
  await db.insert(notificationTemplates).values({ key, locale, ...t }).onDuplicateKeyUpdate({ set: t });
  await audit(db, { userId: s.user.id, action: "template.saved", entityId: `${key}|${locale}` });
  return { ok: true, message: "E-mailtekst opgeslagen. Nieuwe e-mails gebruiken deze tekst." };
}

export async function goToPreview(f: FormData) {
  await assertOwner();
  redirect(`/api/preview?path=${encodeURIComponent(str(f, "path") || "/")}`);
}

// ───────────────────────────────────────────────────────── Custom pages

export async function createCustomPageAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const slugNl = str(f, "slugNl").trim().toLowerCase();
  const slugEn = str(f, "slugEn").trim().toLowerCase();
  if (!validSlug(slugNl) || !validSlug(slugEn)) return { error: "Gebruik alleen kleine letters, cijfers en streepjes (bijv. cadeaubon)." };
  const db = getDb();
  let id: number;
  try {
    const [res] = (await db.insert(customPages).values({ slugNl, slugEn })) as unknown as [{ insertId: number }];
    id = res.insertId;
  } catch {
    return { error: "Dit adres bestaat al. Kies een ander adres." };
  }
  for (const l of ["nl", "en"] as const) await saveDraft(db, `custom:${id}`, l, { ...BLANK_CUSTOM, title: str(f, l === "nl" ? "titleNl" : "titleEn") }, s.user.id);
  await audit(db, { userId: s.user.id, action: "custom_page.created", entityId: id });
  redirect(`/admin/paginas/info-${id}`);
}

export async function customPageSettingsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const db = getDb();
  if (str(f, "op") === "delete") {
    await db.delete(customPages).where(eq(customPages.id, id));
    await db.delete(contentEntries).where(eq(contentEntries.docKey, `custom:${id}`));
    await audit(db, { userId: s.user.id, action: "custom_page.deleted", entityId: id });
    revalidateSite();
    redirect("/admin/paginas");
  }
  const published = f.get("published") === "on";
  if (published) {
    const [nl, en] = await Promise.all(["nl", "en"].map((l) => editorValue(db, `custom:${id}`, l as Loc, BLANK_CUSTOM)));
    if (!nl.published || !en.published) return { error: "Publiceer eerst de Nederlandse én Engelse tekst; daarna kun je de pagina online zetten." };
  }
  await db.update(customPages).set({ published, noindex: f.get("noindex") === "on" }).where(eq(customPages.id, id));
  await audit(db, { userId: s.user.id, action: published ? "custom_page.published" : "custom_page.unpublished", entityId: id });
  revalidateSite();
  return { ok: true, message: published ? "De pagina staat online." : "De pagina is offline." };
}
