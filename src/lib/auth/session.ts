import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { databaseConfigured, getDb } from "../db/client";
import { clientIp } from "../forms/ip";
import { getSetting } from "../db/settings";
import { permissionsOf, type Perm } from "./permissions";
import { getSession, SESSION_ABSOLUTE_MS, type SessionInfo } from "./service";

/**
 * Session cookie: random token (only its hash is in the database),
 * HttpOnly, Secure, SameSite=Lax, path "/". The __Host- prefix makes the
 * browser refuse the cookie unless it is Secure and host-only.
 * Server Actions are protected against CSRF by Next.js (Origin must match
 * Host); private API route handlers call assertSameOrigin().
 */
const secure = process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true";
export const SESSION_COOKIE = secure ? "__Host-glow_session" : "glow_session";

export type Area = "admin" | "agenda";

export async function requestContext() {
  const h = await headers();
  return { ip: clientIp({ headers: h }), userAgent: h.get("user-agent") };
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_ABSOLUTE_MS / 1000),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** The current session (memoised per request). */
export const currentSession = cache(async (): Promise<SessionInfo | null> => {
  if (!databaseConfigured()) return null;
  const token = await sessionToken();
  try {
    return await getSession(getDb(), token);
  } catch (err) {
    // A failing database means "not signed in" (fail closed); the login page explains why.
    console.error("[auth] session lookup failed:", (err as { code?: string })?.code ?? "error");
    return null;
  }
});

/** Owner-delegated extra permissions per user id (setting "user_permissions"). */
export const USER_PERMISSIONS_SETTING = "user_permissions";

/** Effective permissions of the signed-in person (memoised per request). */
export const currentPermissions = cache(async (): Promise<Set<Perm>> => {
  const s = await currentSession();
  if (!s || (s.mfaRequired && !s.mfaPassed)) return new Set();
  let delegations: unknown = [];
  if (s.user.role !== "owner") {
    try {
      const map = await getSetting(getDb(), USER_PERMISSIONS_SETTING, {} as Record<string, unknown>);
      delegations = map[String(s.user.id)] ?? [];
    } catch {
      delegations = []; // fail closed: base permissions only
    }
  }
  return permissionsOf({ role: s.user.role, mfa: s.user.mfaEnabled && s.mfaPassed, delegations });
});

/** Where a signed-in person without access to a page is sent (never a redirect loop). */
async function noAccess(area: Area): Promise<never> {
  const perms = await currentPermissions();
  if (area === "admin" && perms.has("agenda.view")) redirect("/agenda?geen-toegang=1");
  if (area === "agenda" && perms.has("agenda.view")) redirect("/agenda?geen-toegang=1");
  if (perms.has("cms.edit")) redirect("/admin/paginas?geen-toegang=1");
  redirect("/login?geen-toegang=1");
}

async function signedIn(area: Area, next?: string): Promise<SessionInfo> {
  const s = await currentSession();
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  if (!s) redirect(`/${area}/login${q}`);
  if (s.mfaRequired && !s.mfaPassed) redirect(`/${area}/login/verificatie${q}`);
  return s;
}

/** Any signed-in person, any role (own account and security settings). */
export async function requireSignedIn(area: Area, next?: string): Promise<SessionInfo> {
  return signedIn(area, next);
}

export async function assertSignedIn(): Promise<SessionInfo> {
  const s = await currentSession();
  if (!s || (s.mfaRequired && !s.mfaPassed)) throw new UnauthorizedError();
  return s;
}

/**
 * Guards an owner-only private page. Not signed in → login; second factor
 * pending → MFA step; another role → a page that person may use.
 */
export async function requireOwner(area: Area, next?: string): Promise<SessionInfo> {
  const s = await signedIn(area, next);
  if (s.user.role !== "owner") await noAccess(area);
  return s;
}

/** Guards a private page that needs one permission (owners always pass). */
export async function requireCan(area: Area, perm: Perm, next?: string): Promise<SessionInfo> {
  const s = await signedIn(area, next);
  if (!(await currentPermissions()).has(perm)) await noAccess(area);
  return s;
}

/** Owner-only check for server actions and route handlers (throws instead of redirecting). */
export async function assertOwner(): Promise<SessionInfo> {
  const s = await currentSession();
  if (!s || (s.mfaRequired && !s.mfaPassed) || s.user.role !== "owner") throw new UnauthorizedError();
  return s;
}

/** Permission check for server actions and route handlers. */
export async function assertCan(perm: Perm): Promise<SessionInfo> {
  const s = await currentSession();
  if (!s || (s.mfaRequired && !s.mfaPassed) || !(await currentPermissions()).has(perm)) throw new UnauthorizedError();
  return s;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Only allow redirects to our own private areas after login. */
export function safeNext(next: string | undefined | null, area: Area): string {
  // The central /login page doubles as the "choose an area" page once signed in.
  if (next === "/login") return next;
  if (!next || !/^\/(admin|agenda)(\/[\w\-/?=&%.]*)?$/.test(next) || next.includes("//")) return `/${area}`;
  if (/\/login|wachtwoord-/.test(next)) return `/${area}`;
  return next;
}

/** CSRF guard for private JSON/form route handlers. */
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!origin || !host || new URL(origin).host !== host) throw new UnauthorizedError();
}
