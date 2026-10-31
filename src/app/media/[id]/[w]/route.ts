import { and, asc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withDbOrFallback } from "@/lib/db/client";
import { mediaVariants } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Serves an uploaded image rendition from the database (public website images). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; w: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const w = Number(p.w);
  if (!Number.isInteger(id) || !Number.isInteger(w) || w < 1 || w > 4000) return new NextResponse("Not found", { status: 404 });
  const row = await withDbOrFallback(async (db) => {
    const [bigger] = await db.select().from(mediaVariants).where(and(eq(mediaVariants.mediaId, id), gte(mediaVariants.width, w))).orderBy(asc(mediaVariants.width)).limit(1);
    if (bigger) return bigger;
    const all = await db.select().from(mediaVariants).where(eq(mediaVariants.mediaId, id));
    return all.sort((a, b) => b.width - a.width)[0] ?? null;
  }, null);
  if (!row) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
