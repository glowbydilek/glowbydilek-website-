"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  CONSENT_EVENT,
  type ConsentRecord,
  clearAnalyticsCookies,
  consentModeState,
  isTrackablePath,
  readConsent,
  writeConsent,
} from "@/lib/analytics/consent";

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; glowTrack?: (n: string, p: Record<string, string>) => void };

export type ConsentLabels = {
  title: string;
  body: string;
  accept: string;
  decline: string;
  customize: string;
  save: string;
  close: string;
  more: string;
  privacy: string;
  prefsTitle: string;
  prefsIntro: string;
  always: string;
  on: string;
  off: string;
  notUsed: string;
  saved: string;
  categories: Record<"necessary" | "analytics" | "marketing", { title: string; body: string }>;
};

export type MeasurementConfig = { mode: "gtm" | "gtag"; gtmId: string; measurementId: string } | null;

/** "open the preferences" request from the footer link (any page). */
const OPEN_EVENT = "glow:consent-open";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CONSENT_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CONSENT_EVENT, cb);
  };
}

// Stable snapshot for useSyncExternalStore (the record is re-read only when it changes).
let cachedRaw: string | null | undefined;
let cachedRecord: ConsentRecord | null = null;
function snapshot(): ConsentRecord | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem("glow-consent-v2");
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedRecord = readConsent();
  }
  return cachedRecord;
}

/**
 * Cookie consent + measurement (GDPR / Dutch Telecommunicatiewet 11.7a).
 *
 * - Nothing optional loads before a choice: no Google script, no request, no
 *   cookie ("basic" Consent Mode). Reject is as easy as accept.
 * - On consent, Consent Mode v2 defaults are pushed as DENIED first and then
 *   updated with the visitor's choice, before any Google script loads.
 * - Exactly one loader: GTM (GA4 configured in the container) or GA4 direct.
 * - Private and token pages are never measured; only paths are sent, never
 *   query strings; events carry whitelisted, non-personal parameters only.
 */
