import { eq } from "drizzle-orm";
import { assertOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { markRead } from "@/lib/notify/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Opens the record behind a notification and marks it read (the action count is unchanged). */
// Relative Location: correct behind the hosting proxy, whatever host name the app sees.
const go = (to: string) => new Response(null, { status: 303, headers: { Location: to, "Cache-Control": "no-store" } });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOwner();
  } catch {
    return go("/agenda/login?next=/agenda/meldingen");
  }
  const id = Number((await params).id);
  const db = getDb();
  const [n] = Number.isInteger(id) ? await db.select({ url: notifications.url }).from(notifications).where(eq(notifications.id, id)) : [];
  if (!n) return go("/agenda/meldingen");
  await markRead(db, [id]);
  const safe = /^\/agenda(\/[\w\-/?=&%.]*)?$/.test(n.url) && !n.url.includes("//") ? n.url : "/agenda/meldingen";
  return go(safe);
}
