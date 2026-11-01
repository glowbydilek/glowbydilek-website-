import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ensureContent } from "@/lib/cms/store";
import { BUILTIN_GROUPS } from "@/lib/catalogue/builtin";
import { resolveCatalogue, sectionById } from "@/lib/catalogue";
import { CatalogueRoute, catalogueMetadata } from "@/views/CatalogueRoute";

const locale = "en";
type Props = { params: Promise<{ category: string }> };

// Built-in zones are prerendered; zones the owner adds in Admin render on demand.
export const dynamicParams = true;

export function generateStaticParams() {
  return BUILTIN_GROUPS.map((g) => ({ category: g.slug[locale] }));
}

async function resolve(params: Props["params"]) {
  await ensureContent();
  const waxing = sectionById("waxing")!;
  const r = resolveCatalogue(locale, [waxing.slug[locale], (await params).category]);
  return r?.type === "group" ? r : null;
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
