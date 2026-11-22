"use client";

import { useState, type ReactNode } from "react";

/**
 * Anti-harvesting email link. The full address is never in the HTML or the
 * page data: it is shown as "hello [at] glowbydilek.nl" (readable for
 * people, so the legally required contact address stays visible) and
 * assembled only when a visitor taps it, which opens the mail app.
 * This stops simple address scrapers; it cannot stop every bot.
 */
const USER = "hello";
const DOMAIN = ["glowbydilek", "nl"];

export const EMAIL_DISPLAY = `${USER} [at] ${DOMAIN.join(".")}`;

export function ProtectedEmail({ subject, className, children }: { subject?: string; className?: string; children?: ReactNode }) {
  const [shown, setShown] = useState(false);
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
