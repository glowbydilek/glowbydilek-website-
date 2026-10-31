/**
 * Central business details.
 *
 * Fill in the contact fields below once they are final. Any field left as
 * `undefined` is simply hidden on the website (and omitted from structured
 * data), so nothing incorrect is ever shown to visitors or search engines.
 */
export type SiteConfig = {
  name: string;
  owner: string;
  url: string;
  country: string;
  contact: {
    email?: string;
    /** International format, e.g. "+31612345678" */
    phone?: string;
    /** International format without "+", e.g. "31612345678" */
    whatsapp?: string;
    instagram?: string;
    address?: {
      street: string;
      postalCode: string;
      city: string;
    };
    /** City or region shown when no full address is published yet. */
    region?: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "Glow by Dilek",
  owner: "Dilek",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.glowbydilek.nl").replace(/\/+$/, ""),
  country: "NL",
  contact: {
    email: undefined,
    phone: undefined,
    whatsapp: undefined,
    instagram: undefined,
    address: undefined,
    region: undefined,
  },
};

export function hasAnyContactChannel(): boolean {
  const c = siteConfig.contact;
  return Boolean(c.email || c.phone || c.whatsapp || c.instagram);
}
