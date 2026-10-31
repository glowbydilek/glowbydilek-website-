import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { categoryCopy } from "@/content/copy";
import { categoryIds, categorySlugs } from "@/content/slugs";
import { categoryHref, findCategory, href } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { categoryMetadata } from "@/lib/seo";
import { CategoryPage } from "@/views/CategoryPage";

const locale = "nl";
type Props = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categoryIds.map((id) => ({ category: categorySlugs[id][locale] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = findCategory(locale, (await params).category);
  return id ? categoryMetadata(locale, id) : {};
}

export default async function Page({ params }: Props) {
  const id = findCategory(locale, (await params).category);
  if (!id) notFound();
  const dict = getDictionary(locale);
  return (
    <PageFrame
      locale={locale}
      crumbs={[
        { name: dict.nav.treatments, path: href(locale, "treatments") },
        { name: categoryCopy(locale, id).label, path: categoryHref(locale, id) },
      ]}
    >
      <CategoryPage locale={locale} id={id} />
    </PageFrame>
  );
}
