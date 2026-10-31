import Link from "next/link";
import { desc } from "drizzle-orm";
import { DeleteRedirect, RedirectForm } from "@/components/private/cms/RedirectForm";
import { SeoForm, type Seo } from "@/components/private/cms/SeoForm";
import { Card, PageHeader } from "@/components/private/ui";
import { categoryCopy, treatmentCopy } from "@/content/copy";
import { categoryIds, treatmentIds } from "@/content/slugs";
import { allPages, pagePath, routeKeys, type PageRef } from "@/i18n/config";
import { editorValue } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";
import { media, redirects } from "@/lib/db/schema";
import { staticPageMeta } from "@/lib/seo";

export const metadata = { title: "SEO" };

type Item = { key: string; label: string; ref: PageRef };
const items: Item[] = [
  ...routeKeys.map((k) => ({ key: k, label: staticPageMeta("nl", k).title, ref: { type: "static" as const, key: k } })),
  ...categoryIds.map((id) => ({ key: `category-${id}`, label: categoryCopy("nl", id).seoTitle, ref: { type: "category" as const, id } })),
  ...treatmentIds.map((id) => ({ key: `treatment-${id}`, label: treatmentCopy("nl", id).seoTitle, ref: { type: "treatment" as const, id } })),
];

function defaultsFor(item: Item, locale: "nl" | "en") {
  if (item.ref.type === "static") return staticPageMeta(locale, item.ref.key);
  if (item.ref.type === "category") {
    const c = categoryCopy(locale, item.ref.id);
    return { title: c.seoTitle, description: c.seoDescription };
  }
  const t = treatmentCopy(locale, item.ref.id);
  return { title: t.seoTitle, description: t.seoDescription };
}

export default async function SeoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const item = items.find((i) => i.key === sp.pagina) ?? items[0];
  const locale = sp.taal === "en" ? "en" : "nl";
  const db = getDb();
  const [ev, reds, imgs] = await Promise.all([
    editorValue(db, `seo:${item.key}`, locale, {}),
    db.select().from(redirects).orderBy(desc(redirects.createdAt)),
    db.select({ id: media.id, name: media.filename }).from(media).orderBy(desc(media.createdAt)).limit(100),
  ]);
  const targets = allPages().flatMap((p) => [pagePath("nl", p), pagePath("en", p)]);
  return (
    <>
      <PageHeader title="SEO & doorverwijzingen" subtitle="Titels en omschrijvingen voor Google, per pagina en per taal. Adressen van pagina's veranderen niet; oude adressen kun je doorverwijzen." />
      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <Card>
          <ul className="max-h-[36rem] space-y-0.5 overflow-y-auto text-sm">
            {items.map((i) => (
              <li key={i.key}>
                <Link href={`/admin/seo?pagina=${i.key}&taal=${locale}`} aria-current={i.key === item.key ? "page" : undefined} className={`block rounded-lg px-2.5 py-2 ${i.key === item.key ? "bg-charcoal text-ivory" : "hover:bg-charcoal/6"}`}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card title={item.label} actions={<span className="inline-flex rounded-full bg-ivory-50 p-1 text-sm">{(["nl", "en"] as const).map((l) => <Link key={l} href={`/admin/seo?pagina=${item.key}&taal=${l}`} className={`rounded-full px-3 py-1.5 ${l === locale ? "bg-charcoal text-ivory" : ""}`}>{l.toUpperCase()}</Link>)}</span>}>
            <SeoForm key={`${item.key}-${locale}`} seoKey={item.key} locale={locale} initial={(ev.value ?? {}) as Seo} defaults={defaultsFor(item, locale)} path={pagePath(locale, item.ref)} media={imgs} />
          </Card>
          <Card title="Doorverwijzingen">
            <RedirectForm targets={targets} />
            {reds.length > 0 && (
              <ul className="mt-4 divide-y divide-stone text-sm">
                {reds.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="break-all">{r.fromPath} → {r.toPath}</span>
                    <DeleteRedirect id={r.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
