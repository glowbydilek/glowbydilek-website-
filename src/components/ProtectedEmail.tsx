"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Anti-harvesting email link. The full address is never in the HTML or the
 * page data: the server renders "hello [at] glowbydilek.nl"; in the visitor's
 * browser it is assembled right after loading, so people see the normal
 * address with "@". Tapping it opens the mail app.
 * This stops simple address scrapers; it cannot stop every bot.
 */
const USER = "hello";
const DOMAIN = ["glowbydilek", "nl"];

export const EMAIL_DISPLAY = `${USER} [at] ${DOMAIN.join(".")}`;

export function ProtectedEmail({ subject, className, children }: { subject?: string; className?: string; children?: ReactNode }) {
  const [shown, setShown] = useState(false);
  // Show the real address once the page runs in a browser (not in the static HTML).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time switch after hydration
  useEffect(() => setShown(true), []);
  const address = () => `${USER}${String.fromCharCode(64)}${DOMAIN.join(".")}`;
  const open = () => {
    setShown(true);
    const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
    window.location.href = `mailto:${address()}${q}`;
  };
  return (
    <button type="button" onClick={open} className={className}>
      {children ?? (shown ? address() : EMAIL_DISPLAY)}
    </button>
  );
}
