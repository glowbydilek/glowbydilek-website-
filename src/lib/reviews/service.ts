import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { appointments, appointmentTreatments, customers, reviewInvites, reviews } from "../db/schema";
import { getSetting, setSetting } from "../db/settings";
import { enqueue } from "../notifications/outbox";

/**
 * Customer reviews.
 * - Every review starts as "pending"; only the owner publishes.
 * - Genuine positive and negative reviews are treated the same way; the
 *   owner may reply publicly. Rejection is for spam, abuse, personal data
 *   or reviews that are not about a real visit.
 * - Invitation links (after a completed appointment) mark a review as a
 *   verified visit. Nothing is fabricated, incentivised or imported.
 * - No review structured data is emitted: Google does not show stars for
 *   reviews a business publishes about itself on its own site.
 */

export type ReviewSettings = { googleReviewUrl: string; invitesEnabled: boolean };
export const defaultReviewSettings: ReviewSettings = { googleReviewUrl: "", invitesEnabled: true };
export const getReviewSettings = (db: DB) => getSetting(db, "reviews", defaultReviewSettings);
export const saveReviewSettings = (db: DB, v: ReviewSettings, userId: number) => setSetting(db, "reviews", v, userId);

export class ReviewError extends Error {}

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

export type ReviewInput = {
  rating: number;
  body: string;
  displayName: string;
  displayMode: "name" | "initials" | "anonymous";
  treatmentId?: string | null;
  locale: "nl" | "en";
  email?: string | null;
  inviteToken?: string | null;
};

export function validateReview(raw: Record<string, unknown>): { ok: true; data: ReviewInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const rating = Number(raw.rating);
  const body = String(raw.body ?? "").trim();
  const name = String(raw.displayName ?? "").trim();
  const mode = String(raw.displayMode ?? "name");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "required";
  if (body.length < 20) errors.body = "tooShort";
  if (body.length > 1500) errors.body = "tooLong";
  if (!name || name.length > 60) errors.displayName = "required";
  if (/https?:\/\/|www\./i.test(body)) errors.body = "links";
  if (raw.privacy !== true) errors.privacy = "required";
  const email = String(raw.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) errors.email = "invalid";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      rating,
      body: body.replace(/\s+\n/g, "\n").slice(0, 1500),
      displayName: name.replace(/[\r\n]/g, " ").slice(0, 60),
      displayMode: mode === "initials" || mode === "anonymous" ? mode : "name",
      treatmentId: typeof raw.treatmentId === "string" && /^[a-z-]{2,40}$/.test(raw.treatmentId) ? raw.treatmentId : null,
      locale: raw.locale === "en" ? "en" : "nl",
      email: email || null,
      inviteToken: typeof raw.inviteToken === "string" && /^[A-Za-z0-9_-]{20,80}$/.test(raw.inviteToken) ? raw.inviteToken : null,
    },
  };
}

/** Stores a review as pending. A valid invitation marks it as a verified visit (single use). */
export async function submitReview(db: DB, r: ReviewInput, now = new Date()): Promise<{ id: number; verified: boolean }> {
  return db.transaction(async (tx) => {
    let verified = false;
    let customerId: number | null = null;
    let appointmentId: number | null = null;
    if (r.inviteToken) {
      const [inv] = await tx.select().from(reviewInvites).where(and(eq(reviewInvites.tokenHash, sha(r.inviteToken)), isNull(reviewInvites.usedAt), gt(reviewInvites.expiresAt, now))).for("update");
      if (inv) {
        verified = true;
        customerId = inv.customerId;
        appointmentId = inv.appointmentId;
        await tx.update(reviewInvites).set({ usedAt: now }).where(eq(reviewInvites.id, inv.id));
      }
    }
    const [res] = (await tx.insert(reviews).values({
      rating: r.rating,
      body: r.body,
      displayName: r.displayName,
      displayMode: r.displayMode,
      treatmentId: r.treatmentId ?? null,
      locale: r.locale,
      status: "pending",
      verified,
      customerId,
      appointmentId,
      emailHash: r.email ? sha(r.email.toLowerCase()) : null,
    })) as unknown as [{ insertId: number }];
    return { id: res.insertId, verified };
  });
}

export async function moderateReview(db: DB, id: number, op: "publish" | "reject" | "remove" | "pending", note: string, userId: number) {
  const status = op === "publish" ? "published" : op === "reject" ? "rejected" : op === "remove" ? "removed" : "pending";
  await db
    .update(reviews)
    .set({ status, moderationNote: note.slice(0, 300) || null, moderatedAt: new Date(), ...(status === "published" ? { publishedAt: sql`COALESCE(${reviews.publishedAt}, CURRENT_TIMESTAMP(3))`, reportCount: 0 } : {}) })
    .where(eq(reviews.id, id));
  await audit(db, { userId, action: `review.${op}`, entity: "review", entityId: id });
}

export async function replyToReview(db: DB, id: number, reply: string, userId: number) {
  await db.update(reviews).set({ ownerReply: reply.trim().slice(0, 1000) || null }).where(eq(reviews.id, id));
  await audit(db, { userId, action: "review.replied", entity: "review", entityId: id });
}

