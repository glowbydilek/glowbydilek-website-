"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { audit } from "../db/audit";
import { getDb } from "../db/client";
import { packageItems, priceHistory, serviceGroups, serviceSections, treatments } from "../db/schema";
import { ensureSeeded } from "../db/seed";
import { invalidateContent } from "../cms/store";
import { asStatus, slugError, slugify, validateParts, validatePricing } from "../catalogue/validate";
import type { FormState } from "./authActions";

/**
 * Catalogue management (Admin → Behandelingen): sections, sub-categories,
 * treatments and packages. Every change is validated server-side, audited,
 * and published to the website immediately (status permitting).
 */
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const CONFIRM = "Bevestig dat je deze behandeling echt aanbiedt en dat de tekst klopt (vinkje onderaan).";

function refresh() {
  invalidateContent();
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/admin/behandelingen");
  revalidatePath("/sitemap.xml");
}

function names(f: FormData): { nameNl: string; nameEn: string } | { error: string } {
  const nameNl = str(f, "nameNl").slice(0, 120);
  const nameEn = str(f, "nameEn").slice(0, 120);
  if (!nameNl || !nameEn) return { error: "Vul de naam in het Nederlands en Engels in." };
  return { nameNl, nameEn };
}

// ────────────────────────────────────────────────────────────── Items

export async function itemAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const id = str(f, "id");
  const [t] = await db.select().from(treatments).where(eq(treatments.id, id));
  if (!t) return { error: "Behandeling niet gevonden." };
  const n = names(f);
  if ("error" in n) return n;
  const status = asStatus(str(f, "status"));
  if (!status) return { error: "Kies een status." };
  if (status === "published" && t.status !== "published" && f.get("confirm") !== "on") return { error: CONFIRM };
  const p = validatePricing({ mode: str(f, "pricingMode"), price: str(f, "price"), duration: str(f, "duration"), buffer: str(f, "buffer"), vat: str(f, "vat") });
  if (!p.ok) return { error: p.error };
  const bookableOnline = f.get("bookableOnline") === "on";
  if (bookableOnline && !p.value.durationMinutes) return { error: "Online boekbaar kan pas met een ingevulde duur." };
  if (bookableOnline && p.value.pricingMode === "on_request") return { error: "Bij ‘Prijs op aanvraag’ verloopt het via een aanvraag en prijsvoorstel; online tijdstippen kiezen is dan niet mogelijk." };

  const sectionId = str(f, "sectionId") || t.sectionId || "waxing";
  const [section] = await db.select().from(serviceSections).where(eq(serviceSections.id, sectionId));
  if (!section) return { error: "Kies een bestaande categorie." };
  const groupId = str(f, "groupId") || null;
  if (groupId) {
    const [g] = await db.select().from(serviceGroups).where(and(eq(serviceGroups.id, groupId), eq(serviceGroups.sectionId, sectionId)));
    if (!g) return { error: "De subcategorie hoort niet bij deze categorie." };
  }
  const slugNl = str(f, "slugNl").toLowerCase() || t.slugNl || slugify(n.nameNl);
  const slugEn = str(f, "slugEn").toLowerCase() || t.slugEn || slugify(n.nameEn);
  const siblings = (await db.select({ id: treatments.id, sectionId: treatments.sectionId, groupId: treatments.groupId, category: treatments.category, slugNl: treatments.slugNl, slugEn: treatments.slugEn }).from(treatments).where(ne(treatments.id, id))).filter(
    (r) => (r.sectionId ?? "waxing") === sectionId && (r.groupId ?? (sectionId === "waxing" ? r.category : null)) === groupId,
  );
  const e1 = slugError(slugNl, { taken: siblings.map((r) => r.slugNl ?? "") });
  const e2 = slugError(slugEn, { taken: siblings.map((r) => r.slugEn ?? "") });
  if (e1 || e2) return { error: e1 ?? e2! };
  const sort = Number(str(f, "sort") || t.sort);

  const changedPrice = t.pricingMode !== p.value.pricingMode || t.priceCents !== p.value.priceCents;
  await db
    .update(treatments)
    .set({
      ...n,
      descriptionNl: str(f, "descriptionNl").slice(0, 600),
      descriptionEn: str(f, "descriptionEn").slice(0, 600),
      ...p.value,
      sectionId,
      groupId,
      category: groupId ?? sectionId,
      slugNl,
      slugEn,
      status,
      sort: Number.isInteger(sort) ? sort : t.sort,
      active: status !== "archived",
      visible: f.get("visible") === "on",
      featured: f.get("featured") === "on",
      bookableOnline,
    })
    .where(eq(treatments.id, id));
  if (changedPrice) await db.insert(priceHistory).values({ itemId: id, pricingMode: p.value.pricingMode, priceCents: p.value.priceCents, userId: s.user.id });
  await audit(db, { userId: s.user.id, action: "catalogue.item.updated", entity: "treatment", entityId: id, details: { status, pricingMode: p.value.pricingMode, priceCents: p.value.priceCents, durationMinutes: p.value.durationMinutes } });
  refresh();
  return { ok: true, message: status === "published" ? "Opgeslagen en gepubliceerd (zichtbaar zodra ook de categorie gepubliceerd is)." : "Opgeslagen." };
}

