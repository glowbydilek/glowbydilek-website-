import Link from "next/link";
import { ExpenseForm, type ExpenseView } from "@/components/private/finance/ExpenseForm";
import { Badge, Card, Notice, PageHeader, Stat } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/core";
import { expenseSummary, expensesInPeriod, receiptsFor } from "@/lib/expenses/service";
import { centsToInput, formatCents } from "@/lib/finance/money";
import { periodFor } from "@/lib/finance/service";
import { deleteReceiptAction } from "@/lib/private/financeActions";
import { todayLocal } from "@/lib/time";

export const metadata = { title: "Uitgaven" };

const TABS: [string, string][] = [["month", "Maand"], ["year", "Jaar"]];
const dateNl = (d: string) => d.split("-").reverse().join("-");

export default async function Expenses({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const kind = sp.p === "year" || sp.p === "custom" ? sp.p : "month";
  const period = periodFor(kind, todayLocal(), { from: sp.van, to: sp.tot });
  const db = getDb();
  const [rows, sum] = await Promise.all([expensesInPeriod(db, period.from, period.to), expenseSummary(db, period.from, period.to)]);
  const receipts = await receiptsFor(db, rows.map((r) => r.id));
  const view = (r: (typeof rows)[number]): ExpenseView => ({
    id: r.id,
    spentOn: r.spentOn,
    category: r.category,
    vendor: r.vendor,
    description: r.description,
    amount: centsToInput(r.amountCents),
    vatRate: r.vatRateBp != null ? String(r.vatRateBp / 100).replace(".", ",") : "",
    vatAmount: r.vatRateBp == null && r.vatCents != null ? centsToInput(r.vatCents) : "",
    status: r.status,
    notes: r.notes ?? "",
  });
  return (
    <>
      <PageHeader title="Uitgaven" subtitle="Inkoop en kosten met btw en bon. Alleen wat je zelf invoert; er wordt niets geschat." />
      <nav aria-label="Periode" className="mb-4 flex flex-wrap gap-1 rounded-full bg-white p-1 text-sm shadow-sm">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/agenda/uitgaven?p=${k}`} aria-current={k === kind ? "page" : undefined} className={`rounded-full px-4 py-2 ${k === kind ? "bg-ink text-paper" : "hover:bg-ink/6"}`}>{l}</Link>
        ))}
      </nav>
      <p className="mb-4 text-sm text-muted">{period.label}: {dateNl(period.from)} t/m {dateNl(period.to)}</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Uitgaven (incl. btw)" value={formatCents(sum.totalCents)} />
        <Stat label="Btw op uitgaven" value={formatCents(sum.vatCents)} hint={sum.withoutVat ? `${sum.withoutVat} zonder btw-bedrag` : "Volgens de ingevoerde bonnen"} />
        <Stat label="Nog te betalen" value={formatCents(sum.openCents)} />
      </div>
      <div className="space-y-5">
        <Card title="Nieuwe uitgave">
          <ExpenseForm e={{ id: null, spentOn: todayLocal(), category: "products", vendor: "", description: "", amount: "", vatRate: "", vatAmount: "", status: "paid", notes: "" }} />
        </Card>
        <Card title="Uitgaven in deze periode">
          {rows.length ? (
            <div className="space-y-3">
              {rows.map((r) => (
                <details key={r.id} className="rounded-2xl border border-line p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{dateNl(r.spentOn)} · {r.vendor || EXPENSE_CATEGORIES[r.category]}{r.description ? ` — ${r.description}` : ""}</span>
                    <span className="flex items-center gap-2 text-sm">
                      <strong>{formatCents(r.amountCents)}</strong>
                      {r.status !== "paid" && <Badge tone={r.status === "open" ? "pending" : "cancelled"}>{r.status === "open" ? "Open" : "Vervallen"}</Badge>}
                      {receipts.some((x) => x.expenseId === r.id) && <Badge tone="done">Bon</Badge>}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <ExpenseForm e={view(r)} />
                    {receipts.filter((x) => x.expenseId === r.id).map((x) => (
                      <form key={x.id} action={deleteReceiptAction} className="flex flex-wrap items-center gap-3 text-sm">
                        <input type="hidden" name="receiptId" value={x.id} />
                        <a href={`/agenda/uitgaven/bon/${x.id}`} target="_blank" rel="noopener" className="underline">{x.filename}</a>
                        <span className="text-muted">{Math.ceil(x.size / 1024)} kB</span>
                        <button className="min-h-11 text-[#8e2f24] underline">Bon verwijderen</button>
                      </form>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Nog geen uitgaven in deze periode.</p>
          )}
        </Card>
        <Notice tone="info">Bonnen worden privé in de database bewaard (niet via een openbare link) en zitten in de databaseback-up. Bewaar ze ook volgens de fiscale bewaarplicht (7 jaar).</Notice>
      </div>
    </>
  );
}
