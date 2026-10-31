import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/private/cms/ContentEditor";
import { SectionsEditor } from "@/components/private/cms/SectionsEditor";
import { Card, Notice, PageHeader, SubmitButton } from "@/components/private/ui";
import { EDITOR_PAGES, PAGE_SECTIONS } from "@/lib/cms/registry";
import { editorValue, translationStatus, versions } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { customPages } from "@/lib/db/schema";
import { BLANK_CUSTOM } from "@/lib/cms/custom";
import { CustomPageSettings } from "@/components/private/cms/CustomPageForms";
import { restoreVersionAction } from "@/lib/private/cmsActions";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Pagina bewerken" };

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  let page = EDITOR_PAGES.find((p) => p.id === id);
  let custom: typeof customPages.$inferSelect | undefined;
  if (!page && /^info-\d+$/.test(id)) {
    [custom] = await getDb().select().from(customPages).where(eq(customPages.id, Number(id.slice(5))));
    if (custom) page = { id, label: `Informatiepagina /info/${custom.slugNl}`, group: "Eigen", paths: { nl: `/info/${custom.slugNl}`, en: `/en/info/${custom.slugEn}` }, docs: [{ key: `custom:${custom.id}`, label: "Teksten" }] };
  }
  if (!page) notFound();
  const docKey = page.docs.find((d) => d.key === sp.doc)?.key ?? page.docs[0].key;
  const locale = sp.taal === "en" ? "en" : "nl";
  const db = getDb();
  const [ev, hist, ts] = await Promise.all([editorValue(db, docKey, locale, custom ? BLANK_CUSTOM : undefined), versions(db, docKey, locale), translationStatus(db, docKey)]);
  const sectionsEv = page.sectionsPage ? await editorValue(db, `sections:${page.sectionsPage}`, "all", {}) : null;
  const sections = (sectionsEv?.value ?? {}) as { order?: string[]; hidden?: string[] };
  const href = (doc: string, taal: string) => `/admin/paginas/${id}?doc=${encodeURIComponent(doc)}&taal=${taal}`;
  return (
    <>
      <PageHeader
        title={page.label}
        subtitle={`Op de website: ${page.paths.nl} · ${page.paths.en}`}
        actions={<a href={locale === "en" ? page.paths.en : page.paths.nl} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-full border border-charcoal/25 px-4 text-sm">Bekijk live ↗</a>}
      />
      {sp.hersteld && <div className="mb-4"><Notice tone="success">Eerdere versie teruggezet als concept. Controleer en klik op Publiceren.</Notice></div>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {page.docs.length > 1 && page.docs.map((d) => (
          <Link key={d.key} href={href(d.key, locale)} aria-current={d.key === docKey ? "page" : undefined} className={`min-h-10 rounded-full px-4 py-2 text-sm ${d.key === docKey ? "bg-charcoal text-ivory" : "bg-white text-charcoal"}`}>{d.label}</Link>
        ))}
      </div>
      <div className="mb-4 inline-flex rounded-full bg-white p-1 shadow-sm" role="tablist" aria-label="Taal">
        {(["nl", "en"] as const).map((l) => (
          <Link key={l} href={href(docKey, l)} role="tab" aria-selected={l === locale} className={`min-h-10 rounded-full px-4 py-2 text-sm ${l === locale ? "bg-charcoal text-ivory" : ""}`}>
            {l === "nl" ? "Nederlands" : "Engels"}
            {ts[l].draft && " · concept"}
            {ts[l].empty > 0 && ` · ${ts[l].empty} leeg`}
          </Link>
        ))}
      </div>
      {ts.nl.published !== ts.en.published && (
        <div className="mb-4"><Notice tone="warning">Alleen de {ts.nl.published ? "Nederlandse" : "Engelse"} versie is aangepast. Vergeet de andere taal niet bij te werken.</Notice></div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <Card>
          <p className="mb-4 text-sm text-muted">
            {ev.hasDraft ? "Je bewerkt een concept (nog niet zichtbaar op de website)." : ev.published ? `Gepubliceerde versie ${ev.published.version}.` : "Dit is de oorspronkelijke tekst."} Opslaan als concept, bekijk het voorbeeld en publiceer als je tevreden bent.
          </p>
          <ContentEditor key={`${docKey}|${locale}`} docKey={docKey} locale={locale} initial={ev.value as Json} path={locale === "en" ? page.paths.en : page.paths.nl} hasDraft={ev.hasDraft} canReset={Boolean(ev.published)} />
        </Card>
        <div className="space-y-5">
          {custom && (
            <Card title="Pagina-instellingen">
              <CustomPageSettings id={custom.id} published={custom.published} noindex={custom.noindex} />
            </Card>
          )}
          {page.sectionsPage && (
            <Card title="Onderdelen">
              <p className="mb-3 text-sm text-muted">Volgorde en zichtbaarheid{page.sectionsPage !== "home" && page.sectionsPage !== "about" ? " (geldt voor alle pagina's van dit type)" : ""}.</p>
              <SectionsEditor page={page.sectionsPage} defs={PAGE_SECTIONS[page.sectionsPage]} order={sections.order ?? []} hidden={sections.hidden ?? []} />
            </Card>
          )}
          <Card title="Geschiedenis">
            {hist.length ? (
              <ul className="space-y-2 text-sm">
                {hist.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2">
                    <span>Versie {h.version} · {formatLocal(h.createdAt, "nl", { dateStyle: "short", timeStyle: "short" })}</span>
                    <form action={restoreVersionAction}>
                      <input type="hidden" name="versionId" value={h.id} />
                      <input type="hidden" name="back" value={href(docKey, locale)} />
                      <SubmitButton variant="ghost" className="min-h-9 px-3 text-xs">Terugzetten</SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nog geen gepubliceerde wijzigingen.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
