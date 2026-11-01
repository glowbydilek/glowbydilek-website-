"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { audit } from "../db/audit";
import { getDb } from "../db/client";
import { setSetting } from "../db/settings";
import { products, protocols, stockMovements, treatments } from "../db/schema";
import { invalidateContent } from "../cms/store";
import { parseEuroToCents } from "../finance/money";
import { movementDelta, parseSteps, PRODUCT_CATEGORIES } from "../products/core";
import { isLocalDate } from "../time";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optInt = (v: string) => (v === "" ? null : Number.isInteger(Number(v)) ? Number(v) : NaN);

function refresh() {
  revalidatePath("/admin/producten");
  revalidatePath("/producten");
  revalidatePath("/en/products");
  invalidateContent();
}

export async function productAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const name = str(f, "name").slice(0, 160);
  if (!name) return { error: "Vul de productnaam in." };
  const stockQty = optInt(str(f, "stockQty"));
  const reorderLevel = optInt(str(f, "reorderLevel"));
  if (Number.isNaN(stockQty) || Number.isNaN(reorderLevel)) return { error: "Voorraad en bestelniveau zijn hele getallen." };
  const cost = str(f, "cost");
  const costCents = cost ? parseEuroToCents(cost) : null;
  if (cost && costCents === null) return { error: "Controleer de inkoopprijs." };
  const expiresOn = str(f, "expiresOn") || null;
  if (expiresOn && !isLocalDate(expiresOn)) return { error: "Controleer de houdbaarheidsdatum." };
  const values = {
    name,
    brand: str(f, "brand").slice(0, 80),
    variant: str(f, "variant").slice(0, 120),
    category: PRODUCT_CATEGORIES[str(f, "category")] ? str(f, "category") : "other",
    mediaId: Number(str(f, "mediaId")) || null,
    description: str(f, "description").slice(0, 2000) || null,
    usage: str(f, "usage").slice(0, 2000) || null,
    notes: str(f, "notes").slice(0, 2000) || null,
    professionalOnly: f.get("professionalOnly") === "on",
    supplier: str(f, "supplier").slice(0, 160),
    costCents,
    reorderLevel,
    batch: str(f, "batch").slice(0, 60),
    expiresOn,
    status: str(f, "status") === "archived" ? "archived" : "active",
    showPublic: f.get("showPublic") === "on",
  };
  const id = Number(str(f, "id")) || null;
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
  } else {
    await db.insert(products).values({ ...values, stockQty });
  }
  await audit(db, { userId: s.user.id, action: id ? "product.updated" : "product.created", entity: "product", entityId: String(id ?? "new") });
  refresh();
  return { ok: true, message: "Product opgeslagen." };
}

/** Records a stock movement and updates the product's stock in one transaction. */
export async function stockAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const productId = Number(str(f, "productId"));
  const reason = str(f, "reason");
  const qty = Number(str(f, "quantity"));
  const delta = movementDelta(reason, qty);
  if (!delta) return { error: "Vul een aantal in (bij een correctie mag het negatief zijn)." };
  await db.transaction(async (tx) => {
    const [p] = await tx.select().from(products).where(eq(products.id, productId)).for("update");
    if (!p) throw new Error("not found");
    await tx.insert(stockMovements).values({ productId, quantity: delta, reason, note: str(f, "note").slice(0, 300) || null, userId: s.user.id });
    await tx.update(products).set({ stockQty: (p.stockQty ?? 0) + delta }).where(eq(products.id, productId));
  });
  await audit(db, { userId: s.user.id, action: "stock.movement", entity: "product", entityId: String(productId), details: { reason, delta } });
  refresh();
  return { ok: true, message: "Voorraad bijgewerkt." };
}

export async function protocolAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const treatmentId = str(f, "treatmentId");
  const [t] = await db.select({ id: treatments.id }).from(treatments).where(eq(treatments.id, treatmentId));
  if (!t) return { error: "Kies een behandeling." };
  const count = Math.min(20, Number(str(f, "count")) || 0);
  const raw = Array.from({ length: count }, (_, i) => ({
    title: str(f, `step${i}.title`),
    body: str(f, `step${i}.body`),
    productIds: f.getAll(`step${i}.products`).map(Number),
  }));
  const steps = parseSteps(raw);
  const notes = str(f, "notes").slice(0, 3000) || null;
  await db.insert(protocols).values({ treatmentId, steps, notes, userId: s.user.id }).onDuplicateKeyUpdate({ set: { steps, notes, userId: s.user.id } });
  await audit(db, { userId: s.user.id, action: "protocol.saved", entity: "treatment", entityId: treatmentId, details: { steps: steps.length } });
  refresh();
  return { ok: true, message: `Protocol opgeslagen (${steps.length} stap${steps.length === 1 ? "" : "pen"}).` };
}

export async function productsPublicAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  await setSetting(getDb(), "products_public", { enabled: f.get("enabled") === "on" });
  await audit(getDb(), { userId: s.user.id, action: "products.public", entity: "settings", entityId: "products_public", details: { enabled: f.get("enabled") === "on" } });
  refresh();
  return { ok: true, message: f.get("enabled") === "on" ? "De pagina Producten & verzorging staat online (alleen gemarkeerde producten)." : "De pagina Producten & verzorging staat uit." };
}
