import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { customers, invoices } from "@/lib/db/schema";
import { getInvoiceSettings } from "@/lib/finance/invoices";
import { invoiceReadiness } from "@/lib/finance/invoice-core";
import { formatCents } from "@/lib/finance/money";
import { paidByInvoice } from "@/lib/finance/service";

export const metadata = { title: "Facturen & PDF" };

const dateNl = (d: string | null) => (d ? d.split("-").reverse().join("-") : "—");

export default async function Invoices({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const db = getDb();
  const [rows, settings] = await Promise.all([
    db
      .select({ id: invoices.id, number: invoices.number, kind: invoices.kind, status: invoices.status, issueDate: invoices.issueDate, totalCents: invoices.totalCents, createdAt: invoices.createdAt, first: customers.firstName, last: customers.lastName })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt))
      .limit(200),
    getInvoiceSettings(db),
  ]);
  const paid = await paidByInvoice(db, rows.filter((r) => r.status === "issued").map((r) => r.id));
  const missing = invoiceReadiness(settings);
  return (
    <>
      <PageHeader title="Facturen & PDF" subtitle="Een factuur maak je vanuit een afspraak of klantprofiel. Uitgegeven facturen worden nooit meer gewijzigd." />
      {sp.verwijderd && <div className="mb-4"><Notice tone="success">✓ Concept verwijderd.</Notice></div>}
      {missing.length > 0 && (
        <div className="mb-4">
          <Notice tone="warning">
            Facturen uitgeven kan pas als je bedrijfsgegevens compleet zijn: {missing.join(" · ")}.{" "}
            <Link href="/admin/bedrijf" className="underline">Gegevens invullen</Link>
          </Notice>
        </div>
      )}
      <Card title="Overzichten als PDF">
        <ul className="flex flex-wrap gap-2 text-sm">
          {[
            ["/ajanda/financien/rapport?p=month", "Financieel overzicht (deze maand)"],
            ["/ajanda/financien/rapport?p=year", "Financieel overzicht (dit jaar)"],
            ["/ajanda/historie/rapport?p=month", "Activiteiten (deze maand)"],
            ["/admin/behandelingen/prijslijst", "Prijslijst"],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4">{label}</a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Andere periodes: kies ze in Financiën of Overzichten. Een behandeloverzicht per klant maak je in het klantprofiel.</p>
      </Card>
      <Card title={`Facturen (${rows.length})`} className="mt-5">
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const p = paid.get(r.id) ?? 0;
              const tone = r.status === "draft" ? "neutral" : r.kind === "credit" ? "cancelled" : p >= r.totalCents ? "confirmed" : "pending";
              const label = r.status === "draft" ? "Concept" : r.kind === "credit" ? "Credit" : p >= r.totalCents ? "Betaald" : p > 0 ? "Deels betaald" : "Open";
              return (
                <li key={r.id}>
                  <Link href={`/ajanda/facturen/${r.id}`} className="flex min-h-14 flex-wrap items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block font-medium">{r.number ?? "Concept"} · {r.first} {r.last}</span>
                      <span className="block text-sm text-muted">{r.issueDate ? dateNl(r.issueDate) : "nog niet uitgegeven"}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-medium">{r.status === "issued" ? formatCents(r.totalCents) : ""}</span>
                      <Badge tone={tone}>{label}</Badge>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nog geen facturen.</p>
        )}
      </Card>
    </>
  );
}
