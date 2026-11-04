/**
 * Cookie-consent record (browser only, no server log, no identifier).
 *
 * Stored in localStorage under `glow-consent-v2` for at most 12 months, then
 * asked again. `policy` is the cookie-policy version the choice was made
 * under; a new version invalidates older choices. The record is the
 * visitor's own evidence of the choice (what, when, which policy version) —
 * nothing is sent to a server, so no consent identifier ends up in logs.
 */
export const CONSENT_KEY = "glow-consent-v2";
export const CONSENT_EVENT = "glow:consent";
/** Bump when the cookie inventory or purposes change (visitors are asked again). */
export const CONSENT_POLICY_VERSION = "2026-11-04";
export const CONSENT_MAX_AGE_MS = 365 * 24 * 3600_000;

export type ConsentRecord = { v: 2; analytics: boolean; marketing: boolean; at: string; policy: string };

export function parseConsent(raw: string | null, now = Date.now()): ConsentRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Partial<ConsentRecord>;
    if (r.v !== 2 || typeof r.analytics !== "boolean" || typeof r.marketing !== "boolean" || typeof r.at !== "string") return null;
    if (r.policy !== CONSENT_POLICY_VERSION) return null;
    const at = Date.parse(r.at);
    if (!Number.isFinite(at) || now - at > CONSENT_MAX_AGE_MS || at - now > 60_000) return null;
    return { v: 2, analytics: r.analytics, marketing: r.marketing, at: r.at, policy: r.policy };
  } catch {
    return null;
  }
}

export function readConsent(): ConsentRecord | null {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    return null; // private mode / blocked storage: ask (nothing optional loads)
  }
}

export function writeConsent(c: { analytics: boolean; marketing: boolean }) {
  const rec: ConsentRecord = { v: 2, analytics: c.analytics, marketing: c.marketing, at: new Date().toISOString(), policy: CONSENT_POLICY_VERSION };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(rec));
    window.localStorage.removeItem("glow-consent-v1"); // the old yes/no choice is not valid for the new categories
  } catch {
    /* storage blocked: the choice applies to this page view only */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
  return rec;
}

/** Google Consent Mode v2 values for a choice. Marketing is never granted unless chosen. */
export function consentModeState(c: { analytics: boolean; marketing: boolean }) {
  const a = c.analytics ? "granted" : "denied";
  const m = c.marketing ? "granted" : "denied";
  return { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m } as const;
}

/**
 * Pages that are never measured: private areas and personal token links
 * (their path contains a secret). The public site shell is the only place
 * measurement code is rendered; this is a second line of defence.
 */
const PRIVATE = /^\/(admin|agenda|ajanda|login|api|offerte|media)(\/|$)|^\/en\/quote(\/|$)|^\/tr\/teklif(\/|$)/;
export function isTrackablePath(path: string): boolean {
  return !PRIVATE.test(path);
}

/** Removes Google Analytics cookies (_ga, _ga_*, _gid) on withdrawal. */
export function clearAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid" || n === "_gat");
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const n of names) for (const d of domains) document.cookie = `${n}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}; SameSite=Lax`;
}
