import Link from "next/link";
import { requireCan } from "@/lib/auth/session";
import { Card, PageHeader, Stat } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { formatCents } from "@/lib/finance/money";
import { financeReport } from "@/lib/finance/service";
import { getPanelLang } from "@/lib/private/panelLangServer";
import { todayLocal } from "@/lib/time";

export const metadata = { title: "Openstaand (op rekening)" };

const dateNl = (d: string) => d.split("-").reverse().join("-");

/**
 * "Veresiye" / on account: every completed appointment with an agreed price
 * that has no payment and no invoice yet, over all time, grouped per
 * customer. Nothing is stored separately: as soon as a payment (pin, cash,
 * transfer…) is recorded on the appointment, it disappears from this list.
 */
export default async function OnAccount() {
  await requireCan("agenda", "finance");
  const lang = await getPanelLang();
  const tr = lang === "tr";
  const r = await financeReport(getDb(), { from: "2020-01-01", to: todayLocal(), label: "Alles" });
  const byCustomer = new Map<string, { cents: number; items: typeof r.unpaidAppointments }>();
  for (const u of r.unpaidAppointments) {
    const c = byCustomer.get(u.customer) ?? { cents: 0, items: [] };
    c.cents += u.agreedCents;
    c.items.push(u);
    byCustomer.set(u.customer, c);
  }
  const customers = [...byCustomer.entries()].sort((a, b) => b[1].cents - a[1].cents);
  const total = r.unpaidAppointments.reduce((s, u) => s + u.agreedCents, 0);

  return (
    <>
      <PageHeader
        title={tr ? "Veresiye (açık hesap)" : "Openstaand (op rekening)"}
        subtitle={
          tr
            ? "Tamamlanmış, fiyatı belli ama henüz ödenmemiş randevular. Randevuya PIN veya nakit ödeme girdiğinde buradan otomatik düşer."
            : "Afgeronde afspraken met een afgesproken prijs die nog niet betaald zijn. Leg je op de afspraak een betaling vast (pin of contant), dan verdwijnt hij hier vanzelf."
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Stat label={tr ? "Toplam açık bakiye" : "Totaal openstaand"} value={formatCents(total)} hint={tr ? `${r.unpaidAppointments.length} randevu` : `${r.unpaidAppointments.length} afspraak/afspraken`} />
        <Stat label={tr ? "Müşteri sayısı" : "Klanten"} value={String(customers.length)} />
      </div>
      {customers.length ? (
        <div className="space-y-4">
          {customers.map(([name, c]) => (
            <Card key={name} title={name} actions={<span className="font-semibold">{formatCents(c.cents)}</span>}>
              <ul className="divide-y divide-line text-sm">
                {c.items.map((u) => (
                  <li key={u.id}>
                    <Link href={`/agenda/afspraak/${u.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2">
                      <span>{dateNl(u.day)}</span>
                      <span className="flex items-center gap-3">
                        <span>{formatCents(u.agreedCents)}</span>
                        <span className="rounded-full border border-line px-3 py-1 text-xs text-accent-deep">{tr ? "Ödeme gir" : "Betaling vastleggen"} ›</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-muted">{tr ? "Açık hesap yok: fiyatı belli olan her şey ödendi veya faturalandı." : "Niets openstaand: alles met een afgesproken prijs is betaald of gefactureerd."}</p>
        </Card>
      )}
      {r.completedWithoutPrice > 0 && (
        <p className="mt-4 text-xs text-muted">
          {tr
            ? `${r.completedWithoutPrice} tamamlanmış randevunun fiyatı girilmemiş; fiyat girilene kadar burada görünmez.`
            : `${r.completedWithoutPrice} afgeronde afspraak/afspraken zonder afgesproken prijs: die verschijnen hier pas als er een prijs is.`}
        </p>
      )}
    </>
  );
}
