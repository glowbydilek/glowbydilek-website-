import type { Locale, RouteKey } from "@/i18n/config";

/**
 * Service architecture.
 *
 * Glow by Dilek starts with waxing, and is built to grow into other beauty
 * services. Every service category lives here. A category only appears on
 * the website (navigation, pages, sitemap, structured data) when
 * `published` is true.
 *
 * RULE: only set `published: true` once the owner has confirmed that the
 * service is actually available, including the required qualifications,
 * equipment, insurance and final pricing. Planned categories must never be
 * advertised as available.
 *
 * To launch a new category later:
 *   1. Fill in its texts and treatments below and set `published: true`.
 *   2. Add a route key + localised slugs in src/i18n/config.ts.
 *   3. Add two thin page files (nl + en) that render <ServiceCategoryPage>.
 * The header, footer, treatment overview, prices page, sitemap and
 * structured data pick it up automatically.
 */
type Localised = Record<Locale, string>;

export type ServiceCategoryId = "waxing" | "laser" | "skin" | "beauty";

export type ServiceCategory = {
  id: ServiceCategoryId;
  /** Only published categories are visible anywhere on the site. */
  published: boolean;
  status: "available" | "planned";
  route?: RouteKey;
  name: Localised;
  shortDescription: Localised;
};

export const serviceCategories: ServiceCategory[] = [
  {
    id: "waxing",
    published: true,
    status: "available",
    route: "treatments",
    name: { nl: "Waxing", en: "Waxing" },
    shortDescription: {
      nl: "Professionele waxbehandelingen voor gezicht, lichaam en bikinizone.",
      en: "Professional waxing for face, body and bikini area.",
    },
  },
  // ---- Planned — NOT published. Do not enable without owner confirmation. ----
  {
    id: "laser",
    published: false,
    status: "planned",
    name: { nl: "Laserontharing", en: "Laser hair removal" },
    shortDescription: { nl: "", en: "" },
  },
  {
    id: "skin",
    published: false,
    status: "planned",
    name: { nl: "Huid- en gezichtsverzorging", en: "Skin and facial care" },
    shortDescription: { nl: "", en: "" },
  },
  {
    id: "beauty",
    published: false,
    status: "planned",
    name: { nl: "Beautybehandelingen", en: "Beauty treatments" },
    shortDescription: { nl: "", en: "" },
  },
];

export function publishedCategories(): ServiceCategory[] {
  return serviceCategories.filter((c) => c.published);
}
