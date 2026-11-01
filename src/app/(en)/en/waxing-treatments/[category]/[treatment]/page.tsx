import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ensureContent } from "@/lib/cms/store";
import { BUILTIN_GROUPS, BUILTIN_ITEMS } from "@/lib/catalogue/builtin";
import { resolveCatalogue, sectionById } from "@/lib/catalogue";
import { CatalogueRoute, catalogueMetadata } from "@/views/CatalogueRoute";

const locale = "en";
type Props = { params: Promise<{ category: string; treatment: string }> };

// Built-in treatments are prerendered; treatments the owner adds in Admin render on demand.
export const dynamicParams = true;

export function generateStaticParams() {
  return BUILTIN_ITEMS.filter((i) => i.sectionId === "waxing" && i.groupId).map((i) => ({
    category: BUILTIN_GROUPS.find((g) => g.id === i.groupId)!.slug[locale],
    treatment: i.slug[locale],
  }));
}

async function resolve(params: Props["params"]) {
  await ensureContent();
  const p = await params;
  const waxing = sectionById("waxing")!;
  const r = resolveCatalogue(locale, [waxing.slug[locale], p.category, p.treatment]);
  return r?.type === "item" ? r : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolve(params);
  return r ? catalogueMetadata(locale, r) : {};
}

export default async function Page({ params }: Props) {
  const r = await resolve(params);
  if (!r) notFound();
  return <CatalogueRoute locale={locale} r={r} />;
}
