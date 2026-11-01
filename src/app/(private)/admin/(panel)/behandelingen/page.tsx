import Link from "next/link";
import { asc } from "drizzle-orm";
import { CreateGroupForm, CreateItemForm, CreateSectionForm, GroupForm, ItemForm, PackagePartsForm, SectionForm, type ItemView } from "@/components/private/cms/CatalogueForms";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { BUILTIN_ITEMS } from "@/lib/catalogue/builtin";
import { getDb } from "@/lib/db/client";
import { packageItems, serviceGroups, serviceSections, treatments } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";

export const metadata = { title: "Behandelingen & prijzen" };

const STATUS: Record<string, { label: string; tone: "done" | "pending" | "cancelled" }> = {
  published: { label: "Gepubliceerd", tone: "done" },
  draft: { label: "Concept", tone: "pending" },
  archived: { label: "Gearchiveerd", tone: "cancelled" },
};
const euro = (c: number | null) => (c != null ? `€ ${(c / 100).toFixed(2).replace(".", ",")}` : "");

/**
 * Catalogue management. Categories (sections), sub-categories, treatments
 * and packages live in the database; nothing here needs a code change.
 * Long-form page texts are edited under Pagina's.
 */
export default async function TreatmentsAdmin() {
  const db = getDb();
  await ensureSeeded(db);
  const [sections, groups, rows, parts] = await Promise.all([
    db.select().from(serviceSections).orderBy(asc(serviceSections.sort)),
    db.select().from(serviceGroups).orderBy(asc(serviceGroups.sort)),
    db.select().from(treatments).orderBy(asc(treatments.sort)),
    db.select().from(packageItems).orderBy(asc(packageItems.sort)),
  ]);
  // Rows created before migration 0002 have no section/group/slug yet: use the built-in values.
  const items: ItemView[] = rows.map((r) => {
    const b = BUILTIN_ITEMS.find((x) => x.id === r.id);
    const sectionId = r.sectionId ?? b?.sectionId ?? "waxing";
    const groupId = r.groupId ?? b?.groupId ?? (groups.some((g) => g.id === r.category) ? r.category : null);
    const mode = r.pricingMode ?? (r.priceCents == null ? "on_request" : r.priceFrom ? "from" : "fixed");
    return {
      id: r.id,
      kind: r.kind,
      sectionId,
      groupId,
      slugNl: r.slugNl ?? b?.slug.nl ?? r.id,
      slugEn: r.slugEn ?? b?.slug.en ?? r.id,
      status: r.status,
      nameNl: r.nameNl,
      nameEn: r.nameEn,
      descriptionNl: r.descriptionNl,
      descriptionEn: r.descriptionEn,
      pricingMode: mode,
      priceCents: r.priceCents,
      durationMinutes: r.durationMinutes,
      bufferMinutes: r.bufferMinutes,
      vatCategory: r.vatCategory,
      visible: r.visible,
      featured: r.featured,
      bookableOnline: r.bookableOnline,
      sort: r.sort,
    };
  });
  const sectionOpts = sections.map((s) => ({ id: s.id, label: s.nameNl, kind: s.kind }));
  const groupOpts = groups.map((g) => ({ id: g.id, label: g.nameNl, sectionId: g.sectionId }));
  const treatmentOpts = items
    .filter((i) => i.kind !== "package" && i.status !== "archived")
    .map((i) => ({ id: i.id, label: i.nameNl, group: sections.find((s) => s.id === i.sectionId)?.nameNl ?? i.sectionId }));
  const path = (i: ItemView) => {
    const s = sections.find((x) => x.id === i.sectionId);
    const g = groups.find((x) => x.id === i.groupId);
    return `/${s?.slugNl ?? ""}${g ? `/${g.slugNl}` : ""}/${i.slugNl}`;
  };

  return (
    <>
      <PageHeader title="Behandelingen & prijzen" subtitle="Categorieën, subcategorieën, behandelingen en pakketten. Uitgebreide pagina-teksten bewerk je onder Pagina's." />
      <div className="mb-5 space-y-3">
        <Notice tone="info">
          Alleen <strong>gepubliceerde</strong> behandelingen in een <strong>gepubliceerde</strong> categorie staan op de website. Concepten zie je alleen hier en in de voorbeeldweergave. Zonder prijs toont de site ‘Op aanvraag’ — nooit € 0.
        </Notice>
        <Notice tone="warning">
          De nieuwe gezichts-, lichaams-, massage- en pakketbehandelingen staan klaar als <strong>concept</strong>. Controleer per behandeling of je hem echt aanbiedt, vul prijs en duur in en publiceer pas daarna. Btw-tarieven anders dan 21% alleen na akkoord van je boekhouder.
        </Notice>
      </div>

      <div className="space-y-6">
        {sections.map((s) => {
          const secItems = items.filter((i) => i.sectionId === s.id);
          const secGroups = groups.filter((g) => g.sectionId === s.id);
          const buckets: { key: string; title: string | null; group?: (typeof groups)[number]; list: ItemView[] }[] = [
            ...secGroups.map((g) => ({ key: g.id, title: g.nameNl, group: g, list: secItems.filter((i) => i.groupId === g.id) })),
            { key: `${s.id}-loose`, title: secGroups.length ? "Zonder subcategorie" : null, group: undefined, list: secItems.filter((i) => !i.groupId || !secGroups.some((g) => g.id === i.groupId)) },
          ].filter((b) => b.list.length || b.group);
          return (
            <Card
              key={s.id}
              title={s.nameNl}
              actions={<Badge tone={STATUS[s.status]?.tone ?? "neutral"}>{STATUS[s.status]?.label ?? s.status}</Badge>}
            >
              <details className="mb-4 rounded-2xl border border-line p-3">
                <summary className="cursor-pointer text-sm font-medium">Categorie-instellingen</summary>
                <div className="mt-3 space-y-3">
                  <SectionForm s={s} />
                  <Link href={s.id === "waxing" ? "/admin/paginas/treatments" : `/admin/paginas/section-${s.id}`} className="inline-block text-sm text-accent-deep underline">
                    Teksten van de categoriepagina bewerken
                  </Link>
                </div>
              </details>
              {buckets.map((b) => (
                <div key={b.key} className="mb-5">
                  {b.title && (
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                      <h3 className="font-serif text-xl">{b.title}</h3>
                      {b.group && <Badge tone={STATUS[b.group.status]?.tone ?? "neutral"}>{STATUS[b.group.status]?.label}</Badge>}
                    </div>
                  )}
                  {b.group && !b.group.id.match(/^(face|body|intimate)$/) && (
                    <details className="mb-3 rounded-xl border border-line p-3">
                      <summary className="cursor-pointer text-sm">Subcategorie bewerken</summary>
                      <div className="mt-3"><GroupForm g={b.group} /></div>
                    </details>
                  )}
                  <div className="space-y-3">
                    {b.list.map((t) => (
                      <details key={t.id} className="rounded-2xl border border-line p-3">
                        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {t.nameNl}
                            {t.kind === "package" && <span className="ml-2 text-xs uppercase tracking-[0.14em] text-muted">pakket</span>}
                          </span>
                          <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
                            <Badge tone={STATUS[t.status]?.tone ?? "neutral"}>{STATUS[t.status]?.label ?? t.status}</Badge>
                            {t.pricingMode === "on_request" ? "op aanvraag" : `${t.pricingMode === "from" ? "vanaf " : ""}${euro(t.priceCents)}`}
                            {" · "}
                            {t.durationMinutes ? `${t.durationMinutes} min` : "duur?"}
                            {!t.visible ? " · verborgen" : ""}
                            {t.bookableOnline ? " · online" : ""}
                          </span>
                        </summary>
                        <div className="mt-3 space-y-4">
                          <ItemForm t={t} sections={sectionOpts} groups={groupOpts} />
                          {t.kind === "package" && (
                            <PackagePartsForm id={t.id} parts={parts.filter((p) => p.packageId === t.id)} treatments={treatmentOpts} />
                          )}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <Link href={`/admin/paginas/treatment-${t.id}`} className="text-accent-deep underline">Pagina-teksten bewerken</Link>
                            {t.status === "published" && s.status === "published" && (
                              <Link href={path(t)} target="_blank" className="text-accent-deep underline">Bekijk pagina ↗</Link>
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                    {!b.list.length && <p className="text-sm text-muted">Nog geen behandelingen.</p>}
                  </div>
                </div>
              ))}
            </Card>
          );
        })}

        <Card title="Nieuwe behandeling of pakket">
          <CreateItemForm sections={sectionOpts} groups={groupOpts} />
        </Card>
        <Card title="Nieuwe categorie of subcategorie">
          <div className="space-y-6">
            <CreateSectionForm />
            <CreateGroupForm sections={sectionOpts.filter((s) => s.kind !== "packages")} />
          </div>
        </Card>
      </div>
    </>
  );
}
