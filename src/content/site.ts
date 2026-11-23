/**
 * Central business details.
 *
 * Any field left `undefined` is hidden on the website and omitted from
 * structured data, so nothing unconfirmed is ever shown.
 *
 * Location policy (owner decision, 4 Nov 2026): the salon is in Amsterdam and
 * the city may be named publicly. The street address stays private — it is
 * shared personally after an appointment is confirmed — so `address` stays
 * undefined. `welcomesFrom` lists places clients come from (owner-provided);
 * it is used in natural copy and structured data, never for separate
 * city landing pages.
 */
export type SiteConfig = {
  name: string;
  owner: string;
  url: string;
  country: string;
  contact: {
    email: string;
    /** International format, e.g. "+31612345678" */
    phone?: string;
    instagram?: string;
    address?: { street: string; postalCode: string; city: string };
    /** Confirmed city for local SEO. */
    region?: string;
    /** Places clients come from (owner-confirmed). */
    welcomesFrom?: string[];
  };
};

export const siteConfig: SiteConfig = {
  name: "Glow by Dilek",
  owner: "Dilek",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://glowbydilek.nl").replace(/\/+$/, ""),
  country: "NL",
  contact: {
    email: "hello@glowbydilek.nl",
    // Owner-provided business number (22 Nov 2026).
    phone: "+31 20 550 0400",
    instagram: undefined,
    address: undefined,
    region: "Amsterdam",
    welcomesFrom: ["Amsterdam", "Amstelveen", "Diemen", "Haarlem", "Hoofddorp", "Zaandam", "Zaanstad"],
  },
};

/**
 * WhatsApp — ONE setting activates the button site-wide.
 *
 * Set `NEXT_PUBLIC_WHATSAPP_NUMBER` in Hostinger (international format,
 * digits only, no "+" or leading zeros, e.g. 31612345678) and rebuild — or
 * put the number in `whatsappNumberFallback` below. While no valid number is
 * configured, the WhatsApp button is not rendered at all.
 */
// Owner confirmed (23 Nov 2026): 020 550 0400 is the business number and WhatsApp.
const whatsappNumberFallback = "31205500400";

export function whatsappNumber(): string | null {
  const raw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || whatsappNumberFallback).replace(/[\s+()-]/g, "");
  // E.164 without "+": country code (no leading 0) + subscriber number, 8–15 digits.
  return /^[1-9]\d{7,14}$/.test(raw) ? raw : null;
}

export function whatsappLink(message: string): string | null {
  const n = whatsappNumber();
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
}

export function mailto(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${siteConfig.contact.email}?${params.toString().replace(/\+/g, "%20")}`;
}

/** The business phone in Dutch notation for display (020 550 0400) and as a tel: link. */
export function phoneDisplay(international?: string): string | null {
  const p = (international ?? siteConfig.contact.phone ?? "").trim();
  if (!p) return null;
  const digits = p.replace(/[^\d]/g, "");
  if (digits.startsWith("3120") && digits.length === 11) return `020 ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return p;
}
export function telHref(international?: string): string | null {
  const p = (international ?? siteConfig.contact.phone ?? "").trim();
  return p ? `tel:${p.replace(/[^+\d]/g, "")}` : null;
}

/** Human-readable, scraper-resistant form of the public address (see ProtectedEmail). */
export const emailDisplay = "hello@glowbydilek.nl";
