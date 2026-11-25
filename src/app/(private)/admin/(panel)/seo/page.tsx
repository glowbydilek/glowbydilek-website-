import { requireOwner } from "@/lib/auth/session";
import { asLocale } from "@/i18n/config";
import Link from "next/link";
import { and, desc, eq, like } from "drizzle-orm";
import { DeleteRedirect, RedirectForm } from "@/components/private/cms/RedirectForm";
import { SeoDot, SeoForm, type Seo } from "@/components/private/cms/SeoForm";
import { overall, snippetChecks, suggestKeyword } from "@/lib/seo-analysis";
import { Card, PageHeader } from "@/components/private/ui";
import { categoryCopy, treatmentCopy } from "@/content/copy";
import { postCopy } from "@/content/copy/blog";
import { categoryIds, postIds, treatmentIds } from "@/content/slugs";
import { allPages, pagePath, routeKeys, type PageRef } from "@/i18n/config";
import { editorValue } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";
import { contentEntries, media, redirects } from "@/lib/db/schema";
import { staticPageMeta } from "@/lib/seo";
import { panelT } from "@/lib/private/panelLangServer";

export const metadata = { title: "SEO" };

type Item = { key: string; label: string; ref: PageRef };
const items: Item[] = [
  ...routeKeys.map((k) => ({ key: k, label: staticPageMeta("nl", k).title, ref: { type: "static" as const, key: k } })),
  ...categoryIds.map((id) => ({ key: `category-${id}`, label: categoryCopy("nl", id).seoTitle, ref: { type: "category" as const, id } })),
  ...treatmentIds.map((id) => ({ key: `treatment-${id}`, label: treatmentCopy("nl", id).seoTitle, ref: { type: "treatment" as const, id } })),
  ...postIds.map((id) => ({ key: `post-${id}`, label: `Blog: ${postCopy("nl", id).seoTitle}`, ref: { type: "post" as const, id } })),
];

function defaultsFor(item: Item, locale: "nl" | "en" | "tr") {
  if (item.ref.type === "static") return staticPageMeta(locale, item.ref.key);
  if (item.ref.type === "category") {
    const c = categoryCopy(locale, item.ref.id);
    return { title: c.seoTitle, description: c.seoDescription };
  }
  if (item.ref.type === "post") {
    const p = postCopy(locale, item.ref.id);
    return { title: p.seoTitle, description: p.seoDescription };
  }
  const t = treatmentCopy(locale, item.ref.id);
  return { title: t.seoTitle, description: t.seoDescription };
}

export default async function SeoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const t = await panelT();
  await requireOwner("admin");
  const sp = await searchParams;
  const item = items.find((i) => i.key === sp.pagina) ?? items[0];
  const locale = asLocale(sp.taal);
  const db = getDb();
  const [ev, reds, imgs, saved] = await Promise.all([
    editorValue(db, `seo:${item.key}`, locale, {}),
    db.select().from(redirects).orderBy(desc(redirects.createdAt)),
    db.select({ id: media.id, name: media.filename }).from(media).orderBy(desc(media.createdAt)).limit(100),
    db.select({ docKey: contentEntries.docKey, status: contentEntries.status, data: contentEntries.data }).from(contentEntries).where(and(like(contentEntries.docKey, "seo:%"), eq(contentEntries.locale, locale))),
  ]);
  // Traffic light per page (like Yoast): saved draft first, then published, then the defaults.
  const savedSeo = new Map<string, Seo>();
  for (const r of [...saved].sort((a, b) => (a.status === "draft" ? 1 : 0) - (b.status === "draft" ? 1 : 0))) savedSeo.set(r.docKey.slice(4), (r.data ?? {}) as Seo);
  const dots = new Map(
    items.map((i) => {
      const s = savedSeo.get(i.key) ?? {};
      const d = defaultsFor(i, locale);
      return [i.key, overall(snippetChecks({ keyword: s.focusKeyword?.trim() || suggestKeyword(d.title), title: s.title || d.title, description: s.description || d.description, path: pagePath(locale, i.ref), noindex: s.noindex }))] as const;
    }),
  );
  const counts = { good: 0, ok: 0, bad: 0 };
  for (const v of dots.values()) counts[v]++;
  const targets = allPages().flatMap((p) => [pagePath("nl", p), pagePath("en", p)]);
  return (
    <>
      <PageHeader title={t("SEO & doorverwijzingen")} subtitle="Titels en omschrijvingen voor Google, per pagina en per taal. Adressen van pagina's veranderen niet; oude adressen kun je doorverwijzen." />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[18rem_1fr]">
        <Card>
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><SeoDot status="good" /> {counts.good}</span>
            <span className="inline-flex items-center gap-1.5"><SeoDot status="ok" /> {counts.ok}</span>
            <span className="inline-flex items-center gap-1.5"><SeoDot status="bad" /> {counts.bad}</span>
          </p>
          <ul className="max-h-[36rem] space-y-0.5 overflow-y-auto text-sm">
            {items.map((i) => (
              <li key={i.key}>
                <Link href={`/admin/seo?pagina=${i.key}&taal=${locale}`} aria-current={i.key === item.key ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${i.key === item.key ? "bg-ink text-paper" : "hover:bg-ink/6"}`}><SeoDot status={dots.get(i.key)!} /><span className="min-w-0">{i.label}</span></Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card title={item.label} actions={<span className="inline-flex rounded-full bg-surface p-1 text-sm">{(["nl", "en", "tr"] as const).map((l) => <Link key={l} href={`/admin/seo?pagina=${item.key}&taal=${l}`} className={`rounded-full px-3 py-1.5 ${l === locale ? "bg-ink text-paper" : ""}`}>{l.toUpperCase()}</Link>)}</span>}>
            <SeoForm key={`${item.key}-${locale}`} seoKey={item.key} locale={locale} initial={(ev.value ?? {}) as Seo} defaults={defaultsFor(item, locale)} path={pagePath(locale, item.ref)} media={imgs} />
          </Card>
          <Card title={t("Doorverwijzingen")}>
            <RedirectForm targets={targets} />
            {reds.length > 0 && (
              <ul className="mt-4 divide-y divide-line text-sm">
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
