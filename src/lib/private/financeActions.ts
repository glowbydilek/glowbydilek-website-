"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { audit } from "../db/audit";
import { defaultInvoiceSettings, setSetting, type InvoiceSettings } from "../db/settings";
import { createCredit, createDraft, deleteDraft, emailInvoice, InvoiceError, issueInvoice, updateDraft, type Buyer } from "../finance/invoices";
import { invoiceReadiness, type InvoiceLine } from "../finance/invoice-core";
import { parseEuroToCents } from "../finance/money";
import { FinanceError, recordPayment, voidPayment } from "../finance/service";
import { deliverSoon } from "../notifications/deliver";
import { todayLocal } from "../time";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => {
  const n = Number(str(f, k));
  return Number.isInteger(n) && n > 0 ? n : null;
};

function fail(err: unknown): FormState {
  if (err instanceof InvoiceError) return { error: [err.message, ...err.details].join(" · ") };
  if (err instanceof FinanceError) return { error: err.message };
  console.error("[finance] action failed:", err instanceof Error ? err.message.slice(0, 200) : err);
  return { error: "Er ging iets mis. Probeer het opnieuw." };
}

function refresh() {
  revalidatePath("/agenda", "layout");
}

export async function recordPaymentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const customerId = int(f, "customerId");
  const amount = parseEuroToCents(str(f, "amount"));
  if (!customerId) return { error: "Klant ontbreekt." };
  if (amount == null || amount <= 0) return { error: "Vul een bedrag in, bijvoorbeeld 45 of 45,50." };
  try {
    await recordPayment(
      getDb(),
      {
        customerId,
        appointmentId: int(f, "appointmentId"),
        invoiceId: int(f, "invoiceId"),
        amountCents: amount,
        method: str(f, "method"),
        paidOn: str(f, "paidOn") || todayLocal(),
        note: str(f, "note"),
        kind: str(f, "kind") === "refund" ? "refund" : "payment",
      },
      { userId: s.user.id },
    );
  } catch (err) {
    return fail(err);
  }
  refresh();
  return { ok: true, message: str(f, "kind") === "refund" ? "Terugbetaling vastgelegd." : "Betaling vastgelegd." };
}

export async function voidPaymentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = int(f, "id");
  if (!id) return { error: "Betaling ontbreekt." };
  try {
    await voidPayment(getDb(), id, str(f, "reason"), { userId: s.user.id });
  } catch (err) {
    return fail(err);
  }
  refresh();
  return { ok: true, message: "Betaling ongedaan gemaakt (blijft zichtbaar in de geschiedenis)." };
}

export async function createInvoiceAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const customerId = int(f, "customerId");
  if (!customerId) return { error: "Klant ontbreekt." };
  let id: number;
  try {
    id = await createDraft(getDb(), { customerId, appointmentId: int(f, "appointmentId") }, { userId: s.user.id });
  } catch (err) {
    return fail(err);
  }
  refresh();
  redirect(`/agenda/facturen/${id}`);
}

export async function saveInvoiceAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = int(f, "id");
  if (!id) return { error: "Factuur ontbreekt." };
  const desc = f.getAll("lineDescription").map(String);
  const qty = f.getAll("lineQuantity").map((v) => Number(v));
  const amt = f.getAll("lineAmount").map((v) => {
    const t = String(v).trim();
    const neg = t.startsWith("-") || t.startsWith("−");
    const c = parseEuroToCents(neg ? t.slice(1) : t);
    return c == null ? null : neg ? -c : c;
  });
  const vats = f.getAll("lineVat").map(String);
  const credit = str(f, "kind") === "credit";
  const lines: InvoiceLine[] = [];
  for (let i = 0; i < desc.length; i++) {
    if (!desc[i].trim() && amt[i] == null) continue;
    if (amt[i] == null) return { error: `Regel ${i + 1}: controleer het bedrag.` };
    const vat = (["standard", "reduced", "zero", "exempt"] as const).find((v) => v === vats[i]) ?? "standard";
    lines.push({ description: desc[i].trim().slice(0, 200), quantity: qty[i] || 1, unitCents: credit ? -Math.abs(amt[i]!) : amt[i]!, vat });
  }
  const buyer: Buyer = { name: str(f, "buyerName").slice(0, 120), email: str(f, "buyerEmail") || null, address: str(f, "buyerAddress").slice(0, 300) || null };
  const supply = str(f, "supplyDate");
  try {
    await updateDraft(getDb(), id, { lines, buyer, supplyDate: /^\d{4}-\d{2}-\d{2}$/.test(supply) ? supply : null, note: str(f, "note") }, { userId: s.user.id });
  } catch (err) {
    return fail(err);
  }
  refresh();
  return { ok: true, message: "Concept opgeslagen. Bekijk het voorbeeld en geef de factuur daarna uit." };
}