export async function createItemAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  await ensureSeeded(db);
  const n = names(f);
  if ("error" in n) return n;
  const kind = str(f, "kind") === "package" ? "package" : "treatment";
  const sectionId = str(f, "sectionId");
  const [section] = await db.select().from(serviceSections).where(eq(serviceSections.id, sectionId));
  if (!section) return { error: "Kies een categorie." };
  if (kind === "package" && section.kind !== "packages") return { error: "Een pakket hoort in de categorie Pakketten." };
  const groupId = str(f, "groupId") || null;
  const slugNl = slugify(str(f, "slugNl") || n.nameNl);
  const slugEn = slugify(str(f, "slugEn") || n.nameEn);
  const siblings = (await db.select().from(treatments)).filter((r) => (r.sectionId ?? "waxing") === sectionId && (r.groupId ?? (sectionId === "waxing" ? r.category : null)) === groupId);
  const e = slugError(slugNl, { taken: siblings.map((r) => r.slugNl ?? "") }) ?? slugError(slugEn, { taken: siblings.map((r) => r.slugEn ?? "") });
  if (e) return { error: e };
  let id = `${sectionId}-${slugNl}`.slice(0, 60);
  for (let i = 2; (await db.select({ id: treatments.id }).from(treatments).where(eq(treatments.id, id))).length; i++) id = `${sectionId}-${slugNl}`.slice(0, 56) + `-${i}`;
  await db.insert(treatments).values({
    id,
    kind,
    category: groupId ?? sectionId,
    sectionId,
    groupId,
    slugNl,
    slugEn,
    status: "draft",
    nameNl: n.nameNl,
    nameEn: n.nameEn,
    descriptionNl: str(f, "descriptionNl").slice(0, 600),
    descriptionEn: str(f, "descriptionEn").slice(0, 600),
    pricingMode: "on_request",
    sort: 1000,
  });
  await audit(db, { userId: s.user.id, action: "catalogue.item.created", entity: "treatment", entityId: id, details: { kind, sectionId } });
  refresh();
  return { ok: true, message: `“${n.nameNl}” is aangemaakt als concept. Vul prijs, duur en teksten aan en publiceer wanneer je zeker bent.` };
}

export async function packagePartsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const id = str(f, "id");
  const [pkg] = await db.select().from(treatments).where(eq(treatments.id, id));
  if (!pkg || pkg.kind !== "package") return { error: "Pakket niet gevonden." };
  const all = await db.select({ id: treatments.id, kind: treatments.kind }).from(treatments);
  const treatmentIds = all.filter((r) => r.kind !== "package").map((r) => r.id);
  const parts = f
    .getAll("part")
    .map(String)
    .map((tid) => ({ treatmentId: tid, quantity: Number(f.get(`qty:${tid}`) || 1) }));
  const err = validateParts(parts, treatmentIds);
  if (err) return { error: err };
  await db.transaction(async (tx) => {
    await tx.delete(packageItems).where(eq(packageItems.packageId, id));
    await tx.insert(packageItems).values(parts.map((p, i) => ({ packageId: id, treatmentId: p.treatmentId, quantity: p.quantity, sort: i })));
  });
  await audit(db, { userId: s.user.id, action: "catalogue.package.parts", entity: "treatment", entityId: id, details: { parts } });
  refresh();
  return { ok: true, message: "De inhoud van het pakket is opgeslagen." };
}

// ─────────────────────────────────────────────── Sections & sub-categories

