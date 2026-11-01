import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import type { DB } from "../db/client";
import { expenseReceipts, expenses } from "../db/schema";
import { EXPENSE_CATEGORIES, RECEIPT_MAX, receiptKind } from "./core";

export async function expensesInPeriod(db: DB, from: string, to: string) {
  return db.select().from(expenses).where(and(gte(expenses.spentOn, from), lte(expenses.spentOn, to))).orderBy(desc(expenses.spentOn), desc(expenses.id));
}

export async function expenseSummary(db: DB, from: string, to: string) {
  const rows = (await expensesInPeriod(db, from, to)).filter((e) => e.status !== "void");
  const byCat = new Map<string, { cents: number; vatCents: number; count: number }>();
  for (const e of rows) {
    const c = byCat.get(e.category) ?? { cents: 0, vatCents: 0, count: 0 };
    c.cents += e.amountCents;
    c.vatCents += e.vatCents ?? 0;
    c.count++;
    byCat.set(e.category, c);
  }
  return {
    totalCents: rows.reduce((s, e) => s + e.amountCents, 0),
    vatCents: rows.reduce((s, e) => s + (e.vatCents ?? 0), 0),
    openCents: rows.filter((e) => e.status === "open").reduce((s, e) => s + e.amountCents, 0),
    withoutVat: rows.filter((e) => e.vatCents == null).length,
    byCategory: [...byCat.entries()].map(([k, v]) => ({ category: k, label: EXPENSE_CATEGORIES[k] ?? k, ...v })).sort((a, b) => b.cents - a.cents),
  };
}

export class ReceiptError extends Error {}

export async function addReceipt(db: DB, expenseId: number, file: File) {
  if (file.size === 0) throw new ReceiptError("Het bestand is leeg.");
  if (file.size > RECEIPT_MAX) throw new ReceiptError("Een bon mag maximaal 10 MB zijn.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = receiptKind(bytes, file.type);
  if (!mime) throw new ReceiptError("Alleen PDF, JPG, PNG of WebP.");
  const [e] = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.id, expenseId));
  if (!e) throw new ReceiptError("Uitgave niet gevonden.");
  const name = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "bon";
  await db.insert(expenseReceipts).values({ expenseId, filename: name, mime, size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), data: Buffer.from(bytes) });
}

export async function receiptsFor(db: DB, expenseIds: number[]) {
  if (!expenseIds.length) return [];
  const rows = await db.select({ id: expenseReceipts.id, expenseId: expenseReceipts.expenseId, filename: expenseReceipts.filename, size: expenseReceipts.size }).from(expenseReceipts).orderBy(asc(expenseReceipts.id));
  return rows.filter((r) => expenseIds.includes(r.expenseId));
}

export async function receiptFile(db: DB, id: number) {
  const [r] = await db.select().from(expenseReceipts).where(eq(expenseReceipts.id, id));
  return r ?? null;
}

export async function deleteReceipt(db: DB, id: number) {
  await db.delete(expenseReceipts).where(eq(expenseReceipts.id, id));
}

