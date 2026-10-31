import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { categoryCopy } from "@/content/copy";
import { categorySlugs, treatmentIds, treatmentSlugs } from "@/content/slugs";
import { findTreatmentById, liveTreatment } from "@/content/treatments";
import { categoryHref, findCategory, findTreatment, href, treatmentHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { treatmentMetadata } from "@/lib/seo";
import { TreatmentDetailPage } from "@/views/TreatmentDetailPage";

const locale = "nl";
type Props = { params: Promise<{ category: string; treatment: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return treatmentIds.map((id) => ({
    category: categorySlugs[treatmentSlugs[id].category][locale],
    treatment: treatmentSlugs[id][locale],
  }));
}

async function resolve(params: Props["params"]) {
  const p = await params;
  const category = findCategory(locale, p.category);
  return category ? findTreatment(locale, category, p.treatment) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await ensureContent();
  const id = await resolve(params);
  return id ? treatmentMetadata(locale, id) : {};
}

export default async function Page({ params }: Props) {
  const id = await resolve(params);
  if (!id) notFound();
  await ensureContent();
  if (!liveTreatment(id).visible) notFound();
  const dict = getDictionary(locale);
  const { treatment, group } = findTreatmentById(id);
  return (
    <PageFrame
      locale={locale}
      crumbs={[
        { name: dict.nav.treatments, path: href(locale, "treatments") },
        { name: categoryCopy(locale, group.id).label, path: categoryHref(locale, group.id) },
        { name: treatment.name[locale], path: treatmentHref(locale, id) },
      ]}
    >
      <TreatmentDetailPage locale={locale} id={id} />
    </PageFrame>
  );
}
