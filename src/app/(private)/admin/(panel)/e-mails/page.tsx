import Link from "next/link";
import { TemplateForm } from "@/components/private/cms/TemplateForm";
import { Card, PageHeader } from "@/components/private/ui";
import { loadTemplate } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { notificationTemplates } from "@/lib/db/schema";
import { TEMPLATE_KEYS, TEMPLATE_LABELS, type TemplateKey } from "@/lib/notifications/templates";

export const metadata = { title: "E-mailteksten" };

export default async function Emails({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const key = (TEMPLATE_KEYS.includes(sp.mail as TemplateKey) ? sp.mail : "confirmed") as TemplateKey;
  const locale = sp.taal === "en" ? "en" : "nl";
  const db = getDb();
  const [t, customRows] = await Promise.all([loadTemplate(db, key, locale), db.select({ key: notificationTemplates.key }).from(notificationTemplates)]);
  return (
    <>
      <PageHeader title="E-mailteksten" subtitle="De berichten die klanten automatisch ontvangen. Datum, tijd en behandeling worden automatisch ingevuld." />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[16rem_1fr]">
        <Card>
          <ul className="space-y-1">
            {TEMPLATE_KEYS.map((k) => (
              <li key={k}>
                <Link href={`/admin/e-mails?mail=${k}&taal=${locale}`} aria-current={k === key ? "page" : undefined} className={`flex min-h-11 items-center rounded-xl px-3 text-sm ${k === key ? "bg-ink text-paper" : "hover:bg-ink/6"}`}>{TEMPLATE_LABELS[k]}</Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={TEMPLATE_LABELS[key]} actions={<span className="inline-flex rounded-full bg-surface p-1 text-sm">{(["nl", "en"] as const).map((l) => <Link key={l} href={`/admin/e-mails?mail=${key}&taal=${l}`} className={`rounded-full px-3 py-1.5 ${l === locale ? "bg-ink text-paper" : ""}`}>{l.toUpperCase()}</Link>)}</span>}>
          <TemplateForm key={`${key}-${locale}`} k={key} locale={locale} subject={t.subject} body={t.body} custom={customRows.some((r) => r.key === key)} />
        </Card>
      </div>
    </>
  );
}
