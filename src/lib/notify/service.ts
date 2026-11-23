/**
 * Agenda notifications ("Meldingen") and Web Push.
 *
 * Badge rule (one rule everywhere — app icon, menu, Meldingen page):
 *   badge = number of OPEN, ACTIONABLE notifications.
 * An actionable notification stays open until the item behind it is handled
 * in the source table (request confirmed/declined, message answered or
 * closed, failed invoice email sent or cancelled). Reading it or opening the
 * app never lowers the count. Informational notifications never count.
 *
 * The source tables are the truth: syncNotifications() creates a missing
 * notification for every pending item (idempotent via dedupeKey) and resolves
 * notifications whose item is no longer pending, so the count is right no
 * matter which screen or flow handled the item. Pushes go out from the
 * database queue (pushStatus), so a restart or a failed push never loses a
 * notification; the item is always visible in the Agenda.
 */
import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, inquiries, intakeDocuments, notifications, outbox, pushSubscriptions, users } from "../db/schema";
import { isAllowedEndpoint, sendPush, type PushResult, type PushTarget, type VapidKeys } from "../push/webpush";

export type Category = "afspraak" | "bericht" | "intake" | "factuur" | "systeem";
export type NewNotification = {
  dedupeKey: string;
  kind: string;
  category: Category;
  title: string;
  body?: string;
  url: string;
  entityType?: string;
  entityId?: number;
  actionable: boolean;
};

/** Items older than this when first seen are recorded without a push (no flood on first start). */
const BACKFILL_MS = 30 * 60_000;
const MAX_PUSH_ATTEMPTS = 5;
const MAX_SUB_FAILURES = 10;

export function vapidKeys(env: NodeJS.ProcessEnv = process.env): VapidKeys | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: env.VAPID_SUBJECT?.trim() || "mailto:hello@glowbydilek.nl" };
}

/** Adds a notification once (same dedupeKey → nothing happens). Returns true when new. */
export async function addNotification(db: DB, n: NewNotification, opts: { createdAt?: Date; push?: boolean } = {}): Promise<boolean> {
  const [r] = (await db
    .insert(notifications)
    .ignore()
    .values({
      dedupeKey: n.dedupeKey.slice(0, 190),
      kind: n.kind,
      category: n.category,
      title: n.title.slice(0, 120),
      body: (n.body ?? "").slice(0, 200),
      url: n.url,
      entityType: n.entityType ?? null,
      entityId: n.entityId ?? null,
      actionable: n.actionable,
      pushStatus: opts.push === false ? "skipped" : "pending",
      ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
    })) as unknown as [{ affectedRows: number }];
  return r.affectedRows === 1;
}

type Pending = NewNotification & { since: Date };

