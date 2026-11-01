import { NextResponse } from "next/server";
import { and, gte, isNull, lte } from "drizzle-orm";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { audit } from "@/lib/db/audit";
import { getDb } from "@/lib/db/client";
import { payments } from "@/lib/db/schema";
import { csvCell, EXPENSE_CATEGORIES } from "@/lib/expenses/core";
import { expensesInPeriod } from "@/lib/expenses/service";
import { centsToInput } from "@/lib/finance/money";
import { METHODS, periodFor } from "@/lib/finance/service";
import { todayLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

/** CSV for the accountant: payments and expenses in the period (no customer contact details). */
export async function GET(req: Request) {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const q = new URL(req.url).searchParams;
  const p = periodFor(q.get("p") ?? "month", todayLocal(), { from: q.get("van") ?? undefined, to: q.get("tot") ?? undefined });
  const db = getDb();
  const [pays, exps] = await Promise.all([
    db.select().from(payments).where(and(gte(payments.paidOn, p.from), lte(payments.paidOn, p.to), isNull(payments.voidedAt))),
    expensesInPeriod(db, p.from, p.to),
  ]);
  const rows: (string | number | null)[][] = [["soort", "datum", "categorie / methode", "omschrijving", "bedrag incl. btw", "btw", "status", "referentie"]];
  for (const x of pays) rows.push(["ontvangst", x.paidOn, METHODS[x.method as keyof typeof METHODS] ?? x.method, x.kind === "refund" ? "terugbetaling" : "betaling", centsToInput(x.amountCents), "", "", x.invoiceId ? `factuur #${x.invoiceId}` : x.appointmentId ? `afspraak #${x.appointmentId}` : ""]);
  for (const e of exps) rows.push(["uitgave", e.spentOn, EXPENSE_CATEGORIES[e.category] ?? e.category, [e.vendor, e.description].filter(Boolean).join(" — "), centsToInput(e.amountCents), e.vatCents != null ? centsToInput(e.vatCents) : "", e.status, `uitgave #${e.id}`]);
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  await audit(db, { userId: s.user.id, action: "report.finance_csv", entity: "finance", details: { from: p.from, to: p.to } });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financien-${p.from}-${p.to}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
