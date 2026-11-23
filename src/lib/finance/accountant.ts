import "server-only";
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { DB } from "../db/client";
import { expenseReceipts, invoices, payments } from "../db/schema";
import { csvCell, EXPENSE_CATEGORIES } from "../expenses/core";
import { expensesInPeriod } from "../expenses/service";
import { centsToInput } from "./money";
import { financePdf } from "./reports";
import { METHODS, type Period } from "./service";
import { buildZip, type ZipEntry } from "../zip";

const safe = (s: string) => s.replace(/[^\w.\-]+/g, "_").slice(0, 80);

/** Payments, issued invoices and expenses of the period as one CSV (no customer contact details). */
export async function accountantCsv(db: DB, p: Period): Promise<string> {
  const [pays, invs, exps] = await Promise.all([
    db.select().from(payments).where(and(gte(payments.paidOn, p.from), lte(payments.paidOn, p.to), isNull(payments.voidedAt))),
    db
      .select({ id: invoices.id, number: invoices.number, kind: invoices.kind, issueDate: invoices.issueDate, subtotalCents: invoices.subtotalCents, vatCents: invoices.vatCents, totalCents: invoices.totalCents })
      .from(invoices)
      .where(and(eq(invoices.status, "issued"), gte(invoices.issueDate, p.from), lte(invoices.issueDate, p.to)))
      .orderBy(asc(invoices.issueDate), asc(invoices.id)),
    expensesInPeriod(db, p.from, p.to),
  ]);
  const rows: (string | number | null)[][] = [["soort", "datum", "categorie / methode", "omschrijving", "bedrag excl. btw", "btw", "bedrag incl. btw", "status", "referentie"]];
  for (const i of invs) rows.push([i.kind === "credit" ? "creditfactuur" : "factuur", i.issueDate, "", i.number ?? "", centsToInput(i.subtotalCents), centsToInput(i.vatCents), centsToInput(i.totalCents), "uitgegeven", `factuur #${i.id}`]);
  for (const x of pays) rows.push(["ontvangst", x.paidOn, METHODS[x.method as keyof typeof METHODS] ?? x.method, x.kind === "refund" ? "terugbetaling" : "betaling", "", "", centsToInput(x.amountCents), "", x.invoiceId ? `factuur #${x.invoiceId}` : x.appointmentId ? `afspraak #${x.appointmentId}` : ""]);
  for (const e of exps) rows.push(["uitgave", e.spentOn, EXPENSE_CATEGORIES[e.category] ?? e.category, [e.vendor, e.description].filter(Boolean).join(" — "), "", e.vatCents != null ? centsToInput(e.vatCents) : "", centsToInput(e.amountCents), e.status, `uitgave #${e.id}`]);
  return "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
}

/**
 * One ZIP for the accountant: overview CSV, financial summary PDF, every
 * issued invoice PDF (unchanged, as stored when issued) and every expense receipt.
 */
export async function accountantZip(db: DB, p: Period): Promise<{ zip: Buffer; counts: { invoices: number; receipts: number } }> {
  const entries: ZipEntry[] = [];
  entries.push({ name: `overzicht-${p.from}-${p.to}.csv`, data: Buffer.from(await accountantCsv(db, p), "utf8") });
  entries.push({ name: `financieel-overzicht-${p.from}-${p.to}.pdf`, data: await financePdf(db, p) });
  const invs = await db
    .select({ id: invoices.id, number: invoices.number, pdf: invoices.pdf })
    .from(invoices)
    .where(and(eq(invoices.status, "issued"), gte(invoices.issueDate, p.from), lte(invoices.issueDate, p.to)))
    .orderBy(asc(invoices.issueDate), asc(invoices.id));
  let nInv = 0;
  for (const i of invs) {
    if (!i.pdf) continue;
    entries.push({ name: `facturen/${safe(i.number ?? `factuur-${i.id}`)}.pdf`, data: Buffer.from(i.pdf) });
    nInv++;
  }
  const exps = (await expensesInPeriod(db, p.from, p.to)).filter((e) => e.status !== "void");
  let nRec = 0;
  if (exps.length) {
    const recs = await db.select().from(expenseReceipts).where(inArray(expenseReceipts.expenseId, exps.map((e) => e.id))).orderBy(asc(expenseReceipts.id));
    const byId = new Map(exps.map((e) => [e.id, e]));
    for (const r of recs) {
      const e = byId.get(r.expenseId);
      const ext = r.filename.includes(".") ? r.filename.slice(r.filename.lastIndexOf(".")) : "";
      entries.push({ name: `bonnen/${e?.spentOn ?? "onbekend"}_uitgave-${r.expenseId}_${safe(e?.vendor || "bon")}${safe(ext)}`, data: Buffer.from(r.data) });
      nRec++;
    }
  }
  entries.push({
    name: "LEESMIJ.txt",
    data: Buffer.from(
      [
        `Glow by Dilek — administratie ${p.from} t/m ${p.to}`,
        "",
        "overzicht-….csv          facturen, ontvangsten en uitgaven (puntkomma-gescheiden, bedragen in euro)",
        "financieel-overzicht-….pdf samenvatting van de periode",
        `facturen/                 ${nInv} uitgegeven facturen (PDF zoals uitgegeven, ongewijzigd)`,
        `bonnen/                   ${nRec} bonnen van uitgaven`,
        "",
        "Er staan geen contactgegevens van klanten in de CSV. Alleen vastgelegde gegevens; er is niets geschat.",
      ].join("\r\n"),
      "utf8",
    ),
  });
  return { zip: buildZip(entries), counts: { invoices: nInv, receipts: nRec } };
}
