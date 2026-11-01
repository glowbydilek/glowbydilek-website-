import type { Metadata } from "next";
import { quoteByToken } from "@/lib/booking/quotes";
import { ensureContent } from "@/lib/cms/store";
import { withDbOrFallback } from "@/lib/db/client";
import { QuotePage } from "@/views/QuotePage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Price proposal", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  await ensureContent();
  const { token } = await params;
  const q = await withDbOrFallback((db) => quoteByToken(db, token), null);
  return <QuotePage locale="en" q={q} token={token} />;
}