export async function sectionAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const id = str(f, "id");
  const [row] = await db.select().from(serviceSections).where(eq(serviceSections.id, id));
  if (!row) return { error: "Categorie niet gevonden." };
  const n = names(f);
  if ("error" in n) return n;
  const status = asStatus(str(f, "status"));
  if (!status) return { error: "Kies een status." };
  if (status === "published" && row.status !== "published" && f.get("confirm") !== "on") return { error: "Bevestig dat je deze categorie wilt publiceren (vinkje)." };
  if (id === "waxing" && status !== "published") return { error: "Waxbehandelingen is de basis van de website en blijft gepubliceerd." };
  await db.update(serviceSections).set({ ...n, status, sort: Number(str(f, "sort")) || row.sort }).where(eq(serviceSections.id, id));
  await audit(db, { userId: s.user.id, action: "catalogue.section.updated", entity: "section", entityId: id, details: { status } });
  refresh();
  return { ok: true, message: status === "published" ? "Opgeslagen. Gepubliceerde behandelingen in deze categorie zijn nu zichtbaar." : "Opgeslagen." };
}

export async function createSectionAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  await ensureSeeded(db);
  const n = names(f);
  if ("error" in n) return n;
  const slugNl = slugify(str(f, "slugNl") || n.nameNl);
  const slugEn = slugify(str(f, "slugEn") || n.nameEn);
  const existing = await db.select().from(serviceSections);
  const e = slugError(slugNl, { root: true, taken: existing.flatMap((r) => [r.slugNl, r.slugEn]) }) ?? slugError(slugEn, { root: true, taken: existing.flatMap((r) => [r.slugNl, r.slugEn]) });
  if (e) return { error: e };
  const id = slugNl.slice(0, 60);
  if (existing.some((r) => r.id === id)) return { error: "Er bestaat al een categorie met dit adres." };
  await db.insert(serviceSections).values({ id, kind: "treatments", slugNl, slugEn, ...n, status: "draft", sort: existing.length });
  await audit(db, { userId: s.user.id, action: "catalogue.section.created", entity: "section", entityId: id });
  refresh();
  return { ok: true, message: `Categorie “${n.nameNl}” aangemaakt als concept (/${slugNl}).` };
}

export async function createGroupAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  await ensureSeeded(db);
  const n = names(f);
  if ("error" in n) return n;
  const sectionId = str(f, "sectionId");
  const [section] = await db.select().from(serviceSections).where(eq(serviceSections.id, sectionId));
  if (!section || section.kind === "packages") return { error: "Kies een categorie voor deze subcategorie." };
  const slugNl = slugify(str(f, "slugNl") || n.nameNl);
  const slugEn = slugify(str(f, "slugEn") || n.nameEn);
  const siblings = await db.select().from(serviceGroups).where(eq(serviceGroups.sectionId, sectionId));
  const items = (await db.select().from(treatments)).filter((r) => (r.sectionId ?? "waxing") === sectionId && !(r.groupId ?? (sectionId === "waxing" ? r.category : null)));
  const taken = [...siblings.flatMap((g) => [g.slugNl, g.slugEn]), ...items.flatMap((i) => [i.slugNl ?? "", i.slugEn ?? ""])];
  const e = slugError(slugNl, { taken }) ?? slugError(slugEn, { taken });
  if (e) return { error: e };
  const id = `${sectionId}-${slugNl}`.slice(0, 60);
  await db.insert(serviceGroups).values({ id, sectionId, slugNl, slugEn, ...n, status: "draft", sort: siblings.length });
  await audit(db, { userId: s.user.id, action: "catalogue.group.created", entity: "group", entityId: id });
  refresh();
  return { ok: true, message: `Subcategorie “${n.nameNl}” aangemaakt als concept.` };
}

export async function groupAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const id = str(f, "id");
  const [row] = await db.select().from(serviceGroups).where(eq(serviceGroups.id, id));
  if (!row) return { error: "Subcategorie niet gevonden." };
  const n = names(f);
  if ("error" in n) return n;
  const status = asStatus(str(f, "status"));
  if (!status) return { error: "Kies een status." };
  await db.update(serviceGroups).set({ ...n, status, sort: Number(str(f, "sort")) || row.sort }).where(eq(serviceGroups.id, id));
  await audit(db, { userId: s.user.id, action: "catalogue.group.updated", entity: "group", entityId: id, details: { status } });
  refresh();
  return { ok: true, message: "Opgeslagen." };
}