/** Everything that currently needs Dilek's attention, read from the source tables. */
async function pendingItems(db: DB): Promise<Pending[]> {
  const [reqs, msgs, mails, intakes] = await Promise.all([
    db
      .select({ id: appointments.id, createdAt: appointments.createdAt })
      .from(appointments)
      .where(and(eq(appointments.status, "requested"), isNull(appointments.archivedAt))),
    db.select({ id: inquiries.id, createdAt: inquiries.createdAt }).from(inquiries).where(inArray(inquiries.status, ["new", "read"])),
    db
      .select({ id: outbox.id, kind: outbox.kind, appointmentId: outbox.appointmentId, ref: outbox.attachmentRef, createdAt: outbox.createdAt })
      .from(outbox)
      .where(eq(outbox.status, "failed")),
    db
      .select({ id: intakeDocuments.id, customerId: intakeDocuments.customerId, createdAt: intakeDocuments.createdAt })
      .from(intakeDocuments)
      .where(and(eq(intakeDocuments.source, "digital"), eq(intakeDocuments.status, "current"), isNull(intakeDocuments.reviewedAt))),
  ]);
  const out: Pending[] = [];
  // Lock-screen safe wording: no names, treatments, health or invoice details.
  for (const r of reqs)
    out.push({ dedupeKey: `appt-request:${r.id}`, kind: "appointment_request", category: "afspraak", title: "Nieuwe afspraakaanvraag", body: "Open de agenda om te bevestigen of af te wijzen.", url: `/agenda/afspraak/${r.id}`, entityType: "appointment", entityId: r.id, actionable: true, since: r.createdAt });
  for (const m of msgs)
    out.push({ dedupeKey: `inquiry:${m.id}`, kind: "customer_message", category: "bericht", title: "Nieuw bericht van een klant", body: "Open de agenda om het bericht te lezen.", url: `/agenda/berichten/${m.id}`, entityType: "inquiry", entityId: m.id, actionable: true, since: m.createdAt });
  for (const d of intakes)
    out.push({ dedupeKey: `intake-digital:${d.id}`, kind: "intake_digital", category: "intake", title: "Nieuw intakeformulier ingevuld", body: "Open de agenda om het te controleren.", url: `/agenda/klanten/${d.customerId}`, entityType: "intake", entityId: d.id, actionable: true, since: d.createdAt });
  for (const e of mails) {
    if (e.kind === "owner_request") continue; // a notice to Dilek herself, not a customer action
    const invoice = e.kind === "invoice" && e.ref;
    out.push({
      dedupeKey: `outbox-failed:${e.id}`,
      kind: invoice ? "invoice_send_failed" : "email_send_failed",
      category: invoice ? "factuur" : "systeem",
      title: invoice ? "Factuur niet verzonden" : "E-mail aan klant niet verzonden",
      body: "Open de agenda om opnieuw te versturen.",
      url: invoice ? `/agenda/facturen/${e.ref}` : e.appointmentId ? `/agenda/afspraak/${e.appointmentId}` : "/agenda/meldingen",
      entityType: "outbox",
      entityId: e.id,
      actionable: true,
      since: e.createdAt,
    });
  }
  return out;
}

/** Brings notifications in line with the source tables. Safe to call often and concurrently. */
export async function syncNotifications(db: DB, now = new Date()): Promise<{ created: number; resolved: number }> {
  const items = await pendingItems(db);
  let created = 0;
  for (const it of items) {
    const old = now.getTime() - it.since.getTime() > BACKFILL_MS;
    if (await addNotification(db, it, { push: !old })) created++;
  }
  const keys = new Set(items.map((i) => i.dedupeKey));
  const open = await db
    .select({ id: notifications.id, dedupeKey: notifications.dedupeKey })
    .from(notifications)
    .where(and(eq(notifications.state, "open"), eq(notifications.actionable, true), inArray(notifications.entityType, ["appointment", "inquiry", "outbox", "intake"])));
  const stale = open.filter((n) => !keys.has(n.dedupeKey)).map((n) => n.id);
  if (stale.length) await db.update(notifications).set({ state: "resolved", resolvedAt: now }).where(inArray(notifications.id, stale));
  // A resolved item never needs a late push.
  if (stale.length) await db.update(notifications).set({ pushStatus: "skipped" }).where(and(inArray(notifications.id, stale), eq(notifications.pushStatus, "pending")));
  return { created, resolved: stale.length };
}

export async function badgeCount(db: DB): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.state, "open"), eq(notifications.actionable, true)));
  return Number(r.n);
}

export async function unreadCount(db: DB): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(notifications).where(and(isNull(notifications.readAt), ne(notifications.state, "dismissed")));
  return Number(r.n);
}

export type Filter = "actie" | "ongelezen" | "afgehandeld" | "alle";

