"use client";

import { useEffect } from "react";
import { refreshSubscription } from "./NotificationSetup";

/**
 * Keeps the app-icon badge equal to the server's count of open actions while
 * the Agenda is open (pushes keep it right while the app is closed). Also
 * re-registers this device's push subscription, so a renewed subscription is
 * never lost. Renders nothing.
 */
export function BadgeSync({ initial }: { initial: number }) {
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    const apply = (n: number) => {
      if (!nav.setAppBadge) return;
      (n > 0 ? nav.setAppBadge(n) : nav.clearAppBadge!()).catch(() => {});
    };
    apply(initial);
    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await fetch("/api/agenda/meldingen", { cache: "no-store" })
        .then((x) => (x.ok ? x.json() : null))
        .catch(() => null);
      if (r?.ok) apply(r.pending);
    };
    refreshSubscription().catch(() => {});
    const t = setInterval(sync, 60_000);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("online", sync);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("online", sync);
    };
  }, [initial]);
  return null;
}
