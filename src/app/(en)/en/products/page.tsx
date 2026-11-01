import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { getDictionary } from "@/i18n/dictionaries";
import { ensureContent } from "@/lib/cms/store";
import { currentSnapshot } from "@/lib/cms/current";
import { withDbOrFallback } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { buildMetadata } from "@/lib/seo";
import { ProductsPage } from "@/views/ProductsPage";

const locale = "en";
const paths = { nl: "/producten", en: "/en/products" };

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  if (!currentSnapshot().marketing?.productsPage) return {};
  const t = getDictionary(locale).products;
  return buildMetadata({ locale, paths, title: t.title, description: t.intro, seoKey: "products" });
}

/** Off by default; only products the owner marked as public, never prices or a shop. */
export default async function Page() {
  await ensureContent();
  if (!currentSnapshot().marketing?.productsPage) notFound();
  const rows = await withDbOrFallback(
    (db) => db.select().from(products).where(and(eq(products.status, "active"), eq(products.showPublic, true))).orderBy(asc(products.brand), asc(products.name)),
    [],
  );
  return (
    <PageFrame locale={locale} crumbs={[{ name: getDictionary(locale).products.title, path: paths[locale] }]}>
      <ProductsPage locale={locale} products={rows.map((r) => ({ id: r.id, name: r.name, brand: r.brand, variant: r.variant, description: r.description, professionalOnly: r.professionalOnly, mediaId: r.mediaId }))} />
    </PageFrame>
  );
}
