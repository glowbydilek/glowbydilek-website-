/**
 * Central business details.
 *
 * Any field left `undefined` is hidden on the website and omitted from
 * structured data, so nothing unconfirmed is ever shown.
 *
 * Location policy: treatments are by appointment only. No address, city,
 * district, service area or map is published anywhere (pages, metadata,
 * structured data, emails). Practical location details are shared
 * personally after an appointment is confirmed. Keep `address` and `region`
 * undefined unless the owner explicitly decides otherwise.
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
    /** Confirmed city/region for local SEO, e.g. "Rotterdam". */
    region?: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "Glow by Dilek",
  owner: "Dilek",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://glowbydilek.nl").replace(/\/+$/, ""),
  country: "NL",
  contact: {
    email: "hello@glowbydilek.nl",
    phone: undefined,
    instagram: undefined,
    address: undefined,
    region: undefined,
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
const whatsappNumberFallback = "";

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
