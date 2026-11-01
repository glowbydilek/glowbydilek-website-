/**
 * Menu configuration (pure). Only existing public pages can be linked, so a
 * menu edit can never create a broken link or expose /admin or /agenda.
 */
import type { RouteKey } from "../../i18n/config";

export const MENU_CHOICES: RouteKey[] = ["treatments", "prices", "about", "reviews", "contact", "booking", "faq", "process", "preparation", "aftercare", "privacy"];

export type MenuConfig = { header: RouteKey[]; footerStudio: RouteKey[]; footerInfo: RouteKey[] };

export const DEFAULT_MENU: MenuConfig = {
  header: ["treatments", "prices", "about", "faq", "contact"],
  footerStudio: ["about", "prices", "reviews", "booking", "contact"],
  footerInfo: ["process", "preparation", "aftercare", "faq"],
};

export function validateMenu(input: unknown): MenuConfig {
  const v = (input ?? {}) as Partial<Record<keyof MenuConfig, unknown>>;
  const list = (x: unknown, def: RouteKey[], max: number) => {
    if (!Array.isArray(x)) return def;
    const out = [...new Set(x.filter((k): k is RouteKey => MENU_CHOICES.includes(k as RouteKey)))].slice(0, max);
    return out;
  };
  const header = list(v.header, DEFAULT_MENU.header, 6);
  // The treatments menu is the entry to all service pages: keep it.
  if (!header.includes("treatments")) header.unshift("treatments");
  return { header, footerStudio: list(v.footerStudio, DEFAULT_MENU.footerStudio, 8), footerInfo: list(v.footerInfo, DEFAULT_MENU.footerInfo, 8) };
}

export type Business = { phone: string; instagram: string };

export function validateBusiness(input: unknown): { value: Business; errors: string[] } {
  const v = (input ?? {}) as Partial<Business>;
  const errors: string[] = [];
  const phone = String(v.phone ?? "").trim();
  const instagram = String(v.instagram ?? "").trim().replace(/^@/, "");
  if (phone && !/^\+?[0-9][0-9 ()-]{6,18}$/.test(phone)) errors.push("Controleer het telefoonnummer (bijv. +31 6 12345678).");
  if (instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) errors.push("Vul alleen de Instagram-gebruikersnaam in (zonder link).");
  return { value: { phone, instagram }, errors };
}

// ──────────────────────────────────────────────────────── Social media

export const SOCIAL_NETWORKS = {
  instagram: { label: "Instagram", hosts: ["instagram.com", "www.instagram.com"] },
  facebook: { label: "Facebook", hosts: ["facebook.com", "www.facebook.com", "m.facebook.com"] },
  tiktok: { label: "TikTok", hosts: ["tiktok.com", "www.tiktok.com"] },
} as const;
export type SocialNetwork = keyof typeof SOCIAL_NETWORKS;
export type SocialLink = { network: SocialNetwork; url: string; enabled: boolean };
export type Social = { links: SocialLink[] };

/** No profile is assumed: every link is empty until the owner enters a real one. */
export const DEFAULT_SOCIAL: Social = {
  links: (Object.keys(SOCIAL_NETWORKS) as SocialNetwork[]).map((network) => ({ network, url: "", enabled: false })),
};

/** Only https links to the network's own domain; order is the owner's order. */
export function validateSocial(input: unknown): { value: Social; errors: string[] } {
  const raw = Array.isArray((input as Social | null)?.links) ? (input as Social).links : [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const links: SocialLink[] = [];
  for (const l of raw) {
    const network = String(l?.network ?? "") as SocialNetwork;
    if (!(network in SOCIAL_NETWORKS) || seen.has(network)) continue;
    seen.add(network);
    const url = String(l?.url ?? "").trim();
    let ok = !url;
    if (url) {
      try {
        const u = new URL(url);
        ok = u.protocol === "https:" && (SOCIAL_NETWORKS[network].hosts as readonly string[]).includes(u.hostname) && u.pathname.length > 1 && !u.username && !u.password;
      } catch {
        ok = false;
      }
    }
    if (!ok) errors.push(`${SOCIAL_NETWORKS[network].label}: gebruik de volledige link naar je profiel, bijv. https://www.${SOCIAL_NETWORKS[network].hosts[0]}/jouwnaam`);
    links.push({ network, url: ok ? url : "", enabled: Boolean(l?.enabled) && ok && Boolean(url) });
  }
  for (const n of Object.keys(SOCIAL_NETWORKS) as SocialNetwork[]) if (!seen.has(n)) links.push({ network: n, url: "", enabled: false });
  return { value: { links }, errors };
}

/** Links that may be shown publicly. */
export function publicSocial(input: unknown): SocialLink[] {
  return validateSocial(input ?? DEFAULT_SOCIAL).value.links.filter((l) => l.enabled && l.url);
}

// ──────────────────────────────────────────────────────── Analytics (GA4)

export type Analytics = { measurementId: string; enabled: boolean };
export const DEFAULT_ANALYTICS: Analytics = { measurementId: "", enabled: false };

/** GA4 Measurement ID ("G-…"); tracking only when enabled AND the visitor consents. */
export function validateAnalytics(input: unknown): { value: Analytics; errors: string[] } {
  const v = (input ?? {}) as Partial<Analytics>;
  const id = String(v.measurementId ?? "").trim().toUpperCase();
  const errors: string[] = [];
  if (id && !/^G-[A-Z0-9]{6,12}$/.test(id)) errors.push("De Measurement ID ziet eruit als G-XXXXXXXXXX (te vinden in Google Analytics → Beheer → Gegevensstreams).");
  const ok = !id || errors.length === 0;
  return { value: { measurementId: ok ? id : "", enabled: Boolean(v.enabled) && ok && Boolean(id) }, errors };
}
