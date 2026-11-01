import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { findMatches } from "@/lib/crm/service";
import { matchLabel } from "@/lib/crm/normalize";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Returning-customer recognition while the owner types a new appointment.
 * Owner-only, same-origin fetch; returns only what the form needs.
 */
export async function GET(req: Request) {
  try {
    await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const q = new URL(req.url).searchParams;
  const v = (k: string) => (q.get(k) ?? "").slice(0, 190);
  const matches = await findMatches(getDb(), { email: v("email"), phone: v("phone"), firstName: v("first"), lastName: v("last") }, { limit: 6 });
  return NextResponse.json(
    {
      matches: matches.map((m) => ({
        id: m.customer.id,
        firstName: m.customer.firstName,
        lastName: m.customer.lastName,
        email: m.customer.email,
        phone: m.customer.phone,
        locale: m.customer.locale,
        strong: m.strong,
        reason: matchLabel(m.reasons),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
