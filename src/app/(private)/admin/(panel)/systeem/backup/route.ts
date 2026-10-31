import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { audit } from "@/lib/db/audit";
import { getDb } from "@/lib/db/client";
import * as t from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Application-level export (no password hashes, tokens, MFA secrets or image binaries). */
export async function GET() {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const db = getDb();
  const [settings, contentEntries, contentVersions, customPages, redirects, media, treatments, customers, appointments, appointmentTreatments, weeklyHours, dateOverrides, overrideIntervals, blocks, notificationTemplates, inquiries] =
    await Promise.all([
      db.select().from(t.settings),
      db.select().from(t.contentEntries),
      db.select().from(t.contentVersions),
      db.select().from(t.customPages),
      db.select().from(t.redirects),
      db.select().from(t.media),
      db.select().from(t.treatments),
      db.select().from(t.customers),
      db.select().from(t.appointments),
      db.select().from(t.appointmentTreatments),
      db.select().from(t.weeklyHours),
      db.select().from(t.dateOverrides),
      db.select().from(t.overrideIntervals),
      db.select().from(t.blocks),
      db.select().from(t.notificationTemplates),
      db.select().from(t.inquiries),
    ]);
  await audit(db, { userId: s.user.id, action: "system.backup_downloaded" });
  const body = JSON.stringify(
    { format: "glowbydilek-backup-v1", createdAt: new Date().toISOString(), settings, contentEntries, contentVersions, customPages, redirects, media, treatments, customers, appointments, appointmentTreatments, weeklyHours, dateOverrides, overrideIntervals, blocks, notificationTemplates, inquiries },
    null,
    1,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="glowbydilek-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