/** Public "report this review": after 3 reports a review goes back to moderation. */
export async function reportReview(db: DB, id: number) {
  await db.update(reviews).set({ reportCount: sql`${reviews.reportCount} + 1` }).where(and(eq(reviews.id, id), eq(reviews.status, "published")));
  await db.update(reviews).set({ status: "pending", moderationNote: "Gemeld door bezoekers — controleer opnieuw" }).where(and(eq(reviews.id, id), eq(reviews.status, "published"), sql`${reviews.reportCount} >= 3`));
}

export type PublicReview = { id: number; rating: number; body: string; name: string; verified: boolean; date: Date; reply: string | null; locale: string; treatmentId: string | null };

export function displayName(r: { displayName: string; displayMode: string }, anonymous: string): string {
  if (r.displayMode === "anonymous") return anonymous;
  if (r.displayMode === "initials")
    return r.displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => `${p[0]!.toUpperCase()}.`)
      .join(" ");
  return r.displayName.split(/\s+/).slice(0, 2).join(" ");
}

export async function publishedReviews(db: DB, anonymous: string, limit = 60): Promise<{ list: PublicReview[]; count: number; average: number | null }> {
  const rows = await db.select().from(reviews).where(eq(reviews.status, "published")).orderBy(desc(reviews.publishedAt)).limit(limit);
  const [agg] = await db.select({ n: sql<string>`COUNT(*)`, avg: sql<string>`AVG(${reviews.rating})` }).from(reviews).where(eq(reviews.status, "published"));
  return {
    list: rows.map((r) => ({ id: r.id, rating: r.rating, body: r.body, name: displayName(r, anonymous), verified: r.verified, date: r.publishedAt ?? r.createdAt, reply: r.ownerReply, locale: r.locale, treatmentId: r.treatmentId })),
    count: Number(agg?.n ?? 0),
    average: agg?.avg != null ? Math.round(Number(agg.avg) * 10) / 10 : null,
  };
}

/**
 * Invitation after a completed appointment: a single-use link (30 days),
 * emailed through the outbox. Only the owner triggers it; no incentives.
 */
export async function inviteForReview(db: DB, appointmentId: number, userId: number, siteUrl: string) {
  const [a] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
  if (!a || a.status !== "completed") throw new ReviewError("Alleen na een afgeronde afspraak.");
  const [c] = await db.select().from(customers).where(eq(customers.id, a.customerId));
  if (!c?.email || c.anonymizedAt) throw new ReviewError("Er is geen e-mailadres van deze klant bekend.");
  const [already] = await db.select({ id: reviewInvites.id }).from(reviewInvites).where(eq(reviewInvites.appointmentId, appointmentId));
  if (already) throw new ReviewError("Voor deze afspraak is al een uitnodiging verstuurd.");
  const token = randomBytes(24).toString("base64url");
  const items = await db.select({ nl: appointmentTreatments.nameNl, en: appointmentTreatments.nameEn }).from(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, appointmentId));
  const en = c.locale === "en";
  const base = siteUrl.replace(/\/+$/, "");
  const link = en ? `${base}/en/reviews?t=${token}#write` : `${base}/beoordelingen?t=${token}#schrijven`;
  const what = items.map((i) => (en ? i.en : i.nl)).join(", ");
  const paragraphs = en
    ? [`Dear ${c.firstName},`, `Thank you for your visit${what ? ` for ${what}` : ""}. Would you share your experience? It takes a minute, and every honest review — positive or critical — helps.`, link, "The link works once and is valid for 30 days. Of course you are free not to respond.", "Kind regards,\nDilek — Glow by Dilek"]
    : [`Beste ${c.firstName},`, `Dank je wel voor je bezoek${what ? ` voor ${what}` : ""}. Wil je je ervaring delen? Het kost een minuut, en elke eerlijke beoordeling, positief of kritisch, helpt.`, link, "De link werkt één keer en is 30 dagen geldig. Reageren is natuurlijk helemaal vrijblijvend.", "Hartelijke groet,\nDilek — Glow by Dilek"];
  await db.transaction(async (tx) => {
    await tx.insert(reviewInvites).values({ tokenHash: sha(token), appointmentId, customerId: c.id, expiresAt: new Date(Date.now() + 30 * 86_400_000) });
    await enqueue(tx, {
      dedupeKey: `review_invite:${appointmentId}`,
      kind: "review_invite",
      appointmentId,
      customerId: c.id,
      to: c.email!,
      replyTo: process.env.MAIL_TO || process.env.SMTP_USER || null,
      subject: en ? "How was your visit? — Glow by Dilek" : "Hoe was je bezoek? — Glow by Dilek",
      text: paragraphs.join("\n\n"),
      html: paragraphs.map((p) => (p.startsWith("http") ? `<p><a href="${p}">${en ? "Write a review" : "Schrijf een beoordeling"}</a></p>` : `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)).join(""),
    });
  });
  await audit(db, { userId, action: "review.invited", entity: "appointment", entityId: appointmentId });
}