export function Analytics({
  config,
  locale,
  labels,
  cookiePolicyHref,
  privacyHref,
  bookingPaths,
}: {
  config: MeasurementConfig;
  locale: "nl" | "en" | "tr";
  labels: ConsentLabels;
  cookiePolicyHref: string;
  privacyHref: string;
  bookingPaths: string[];
}) {
  const pathname = usePathname();
  const record = useSyncExternalStore<ConsentRecord | null | "ssr">(subscribe, snapshot, () => "ssr");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  const loaded = useRef(false);
  const consent = record === "ssr" ? null : record;
  const analyticsOn = Boolean(config && consent?.analytics);

  // Footer "Cookie settings" opens the preferences dialog.
  useEffect(() => {
    const open = () => setPrefsOpen(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  // Load the single measurement loader after consent (and update consent later on).
  useEffect(() => {
    if (!config || !consent) return;
    const w = window as W;
    const state = consentModeState(consent);
    if (!loaded.current) {
      if (!consent.analytics && !consent.marketing) return;
      // Never start Google on a private or personal-token page (e.g. /offerte/<token>), even with consent.
      if (!isTrackablePath(window.location.pathname)) return;
      loaded.current = true;
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", security_storage: "granted", functionality_storage: "granted" });
      w.gtag("set", "ads_data_redaction", true);
      w.gtag("set", "url_passthrough", false);
      w.gtag("consent", "update", state);
      const s = document.createElement("script");
      s.async = true;
      if (config.mode === "gtm") {
        // Official GTM bootstrap (same as Google's snippet), but only after consent, with Consent
        // Mode v2 defaults already in the dataLayer. Deliberately NO <noscript> iframe: without
        // JavaScript a visitor cannot give consent, so a fallback request to Google is not allowed.
        w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
        s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`;
        w.glowTrack = (n, p) => w.dataLayer?.push({ event: n, ...p, locale });
      } else {
        w.gtag("js", new Date());
        w.gtag("config", config.measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
        w.glowTrack = (n, p) => w.gtag?.("event", n, { ...p, locale });
      }
      document.head.appendChild(s);
    } else {
      w.gtag?.("consent", "update", state);
    }
  }, [config, consent, locale, pathname]);

  // Page views: path only (query strings can carry tokens); never private/token pages.
  useEffect(() => {
    if (!analyticsOn || !isTrackablePath(pathname)) return;
    const w = window as W;
    const params = { page_path: pathname, page_location: `${window.location.origin}${pathname}`, page_title: document.title };
    if (config!.mode === "gtm") w.dataLayer?.push({ event: "glow_page_view", ...params, locale });
    else w.gtag?.("event", "page_view", params);
  }, [pathname, analyticsOn, config, locale]);

  // Booking CTA clicks (interaction only — never counted as a booking).
  useEffect(() => {
    if (!analyticsOn) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && bookingPaths.includes(url.pathname) && isTrackablePath(pathname)) (window as W).glowTrack?.("cta_booking_click", { source: pathname.slice(0, 80) });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [analyticsOn, pathname, bookingPaths]);

  const decide = (analytics: boolean, marketing: boolean) => {
    const wasLoaded = loaded.current;
    writeConsent({ analytics, marketing });
    setPrefsOpen(false);
    setNotice(true);
    window.setTimeout(() => setNotice(false), 4000);
    if (wasLoaded && !analytics && !marketing) {
      // Withdrawal: tell Google, remove its cookies, and reload without any Google script.
      (window as W).gtag?.("consent", "update", consentModeState({ analytics: false, marketing: false }));
      clearAnalyticsCookies();
      window.location.reload();
    } else if (wasLoaded && !analytics) {
      clearAnalyticsCookies();
    }
  };

  if (record === "ssr") return null;
  const showBanner = Boolean(config) && !consent && !prefsOpen;
  return (
    <>
      {showBanner && (
        <div role="region" aria-labelledby="consent-title" className="consent-banner fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[60] mx-auto max-h-[70dvh] max-w-2xl overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:bottom-5 sm:p-5">
          <p id="consent-title" className="font-serif text-lg text-ink sm:text-xl">
            {labels.title}
          </p>
          <p className="mt-1.5 text-[0.8rem] leading-snug text-ink-soft sm:mt-2 sm:text-sm sm:leading-relaxed">
            {labels.body}{" "}
            <Link href={cookiePolicyHref} className="underline underline-offset-4">
              {labels.more}
            </Link>
          </p>
          {/* Accept and reject carry the same weight on purpose (no nudging). */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3">
            <button type="button" onClick={() => decide(true, false)} className="btn btn-outline min-h-11 px-3 py-2 text-sm">
              {labels.accept}
            </button>
            <button type="button" onClick={() => decide(false, false)} className="btn btn-outline min-h-11 px-3 py-2 text-sm">
              {labels.decline}
            </button>
            <button type="button" onClick={() => setPrefsOpen(true)} className="btn btn-outline col-span-2 min-h-11 px-3 py-2 text-sm sm:col-span-1">
              {labels.customize}
            </button>
          </div>
        </div>
      )}
      {prefsOpen && (
        <Preferences
          labels={labels}
          initial={consent}
          measurementAvailable={Boolean(config)}
          cookiePolicyHref={cookiePolicyHref}
          privacyHref={privacyHref}
          onClose={() => setPrefsOpen(false)}
          onSave={(a) => decide(a, false)}
          onAcceptAll={() => decide(Boolean(config), false)}
          onRejectAll={() => decide(false, false)}
        />
      )}
      <p role="status" aria-live="polite" className={notice ? "fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-sm rounded-full bg-ink px-5 py-3 text-center text-sm text-paper" : "sr-only"}>
        {notice ? labels.saved : ""}
      </p>
    </>
  );
}

function Preferences({
  labels,
  initial,
  measurementAvailable,
  cookiePolicyHref,
  privacyHref,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  labels: ConsentLabels;
  initial: ConsentRecord | null;
  measurementAvailable: boolean;
  cookiePolicyHref: string;
  privacyHref: string;
  onClose: () => void;
  onSave: (analytics: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  // No preselected optional consent: off unless the visitor switched it on before.
  const [analytics, setAnalytics] = useState(Boolean(initial?.analytics));
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  const row = (k: "necessary" | "analytics" | "marketing", control: React.ReactNode) => (
    <li key={k} className="border-t border-line py-4 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-ink">{labels.categories[k].title}</h3>
        {control}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{labels.categories[k].body}</p>
    </li>
  );
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="consent-dialog m-auto w-[min(36rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-soft)] backdrop:bg-ink/40"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-t`} className="font-serif text-2xl">
            {labels.prefsTitle}
          </h2>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm underline-offset-4 hover:underline">
            {labels.close}
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{labels.prefsIntro}</p>
        <ul className="mt-4">
          {row("necessary", <span className="text-sm text-muted">{labels.always}</span>)}
          {row(
            "analytics",
            measurementAvailable ? (
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" role="switch" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-5 w-5 accent-[var(--color-ink)]" aria-describedby={`${id}-a`} />
                  <span id={`${id}-a`}>{analytics ? labels.on : labels.off}</span>
                </label>
              ) : (
                <span className="text-sm text-muted">{labels.notUsed}</span>
              ),
          )}
          {row("marketing", <span className="text-sm text-muted">{labels.notUsed}</span>)}
        </ul>
        <p className="mt-2 text-sm">
          <Link href={cookiePolicyHref} className="underline underline-offset-4">
            {labels.more}
          </Link>
          {" · "}
          <Link href={privacyHref} className="underline underline-offset-4">
            {labels.privacy}
          </Link>
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={onAcceptAll} className="btn btn-outline min-h-11 px-4 py-2">
            {labels.accept}
          </button>
          <button type="button" onClick={onRejectAll} className="btn btn-outline min-h-11 px-4 py-2">
            {labels.decline}
          </button>
          <button type="button" onClick={() => onSave(analytics)} className="btn btn-primary min-h-11 px-4 py-2">
            {labels.save}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Footer link: opens the preferences on every page (also to withdraw consent). */
export function CookieSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {label}
    </button>
  );
}
