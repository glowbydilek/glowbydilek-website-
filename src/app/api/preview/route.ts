import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { matchPage } from "@/i18n/config";

export const dynamic = "force-dynamic";

/** Turns draft preview on (owner only) and opens a public page; ?stop=1 turns it off. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dm = await draftMode();
  if (url.searchParams.get("stop")) {
    dm.disable();
    return NextResponse.redirect(new URL("/", req.url));
  }
  try {
    await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const path = url.searchParams.get("path") ?? "/";
  // Only our own public pages (no open redirect).
  const safe = /^\/[\w\-/]*$/.test(path) && !path.startsWith("//") && (matchPage(path) || /^\/(en\/)?info\/[\w-]+$/.test(path)) ? path : "/";
  dm.enable();
  return NextResponse.redirect(new URL(safe, req.url));
}
