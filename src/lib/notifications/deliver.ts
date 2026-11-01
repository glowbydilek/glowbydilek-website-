import "server-only";
import { desc, eq } from "drizzle-orm";
import { purgeAuthData } from "../auth/service";
import { purgeExpiredConsultations } from "../consultation/service";
import type { DB } from "../db/client";
import { purgeExpiredLimits } from "../db/limits";
import { cronRuns } from "../db/schema";
import { mailConfigured, sendMail } from "../mail/send";
import { processOutbox, type Sender } from "./outbox";

export const smtpSender: Sender = (m) => sendMail({ to: m.to, replyTo: m.replyTo, subject: m.subject, text: m.text, html: m.html, attachments: m.attachments });

/** Inline delivery right after a change (short; anything left is retried by the cron job). */
export async function deliverSoon(db: DB) {
  if (!mailConfigured()) return;
  try {
    await Promise.race([processOutbox(db, smtpSender, { limit: 5 }), new Promise((r) => setTimeout(r, 8000))]);
  } catch (err) {
    console.error("[outbox] inline delivery failed:", err instanceof Error ? err.message.slice(0, 120) : err);
  }
}

/** One cron tick: deliver due emails (incl. reminders) and housekeeping. */
export async function cronTick(db: DB) {
  const [res] = (await db.insert(cronRuns).values({})) as unknown as [{ insertId: number }];
  try {
    const r = mailConfigured() ? await processOutbox(db, smtpSender, { limit: 40 }) : { sent: 0, failed: 0, skipped: 0 };
    await purgeExpiredLimits(db);
    await purgeAuthData(db);
    await purgeExpiredConsultations(db);
    await db.update(cronRuns).set({ finishedAt: new Date(), sent: r.sent, failed: r.failed, error: mailConfigured() ? null : "SMTP not configured" }).where(eq(cronRuns.id, res.insertId));
    return r;
  } catch (err) {
    await db.update(cronRuns).set({ finishedAt: new Date(), error: (err instanceof Error ? err.message : "error").slice(0, 200) }).where(eq(cronRuns.id, res.insertId));
    throw err;
  }
}

export async function lastCronRun(db: DB) {
  const [r] = await db.select().from(cronRuns).orderBy(desc(cronRuns.id)).limit(1);
  return r ?? null;
}
