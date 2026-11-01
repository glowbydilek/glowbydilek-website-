"use server";

import { headers } from "next/headers";
import { databaseConfigured, getDb } from "../db/client";
import { hitLimit } from "../db/limits";
import { defaultPrivateSettings, getSetting } from "../db/settings";
import { QuoteError, respondQuote } from "../booking/quotes";
import { deliverSoon } from "../notifications/deliver";
import { clientIp } from "./ip";
import { fingerprint } from "./rateLimit";

export type QuoteState = { done?: "accepted" | "declined"; error?: "expired" | "answered" | "notFound" | "rateLimited" | "unavailable" };

/**
 * Public accept/decline of a price proposal. The token is the only
 * credential (single-use, 256-bit, stored hashed); the action is rate
 * limited per IP and Next.js server actions reject cross-origin posts.
 */
export async function respondQuoteAction(_: QuoteState, f: FormData): Promise<QuoteState> {
  if (!databaseConfigured()) return { error: "unavailable" };
  const token = String(f.get("token") ?? "");
  const accept = f.get("decision") === "accept";
  const db = getDb();
  const ip = clientIp({ headers: await headers() });
  if (!(await hitLimit(db, `quote:ip:${fingerprint(ip)}`, 20, 10 * 60_000))) return { error: "rateLimited" };
  const priv = await getSetting(db, "private", defaultPrivateSettings);
  try {
    await respondQuote(db, token, accept, fingerprint("quote", ip), priv.ownerNotifyEmail || process.env.MAIL_TO || process.env.SMTP_USER || "");
  } catch (err) {
    if (err instanceof QuoteError) return { error: err.code === "expired" ? "expired" : err.code === "notFound" ? "notFound" : "answered" };
    console.error("[quote] respond failed:", err instanceof Error ? err.message.slice(0, 160) : err);
    return { error: "unavailable" };
  }
  await deliverSoon(db);
  return { done: accept ? "accepted" : "declined" };
}
