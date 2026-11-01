import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { groupCopy, itemCopy, sectionCopy } from "@/content/copy";
import { href, type Locale } from "@/i18n/config";
import { groupHref, itemHref, sectionHref, type Resolved } from "@/lib/catalogue";
import { buildMetadata } from "@/lib/seo";
import { CategoryPage } from "./CategoryPage";
import { SectionPage } from "./SectionPage";
import { TreatmentDetailPage } from "./TreatmentDetailPage";

/** Metadata (canonical + hreflang) for any catalogue page. */
export function catalogueMetadata(locale: Locale, r: Resolved): Metadata {
  if (r.type === "section") {
    const c = sectionCopy(locale, r.section.id, r.section.name[locale]);
    return buildMetadata({ locale, paths: { nl: sectionHref("nl", r.section), en: sectionHref("en", r.section) }, title: c.seoTitle, description: c.seoDescription, seoKey: `section-${r.section.id}` });
  }
  if (r.type === "group") {
    const c = groupCopy(locale, r.group.id, r.group.name[locale]);
    return buildMetadata({ locale, paths: { nl: groupHref("nl", r.group), en: groupHref("en", r.group) }, title: c.seoTitle, description: c.seoDescription, seoKey: `category-${r.group.id}` });
  }
  const t = itemCopy(locale, r.item.id, r.item);
  return buildMetadata({
    locale,
    paths: { nl: itemHref("nl", r.item), en: itemHref("en", r.item) },
    title: t.seoTitle,
    description: t.seoDescription,
    seoKey: `treatment-${r.item.id}`,
    noindex: r.item.status !== "published",
  });
}

/** Renders a resolved catalogue page with its breadcrumb data. */
export function CatalogueRoute({ locale, r }: { locale: Locale; r: Resolved }) {
  const sectionCrumb = { name: r.section.name[locale], path: r.section.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, r.section) };
  if (r.type === "section") {
    return (
      <PageFrame locale={locale} crumbs={[sectionCrumb]}>
        <SectionPage locale={locale} section={r.section} />
      </PageFrame>
    );
  }
  if (r.type === "group") {
    return (
      <PageFrame locale={locale} crumbs={[sectionCrumb, { name: groupCopy(locale, r.group.id, r.group.name[locale]).label, path: groupHref(locale, r.group) }]}>
        <CategoryPage locale={locale} id={r.group.id} />
      </PageFrame>
    );
  }
  const crumbs = [sectionCrumb];
  if (r.group) crumbs.push({ name: groupCopy(locale, r.group.id, r.group.name[locale]).label, path: groupHref(locale, r.group) });
  crumbs.push({ name: r.item.name[locale], path: itemHref(locale, r.item) });
  return (
    <PageFrame locale={locale} crumbs={crumbs}>
      <TreatmentDetailPage locale={locale} item={r.item} />
    </PageFrame>
  );
}
