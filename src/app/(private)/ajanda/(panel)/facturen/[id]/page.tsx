import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { InvoiceEditor, InvoiceOpButton, IssueForm, PaymentForm, VoidPaymentForm } from "@/components/private/finance/FinanceForms";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { customers, invoices, outbox } from "@/lib/db/schema";
import { getInvoiceSettings, invoicePaid, type Buyer } from "@/lib/finance/invoices";
import { invoiceReadiness, type ComputedLine, type InvoiceLine } from "@/lib/finance/invoice-core";
import { formatCents } from "@/lib/finance/money";
import { METHODS } from "@/lib/finance/service";
import { formatLocal, todayLocal } from "@/lib/time";

export const metadata = { title: "Factuur" };

const MAIL: Record<string, string> = { pending: "in de wachtrij", sending: "wordt verstuurd", sent: "verstuurd", failed: "mislukt", cancelled: "vervallen" };
const dateNl = (d: string | null) => (d ? d.split("-").reverse().join("-") : "—");

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const db = getDb();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) notFound();
  const [[c], settings, paid, mails] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, inv.customerId)),
    getInvoiceSettings(db),
    invoicePaid(db, id),
    db.select().from(outbox).where(eq(outbox.attachmentRef, id)).orderBy(desc(outbox.createdAt)),
  ]);
  const missing = invoiceReadiness(settings);
  const draft = inv.status === "draft";
  const credit = inv.kind === "credit";
  const buyer = inv.buyer as Buyer;
  const open = inv.totalCents - paid.cents;
  return (
    <>
      <PageHeader
        title={`${credit ? "Creditfactuur" : "Factuur"} ${inv.number ?? "(concept)"}`}
        subtitle={`${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim()}
        actions={<Badge tone={draft ? "neutral" : credit ? "cancelled" : open <= 0 ? "confirmed" : "pending"}>{draft ? "Concept" : credit ? "Credit" : open <= 0 ? "Betaald" : "Open"}</Badge>}
      />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          {draft ? (
            <Card title="Concept bewerken">
              <InvoiceEditor id={id} kind={credit ? "credit" : "invoice"} lines={inv.lines as InvoiceLine[]} buyer={buyer} supplyDate={inv.supplyDate} note={inv.note} />
            </Card>
          ) : (
            <Card title="Factuur">
              <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted">Nummer</dt>
                <dd>{inv.number}</dd>
                <dt className="text-muted">Factuurdatum</dt>
                <dd>{dateNl(inv.issueDate)}</dd>
                <dt className="text-muted">Klant</dt>
                <dd className="break-words">{buyer.name}{buyer.email ? ` · ${buyer.email}` : ""}</dd>
                {!credit && (
                  <>
                    <dt className="text-muted">Te betalen vóór</dt>
                    <dd>{dateNl(inv.dueDate)}</dd>
                  </>
                )}
              </dl>
              <ul className="mt-4 divide-y divide-line text-sm">
                {(inv.lines as ComputedLine[]).map((l, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0 break-words">{l.quantity} × {l.description}</span>
                    <span className="shrink-0">{formatCents(l.totalCents)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-sm">
                {inv.vatMode === "standard" && <span className="block text-muted">waarvan btw {formatCents(inv.vatCents)}</span>}
                <strong>Totaal {formatCents(inv.totalCents)}</strong>
              </p>
              <p className="mt-3 text-xs text-muted">Vastgelegd op {inv.issuedAt ? formatLocal(inv.issuedAt, "nl", { dateStyle: "medium", timeStyle: "short" }) : "—"} · controlecode {inv.pdfSha256?.slice(0, 12)}</p>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          <Card title="PDF">
            <a href={`/ajanda/facturen/${id}/pdf`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
              {draft ? "Voorbeeld bekijken (concept)" : "PDF openen / downloaden"}
            </a>
          </Card>
          {draft ? (
            <Card title="Uitgeven">
              {missing.length > 0 ? (
                <Notice tone="warning">
                  Nog niet mogelijk. Vul eerst aan: {missing.join(" · ")}. <Link href="/admin/bedrijf" className="underline">Bedrijfsgegevens</Link>
                </Notice>
              ) : (
                <p className="mb-3 text-sm text-muted">Bij uitgeven krijgt de factuur het volgende nummer en worden alle gegevens vastgelegd. Sla eerst je wijzigingen op.</p>
              )}
              <IssueForm id={id} kind={credit ? "credit" : "invoice"} ready={missing.length === 0} today={todayLocal()} />
              <div className="mt-4 border-t border-line pt-3">
                <InvoiceOpButton id={id} op="delete" label="Concept verwijderen" variant="ghost" confirm="Dit concept verwijderen?" />
              </div>
            </Card>
          ) : (
            <>
              <Card title="Versturen">
                {buyer.email ? (
                  <InvoiceOpButton id={id} op="email" label={`PDF mailen naar ${buyer.email}`} variant="primary" />
                ) : (
                  <p className="text-sm text-muted">Geen e-mailadres op de factuur: download de PDF en geef hem zelf mee.</p>
                )}
                {mails.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {mails.map((m) => (
                      <li key={m.id} className="flex justify-between gap-3">
                        <span>{formatLocal(m.createdAt, "nl", { dateStyle: "short", timeStyle: "short" })}</span>
                        <span className={m.status === "failed" ? "text-[#8e2f24]" : "text-muted"}>
                          {MAIL[m.status] ?? m.status}
                          {m.sentAt ? ` ${formatLocal(m.sentAt, "nl", { timeStyle: "short" })}` : ""}
                          {m.lastError ? ` (${m.lastError})` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted">&quot;Verstuurd&quot; betekent: de mailserver heeft het bericht geaccepteerd.</p>
              </Card>
              {!credit && (
                <Card title={`Betalingen (${formatCents(paid.cents)} van ${formatCents(inv.totalCents)})`}>
                  {paid.rows.length > 0 && (
                    <ul className="mb-3 divide-y divide-line text-sm">
                      {paid.rows.map((p) => (
                        <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                          <span>{dateNl(p.paidOn)} · {METHODS[p.method as keyof typeof METHODS] ?? p.method}</span>
                          <span>{formatCents(p.amountCents)}</span>
                          <VoidPaymentForm id={p.id} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {open > 0 && <PaymentForm customerId={inv.customerId} invoiceId={id} appointments={inv.appointmentId ? [] : []} today={todayLocal()} defaultAmount={open} defaultAppointmentId={inv.appointmentId ?? undefined} />}
                </Card>
              )}
              {!credit && (
                <Card title="Corrigeren">
                  <p className="mb-3 text-sm text-muted">Een uitgegeven factuur wijzig je niet. Maak een creditfactuur; daarna kun je zo nodig een nieuwe factuur maken.</p>
                  <InvoiceOpButton id={id} op="credit" label="Creditfactuur maken" confirm="Een creditfactuur (concept) maken voor deze factuur?" />
                </Card>
              )}
            </>
          )}
          <Link href={`/ajanda/klanten/${inv.customerId}`} className="inline-block text-sm text-accent-deep underline">Naar het klantprofiel</Link>
        </div>
      </div>
    </>
  );
}
