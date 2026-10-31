/**
 * Central business details.
 *
 * Any field left `undefined` is hidden on the website and omitted from
 * structured data, so nothing unconfirmed is ever shown to visitors or
 * search engines.
 *
 * Location: treatments currently take place by appointment from a
 * home-based setting. The address is shared personally after an appointment
 * is confirmed and is deliberately NOT published. Add `address` only when a
 * public studio address exists.
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
    /** International format without "+", e.g. "31612345678" */
    whatsapp?: string;
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
    whatsapp: undefined,
    instagram: undefined,
    address: undefined,
    region: undefined,
  },
};

export function mailto(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  // URLSearchParams encodes spaces as "+", which some mail apps show literally.
  return `mailto:${siteConfig.contact.email}?${params.toString().replace(/\+/g, "%20")}`;
}