export async function listNotifications(db: DB, filter: Filter = "actie", category?: Category, limit = 100) {
  const conds = [
    filter === "actie" ? and(eq(notifications.state, "open"), eq(notifications.actionable, true)) : undefined,
    filter === "ongelezen" ? and(isNull(notifications.readAt), ne(notifications.state, "dismissed")) : undefined,
    filter === "afgehandeld" ? inArray(notifications.state, ["resolved", "dismissed"]) : undefined,
    category ? eq(notifications.category, category) : undefined,
  ].filter(Boolean);
  return db.select().from(notifications).where(conds.length ? and(...conds) : undefined).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markRead(db: DB, ids: number[] | "all", now = new Date()) {
  await db
    .update(notifications)
    .set({ readAt: now })
    .where(and(isNull(notifications.readAt), ids === "all" ? undefined : inArray(notifications.id, ids.length ? ids : [0])));
}

/** Only informational notifications can be dismissed; actions disappear when the item is handled. */
export async function dismiss(db: DB, id: number, now = new Date()): Promise<boolean> {
  const [r] = (await db
    .update(notifications)
    .set({ state: "dismissed", resolvedAt: now, readAt: now })
    .where(and(eq(notifications.id, id), eq(notifications.actionable, false), eq(notifications.state, "open")))) as unknown as [{ affectedRows: number }];
  return r.affectedRows === 1;
}

/** Marks the notification for a record read when Dilek opens that record (count unchanged). */
export async function markReadFor(db: DB, entityType: string, entityId: number, now = new Date()) {
  await db.update(notifications).set({ readAt: now }).where(and(eq(notifications.entityType, entityType), eq(notifications.entityId, entityId), isNull(notifications.readAt)));
}

// ─────────────────────────────────────────────────────── Subscriptions

export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export function parseSubscription(v: unknown): SubscriptionInput | null {
  const s = v as SubscriptionInput;
  if (!s || typeof s.endpoint !== "string" || !s.keys || typeof s.keys.p256dh !== "string" || typeof s.keys.auth !== "string") return null;
  if (!isAllowedEndpoint(s.endpoint)) return null;
  const p = Buffer.from(s.keys.p256dh, "base64url");
  const a = Buffer.from(s.keys.auth, "base64url");
  if (p.length !== 65 || p[0] !== 4 || a.length !== 16) return null;
  return { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } };
}

const hashEndpoint = (e: string) => createHash("sha256").update(e).digest("hex");

/** Stores (or moves) a device subscription to the signed-in user. */
export async function saveSubscription(db: DB, userId: number, s: SubscriptionInput, device: string) {
  const h = hashEndpoint(s.endpoint);
  await db
    .insert(pushSubscriptions)
    .values({ userId, endpointHash: h, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, device: device.slice(0, 80) })
    .onDuplicateKeyUpdate({ set: { userId, p256dh: s.keys.p256dh, auth: s.keys.auth, device: device.slice(0, 80), failures: 0, disabledAt: null } });
}

export async function removeSubscription(db: DB, userId: number, endpoint: string) {
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpointHash, hashEndpoint(endpoint)), eq(pushSubscriptions.userId, userId)));
}

export async function listDevices(db: DB, userId: number) {
  return db
    .select({ id: pushSubscriptions.id, device: pushSubscriptions.device, createdAt: pushSubscriptions.createdAt, lastSuccessAt: pushSubscriptions.lastSuccessAt, disabledAt: pushSubscriptions.disabledAt })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .orderBy(desc(pushSubscriptions.createdAt));
}

export async function removeDevice(db: DB, userId: number, id: number) {
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.id, id), eq(pushSubscriptions.userId, userId)));
}

/** Subscriptions that may receive business notifications: active owner accounts only (staff roles get none for now). */
async function activeTargets(db: DB, userId?: number) {
  return db
    .select({ id: pushSubscriptions.id, endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth, failures: pushSubscriptions.failures })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(and(isNull(pushSubscriptions.disabledAt), eq(users.disabled, false), eq(users.role, "owner"), userId ? eq(pushSubscriptions.userId, userId) : undefined));
}

export type Sender = (t: PushTarget, payload: object, opts: { topic?: string }) => Promise<PushResult>;

async function recordResult(db: DB, sub: { id: number; failures: number }, r: PushResult, now: Date) {
  if (r.ok) await db.update(pushSubscriptions).set({ failures: 0, lastSuccessAt: now }).where(eq(pushSubscriptions.id, sub.id));
  else if (r.gone || sub.failures + 1 >= MAX_SUB_FAILURES) await db.update(pushSubscriptions).set({ disabledAt: now, failures: sub.failures + 1 }).where(eq(pushSubscriptions.id, sub.id));
  else await db.update(pushSubscriptions).set({ failures: sub.failures + 1 }).where(eq(pushSubscriptions.id, sub.id));
}

