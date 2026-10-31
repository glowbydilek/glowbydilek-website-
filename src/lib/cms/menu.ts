/**
 * Menu configuration (pure). Only existing public pages can be linked, so a
 * menu edit can never create a broken link or expose /admin or /ajanda.
 */
import type { RouteKey } from "../../i18n/config";

export const MENU_CHOICES: RouteKey[] = ["treatments", "prices", "about", "contact", "booking", "faq", "process", "preparation", "aftercare", "privacy"];

export type MenuConfig = { header: RouteKey[]; footerStudio: RouteKey[]; footerInfo: RouteKey[] };

export const DEFAULT_MENU: MenuConfig = {
  header: ["treatments", "prices", "about", "contact"],
  footerStudio: ["about", "prices", "booking", "contact"],
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
