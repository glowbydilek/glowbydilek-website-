import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { resolveCatalogue } from "@/lib/catalogue";
import { ensureContent } from "@/lib/cms/store";
import { withDbOrFallback } from "@/lib/db/client";
import { redirects } from "@/lib/db/schema";
import { CatalogueRoute, catalogueMetadata } from "@/views/CatalogueRoute";

export const dynamic = "force-dynamic";

const locale = "nl";
type Props = { params: Promise<{ rest: string[] }> };

async function catalogue(params: Props["params"]) {
  await ensureContent();
  return resolveCatalogue(locale, (await params).rest);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await catalogue(params);
  return r ? catalogueMetadata(locale, r) : {};
}

/**
 * Catalogue pages outside the waxing routes (Gezichtsbehandelingen,
 * Pakketten, owner-created sections …) once published; otherwise an
 * owner-defined redirect (Admin → SEO) if there is one, or the branded 404.
 */
export default async function CatchAll({ params }: Props) {
  const r = await catalogue(params);
  if (r) return <CatalogueRoute locale={locale} r={r} />;
  const parts = (await params).rest.map((p) => p.toLowerCase());
  const path = `/${parts.join("/")}`;
  const target = await withDbOrFallback(async (db) => {
    const [row] = await db.select().from(redirects).where(eq(redirects.fromPath, path)).limit(1);
    return row ?? null;
  }, null);
  if (target) (target.permanent ? permanentRedirect : redirect)(target.toPath);
  notFound();
}
