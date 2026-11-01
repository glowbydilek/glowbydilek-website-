/**
 * Transactional outbox for customer and owner emails.
 *
 * - enqueue() is called inside the same database transaction as the
 *   appointment change, so a booking can never be saved without its email
 *   record (and an email can never exist for a rolled-back change).
 * - processOutbox() delivers due messages: an inline attempt right after
 *   the change, and the cron tick for retries and scheduled reminders.
 * - dedupeKey (unique) makes every notification idempotent: retrying an
 *   operation never sends a second confirmation.
 * - Rows are claimed atomically (status pending → sending), so two
 *   overlapping runs never send the same message twice.
 */
import { and, eq, inArray, lte, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, outbox } from "../db/schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0] | DB;

export type OutgoingEmail = {
  dedupeKey: string;
  kind: string;
  appointmentId?: number | null;
  to: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
  sendAfter?: Date;
};

export async function enqueue(tx: Tx, m: OutgoingEmail): Promise<boolean> {
  const [res] = (await tx
    .insert(outbox)
    .ignore()
    .values({
      dedupeKey: m.dedupeKey.slice(0, 190),
      kind: m.kind,
      appointmentId: m.appointmentId ?? null,
      toEmail: m.to,
      replyTo: m.replyTo ?? null,
      subject: m.subject.slice(0, 250),
      html: m.html,
      textBody: m.text,
      sendAfter: m.sendAfter ?? new Date(),
    })) as unknown as [{ affectedRows: number }];
  return res.affectedRows === 1;
}

/** Cancels scheduled (not yet sent) messages, e.g. reminders of a cancelled appointment. */
export async function cancelPending(tx: Tx, appointmentId: number, kinds: string[]) {
  await tx
    .update(outbox)
    .set({ status: "cancelled" })
    .where(and(eq(outbox.appointmentId, appointmentId), inArray(outbox.kind, kinds), eq(outbox.status, "pending")));
}

export type Sender = (m: { to: string; replyTo?: string; subject: string; text: string; html: string }) => Promise<void>;

const MAX_ATTEMPTS = 6;
const backoffMinutes = (attempt: number) => [1, 5, 15, 60, 240, 720][Math.min(attempt, 5)];

export async function processOutbox(
  db: DB,
  send: Sender,
  opts: { now?: Date; limit?: number; ids?: number[] } = {},
): Promise<{ sent: number; failed: number; skipped: number }> {
  const now = opts.now ?? new Date();
  // Release claims older than 10 minutes (a crashed run).
  await db
    .update(outbox)
    .set({ status: "pending", lockedAt: null })
    .where(and(eq(outbox.status, "sending"), lte(outbox.lockedAt, new Date(now.getTime() - 10 * 60_000))));
  const due = await db
    .select()
    .from(outbox)
    .where(and(eq(outbox.status, "pending"), lte(outbox.sendAfter, now), opts.ids?.length ? inArray(outbox.id, opts.ids) : undefined))
    .orderBy(outbox.sendAfter)
    .limit(opts.limit ?? 20);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const m of due) {
    const [claim] = (await db
      .update(outbox)
      .set({ status: "sending", lockedAt: now })
      .where(and(eq(outbox.id, m.id), eq(outbox.status, "pending")))) as unknown as [{ affectedRows: number }];
    if (claim.affectedRows !== 1) {
      skipped++;
      continue;
    }
    // Reminders: send only if the appointment is still confirmed at the same time.
    if (m.kind === "reminder" && m.appointmentId) {
      const [a] = await db.select().from(appointments).where(eq(appointments.id, m.appointmentId));
      const stillValid = a && a.status === "confirmed" && a.startAt && m.dedupeKey.endsWith(`:${a.startAt.toISOString()}`) && a.startAt > now;
      if (!stillValid) {
        await db.update(outbox).set({ status: "cancelled", lockedAt: null }).where(eq(outbox.id, m.id));
        skipped++;
        continue;
      }
    }
    try {
      await send({ to: m.toEmail, replyTo: m.replyTo ?? undefined, subject: m.subject, text: m.textBody, html: m.html });
      await db.update(outbox).set({ status: "sent", sentAt: new Date(), lockedAt: null, attempts: m.attempts + 1, lastError: null }).where(eq(outbox.id, m.id));
      sent++;
    } catch (err) {
      const attempts = m.attempts + 1;
      const code = (err as { code?: string; responseCode?: number })?.code ?? (err as { responseCode?: number })?.responseCode ?? "error";
      await db
        .update(outbox)
        .set({
          status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          attempts,
          lockedAt: null,
          lastError: String(code).slice(0, 200),
          sendAfter: new Date(now.getTime() + backoffMinutes(attempts) * 60_000),
        })
        .where(eq(outbox.id, m.id));
      failed++;
    }
  }
  return { sent, failed, skipped };
}

/** Owner action: retry a failed (or stuck) message now. */
export async function resend(db: DB, id: number) {
  await db
    .update(outbox)
    .set({ status: "pending", sendAfter: new Date(), lockedAt: null })
    .where(and(eq(outbox.id, id), or(eq(outbox.status, "failed"), eq(outbox.status, "pending"))));
}

export async function outboxCounts(db: DB): Promise<{ failed: number; pending: number }> {
  const rows = (await db
    .select({ status: outbox.status, n: sql<number>`count(*)` })
    .from(outbox)
    .where(inArray(outbox.status, ["failed", "pending"]))
    .groupBy(outbox.status)) as { status: string; n: number }[];
  const get = (s: string) => Number(rows.find((r) => r.status === s)?.n ?? 0);
  return { failed: get("failed"), pending: get("pending") };
}
