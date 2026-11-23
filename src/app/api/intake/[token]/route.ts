import { NextResponse, type NextRequest } from "next/server";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { hitLimit } from "@/lib/db/limits";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint } from "@/lib/forms/rateLimit";
import { submitIntake, type IntakeSubmission } from "@/lib/intake/digital";
import { notifySoon } from "@/lib/notify/service";

export const dynamic = "force-dynamic";

const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

/** The customer submits the filled, signed intake form. Health answers are never logged. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!databaseConfigured()) return json(503, { ok: false, error: "unavailable" });
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json(403, { ok: false, error: "forbidden" });
  if (!req.headers.get("content-type")?.includes("application/json")) return json(415, { ok: false, error: "unsupported" });
  const db = getDb();
  if (!(await hitLimit(db, `intake:${fingerprint(clientIp(req))}`, 10, 10 * 60_000))) return json(429, { ok: false, error: "rateLimited" });
  const raw = await req.text();
  if (raw.length > 400_000) return json(413, { ok: false, error: "tooLarge" });
  let body: IntakeSubmission;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: "invalid" });
  }
  const { token } = await params;
  const r = await submitIntake(db, token, body).catch((err) => {
    console.error("[intake] submit failed:", err instanceof Error ? err.name : "error");
    return { ok: false as const, error: "unavailable" };
  });
  if (!r.ok) return json(r.error === "expired" ? 410 : r.error === "unavailable" ? 503 : 422, { ok: false, error: r.error });
  await notifySoon(db).catch(() => null);
  return json(200, { ok: true, pdf: r.pdf.toString("base64") });
}
