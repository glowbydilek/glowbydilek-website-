import { eq } from "drizzle-orm";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { withDbOrFallback } from "@/lib/db/client";
import { redirects } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Unknown URLs: follow an owner-defined redirect (Admin → SEO) if there is
 * one, otherwise render the branded, localised 404 page.
 */
export default async function CatchAll({ params }: { params: Promise<{ rest: string[] }> }) {
  const parts = (await params).rest.map((p) => p.toLowerCase());
  const path = `/${parts.join("/")}`;
  const target = await withDbOrFallback(async (db) => {
    const [r] = await db.select().from(redirects).where(eq(redirects.fromPath, path)).limit(1);
    return r ?? null;
  }, null);
  if (target) (target.permanent ? permanentRedirect : redirect)(target.toPath);
  notFound();
}
