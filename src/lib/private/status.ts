import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, inquiries, weeklyHours } from "../db/schema";
import { turnstileStatus } from "../forms/turnstile";
import { mailConfigured } from "../mail/send";
import { lastCronRun } from "../notifications/deliver";
import { outboxCounts } from "../notifications/outbox";

export type Check = { label: string; ok: boolean; detail: string };

/** Honest configuration status for the owner (never shows secret values). */
export async function systemStatus(db: DB): Promise<{ checks: Check[]; counts: { pending: number; unread: number; failedMail: number } }> {
  const [cron, mail, [p], [u], [wh]] = await Promise.all([
    lastCronRun(db),
    outboxCounts(db),
    db.select({ n: sql<number>`count(*)` }).from(appointments).where(inArray(appointments.status, ["requested"])),
    db.select({ n: sql<number>`count(*)` }).from(inquiries).where(and(eq(inquiries.status, "new"))),
    db.select({ n: sql<number>`count(*)` }).from(weeklyHours),
  ]);
  const ts = turnstileStatus();
  const cronFresh = cron && Date.now() - cron.startedAt.getTime() < 60 * 60_000;
  const checks: Check[] = [
    { label: "Database", ok: true, detail: "Verbonden" },
    { label: "E-mail (SMTP)", ok: mailConfigured(), detail: mailConfigured() ? "Ingesteld — een echte testmail is nodig om bezorging te bevestigen" : "Niet ingesteld (SMTP_HOST / SMTP_USER / SMTP_PASS)" },
    {
      label: "Cloudflare Turnstile",
      ok: ts.mode === "live",
      detail: ts.mode === "live" ? "Live sleutels ingesteld" : ts.mode === "test" ? "Testsleutels (geen echte bescherming)" : ts.problem ?? "Niet ingesteld",
    },
    { label: "Automatische taak (cron)", ok: Boolean(cronFresh && !cron?.error), detail: cron ? `Laatst ${cron.startedAt.toISOString().slice(0, 16).replace("T", " ")} UTC${cron.error ? ` — ${cron.error}` : ""}` : "Nog nooit uitgevoerd" },
    { label: "Sessiesleutel (AUTH_SECRET)", ok: Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32), detail: process.env.AUTH_SECRET ? "Ingesteld" : "Niet ingesteld" },
    { label: "Werktijden", ok: Number(wh.n) > 0, detail: Number(wh.n) > 0 ? "Ingesteld" : "Nog niet ingesteld in Ajanda → Werktijden" },
  ];
  return { checks, counts: { pending: Number(p.n), unread: Number(u.n), failedMail: mail.failed } };
}