export async function invoiceOpAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = int(f, "id");
  if (!id) return { error: "Factuur ontbreekt." };
  const db = getDb();
  const ctx = { userId: s.user.id };
  const op = str(f, "op");
  try {
    if (op === "issue") {
      const paid = f.get("paidNow") === "on" ? { method: str(f, "method"), paidOn: str(f, "paidOn") || todayLocal() } : undefined;
      await issueInvoice(db, id, ctx, { paid });
      refresh();
      // The draft form disappears once issued: show the result on the page itself.
      redirect(`/agenda/facturen/${id}?melding=uitgegeven`);
    }
    if (op === "email") {
      await emailInvoice(db, id, ctx);
      await deliverSoon(db);
      refresh();
      return { ok: true, message: "De factuur staat in de verzendwachtrij. De status hieronder laat zien of hij echt is verstuurd." };
    }
    if (op === "credit") {
      const cid = await createCredit(db, id, ctx);
      refresh();
      redirect(`/agenda/facturen/${cid}`);
    }
    if (op === "delete") {
      await deleteDraft(db, id, ctx);
      refresh();
      redirect("/agenda/facturen?verwijderd=1");
    }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // redirect()
    return fail(err);
  }
  return { error: "Onbekende actie." };
}

export async function saveInvoiceSettingsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const rate = str(f, "vatRate").replace(",", ".");
  const rateBp = rate ? Math.round(Number(rate) * 100) : null;
  if (rate && (!Number.isFinite(rateBp) || rateBp! <= 0 || rateBp! > 5000)) return { error: "Vul een geldig btw-percentage in (bijvoorbeeld zoals je boekhouder het opgaf)." };
  const mode = str(f, "vatMode");
  const red = str(f, "reducedRate").replace(",", ".");
  const reducedRateBp = red ? Math.round(Number(red) * 100) : null;
  if (red && (!Number.isFinite(reducedRateBp) || reducedRateBp! < 0 || reducedRateBp! > 5000)) return { error: "Vul een geldig verlaagd btw-percentage in, of laat het leeg." };
  const v: InvoiceSettings = {
    ...defaultInvoiceSettings,
    legalName: str(f, "legalName").slice(0, 120),
    tradeName: str(f, "tradeName").slice(0, 120) || "Glow by Dilek",
    street: str(f, "street").slice(0, 120),
    postcode: str(f, "postcode").toUpperCase().slice(0, 12),
    city: str(f, "city").slice(0, 80),
    country: str(f, "country").slice(0, 60) || "Nederland",
    kvk: str(f, "kvk").replace(/\s/g, "").slice(0, 8),
    vatMode: mode === "standard" || mode === "exempt" || mode === "kor" ? mode : "",
    reducedRateBp: mode === "standard" ? reducedRateBp : null,
    vatNumber: str(f, "vatNumber").replace(/[\s.]/g, "").toUpperCase().slice(0, 14),
    vatRateBp: rateBp,
    exemptionText: str(f, "exemptionText").slice(0, 300),
    iban: str(f, "iban").replace(/\s/g, "").toUpperCase().slice(0, 34),
    accountHolder: str(f, "accountHolder").slice(0, 120),
    email: str(f, "email").slice(0, 190),
    phone: str(f, "phone").slice(0, 32),
    prefix: str(f, "prefix").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "GBD",
    paymentTermDays: Math.min(60, Math.max(0, Number(str(f, "paymentTermDays")) || 14)),
    footer: str(f, "footer").slice(0, 200),
  };
  await setSetting(getDb(), "invoice_settings", v, s.user.id);
  await audit(getDb(), { userId: s.user.id, action: "settings.invoice_saved" });
  revalidatePath("/admin/bedrijf");
  const missing = invoiceReadiness(v);
  return missing.length ? { ok: true, message: `Opgeslagen. Nog nodig voor facturen: ${missing.join(" · ")}.` } : { ok: true, message: "Opgeslagen. Je kunt nu facturen uitgeven." };
}

// ───────────────────────────────────────────────────────────── Expenses

export async function expenseAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const { validateExpense } = await import("../expenses/core");
  const { addReceipt, ReceiptError } = await import("../expenses/service");
  const { expenses } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");
  const v = validateExpense(
    { spentOn: str(f, "spentOn"), category: str(f, "category"), vendor: str(f, "vendor"), description: str(f, "description"), amount: str(f, "amount"), vatRate: str(f, "vatRate"), vatAmount: str(f, "vatAmount"), status: str(f, "status"), notes: str(f, "notes") },
    parseEuroToCents,
  );
  if (!v.ok) return { error: v.error };
  const db = getDb();
  let id = int(f, "id");
  if (id) await db.update(expenses).set(v.value).where(eq(expenses.id, id));
  else {
    const [res] = (await db.insert(expenses).values({ ...v.value, userId: s.user.id })) as unknown as [{ insertId: number }];
    id = res.insertId;
  }
  const file = f.get("receipt");
  if (file && typeof file === "object" && "size" in file && (file as File).size > 0) {
    try {
      await addReceipt(db, id!, file as File);
    } catch (err) {
      if (err instanceof ReceiptError) return { error: `Uitgave opgeslagen, maar de bon niet: ${err.message}` };
      throw err;
    }
  }
  await audit(db, { userId: s.user.id, action: "expense.saved", entity: "expense", entityId: id ?? undefined, details: { amountCents: v.value.amountCents } });
  revalidatePath("/agenda/uitgaven");
  revalidatePath("/agenda/financien");
  return { ok: true, message: "Uitgave opgeslagen." };
}

export async function deleteReceiptAction(f: FormData) {
  const s = await assertOwner();
  const { deleteReceipt } = await import("../expenses/service");
  const id = int(f, "receiptId");
  if (id) await deleteReceipt(getDb(), id);
  await audit(getDb(), { userId: s.user.id, action: "expense.receipt_deleted", entity: "receipt", entityId: id ?? undefined });
  revalidatePath("/agenda/uitgaven");
}