/**
 * Sends queued pushes to every active device. One notification = one push per
 * device; the payload carries the current badge count so the icon is right
 * even when the app is closed.
 */
export async function deliverPushes(db: DB, send?: Sender, now = new Date()): Promise<{ sent: number; failed: number }> {
  const keys = vapidKeys();
  const sender: Sender | null = send ?? (keys ? (t, p, o) => sendPush(t, p, keys, { topic: o.topic }) : null);
  const due = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.pushStatus, "pending"), lt(notifications.pushAttempts, MAX_PUSH_ATTEMPTS)))
    .orderBy(notifications.id)
    .limit(20);
  if (!due.length) return { sent: 0, failed: 0 };
  if (!sender) {
    // No push keys configured: keep everything in the Agenda, mark as not pushed.
    await db.update(notifications).set({ pushStatus: "skipped" }).where(inArray(notifications.id, due.map((d) => d.id)));
    return { sent: 0, failed: 0 };
  }
  const targets = await activeTargets(db);
  let sent = 0;
  let failed = 0;
  for (const n of due) {
    // Claim (no double push when two ticks overlap).
    const [claim] = (await db
      .update(notifications)
      .set({ pushStatus: "sending", pushAttempts: n.pushAttempts + 1 })
      .where(and(eq(notifications.id, n.id), eq(notifications.pushStatus, "pending")))) as unknown as [{ affectedRows: number }];
    if (claim.affectedRows !== 1) continue;
    if (!targets.length) {
      await db.update(notifications).set({ pushStatus: "skipped" }).where(eq(notifications.id, n.id));
      continue;
    }
    const badge = await badgeCount(db);
    const payload = { title: n.title, body: n.body, url: n.url, tag: n.dedupeKey, badge };
    let anyOk = false;
    let anyRetry = false;
    for (const t of targets) {
      const r = await sender(t, payload, { topic: n.dedupeKey });
      await recordResult(db, t, r, now);
      if (r.ok) anyOk = true;
      else if (r.retry) anyRetry = true;
    }
    const status = anyOk ? "sent" : anyRetry && n.pushAttempts + 1 < MAX_PUSH_ATTEMPTS ? "pending" : "failed";
    await db.update(notifications).set({ pushStatus: status }).where(eq(notifications.id, n.id));
    if (anyOk) sent++;
    else failed++;
  }
  return { sent, failed };
}

/** A test message to the signed-in user's devices (Instellingen → "Testmelding sturen"). */
export async function sendTestPush(db: DB, userId: number, send?: Sender): Promise<{ devices: number; delivered: number }> {
  const keys = vapidKeys();
  const sender: Sender | null = send ?? (keys ? (t, p, o) => sendPush(t, p, keys, { topic: o.topic }) : null);
  if (!sender) return { devices: 0, delivered: 0 };
  const targets = await activeTargets(db, userId);
  const badge = await badgeCount(db);
  let delivered = 0;
  const now = new Date();
  for (const t of targets) {
    const r = await sender(t, { title: "Testmelding", body: "Meldingen werken op dit apparaat.", url: "/agenda/meldingen", tag: "test", badge }, { topic: "test" });
    await recordResult(db, t, r, now);
    if (r.ok) delivered++;
  }
  return { devices: targets.length, delivered };
}

/** After a change (new request, new message): sync and push right away, bounded in time. */
export async function notifySoon(db: DB) {
  try {
    await Promise.race([
      (async () => {
        await syncNotifications(db);
        await deliverPushes(db);
      })(),
      new Promise((r) => setTimeout(r, 8000)),
    ]);
  } catch (err) {
    console.error("[notify] inline delivery failed:", err instanceof Error ? err.message.slice(0, 120) : "error");
  }
}

/** Releases pushes stuck in "sending" for 10+ minutes (a crashed run) so the next tick retries them. */
export async function releaseStuck(db: DB, now = new Date()) {
  await db
    .update(notifications)
    .set({ pushStatus: "pending" })
    .where(and(eq(notifications.pushStatus, "sending"), lt(notifications.createdAt, new Date(now.getTime() - 10 * 60_000))));
}
