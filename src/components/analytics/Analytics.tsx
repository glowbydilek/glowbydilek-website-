"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

const KEY = "glow-consent-v1";
/** Set when the visitor opens "Cookie settings" again (shows the question until a new choice). */
let reopened = false;
type Choice = "granted" | "denied";
type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; glowTrack?: (n: string, p: Record<string, string>) => void };

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("glow:consent", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("glow:consent", cb);
  };
}

function readChoice(): Choice | null {
  try {
    if (reopened) return null;
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * GA4 with consent. Nothing is loaded or stored until the visitor accepts.
 * Advertising features are always off (Consent Mode: ad_* denied), IP
 * addresses are not stored by GA4, and only whitelisted, non-personal
 * events are sent (see lib/analytics/track.ts).
 */
export function Analytics({
  measurementId,
  locale,
  labels,
  privacyHref,
  bookingPaths,
}: {
  measurementId: string | null;
  locale: "nl" | "en";
  labels: { title: string; body: string; accept: string; decline: string; more: string };
  privacyHref: string;
  bookingPaths: string[];
}) {
  const pathname = usePathname();
  const choice = useSyncExternalStore<Choice | null | "unknown">(subscribe, readChoice, () => "unknown");
  const loaded = useRef(false);

  // Load GA4 only after consent.
  useEffect(() => {
    if (!measurementId || choice !== "granted" || loaded.current) return;
    loaded.current = true;
    const w = window as W;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    w.gtag("js", new Date());
    w.gtag("config", measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(s);
    w.glowTrack = (n, p) => w.gtag?.("event", n, { ...p, locale });
  }, [measurementId, choice, locale]);

  // Page views (path only, never query strings: they could carry invitation tokens).
  useEffect(() => {
    if (!measurementId || choice !== "granted") return;
    const w = window as W;
    w.gtag?.("event", "page_view", { page_path: pathname, page_location: `${window.location.origin}${pathname}`, page_title: document.title });
  }, [pathname, measurementId, choice]);

  // Booking CTA clicks anywhere on the site.
  useEffect(() => {
    if (!measurementId || choice !== "granted") return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && bookingPaths.includes(url.pathname)) (window as W).glowTrack?.("cta_booking_click", { source: pathname.slice(0, 80) });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [measurementId, choice, pathname, bookingPaths]);

  if (!measurementId || choice !== null) return null;
  const decide = (c: Choice) => {
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      /* private mode: ask again next time */
    }
    reopened = false;
    if (c === "denied" && loaded.current) window.location.reload();
    window.dispatchEvent(new Event("glow:consent"));
  };
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)] sm:bottom-5">
      <p id="consent-title" className="font-serif text-xl text-ink">
        {labels.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {labels.body}{" "}
        <Link href={privacyHref} className="underline underline-offset-4">
          {labels.more}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => decide("granted")} className="btn btn-primary min-h-11 flex-1 px-5 py-2">
          {labels.accept}
        </button>
        <button type="button" onClick={() => decide("denied")} className="btn btn-outline min-h-11 flex-1 px-5 py-2">
          {labels.decline}
        </button>
      </div>
    </div>
  );
}

/** Footer link to reopen the choice. */
export function CookieSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        reopened = true;
        window.dispatchEvent(new Event("glow:consent"));
      }}
    >
      {label}
    </button>
  );
}
