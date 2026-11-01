/**
 * Legal pages: routes, publication status and copy (pure module).
 * Status lives in the content document "legal-status" (all languages);
 * by default only the factual cookie policy is online.
 */
import type { Locale } from "@/i18n/config";
import { legalEn } from "@/content/copy/legal.en";
import { legalNl, type LegalDoc, type LegalKey } from "@/content/copy/legal.nl";
import { override } from "./cms/current";
import { mergeContent } from "./cms/registry";

export const LEGAL_KEYS: LegalKey[] = ["cookies", "terms", "cancellation", "reviews"];
export const LEGAL_PATHS: Record<LegalKey, Record<Locale, string>> = {
  cookies: { nl: "/cookiebeleid", en: "/en/cookie-policy" },
  terms: { nl: "/algemene-voorwaarden", en: "/en/terms" },
  cancellation: { nl: "/annuleringsbeleid", en: "/en/cancellation-policy" },
  reviews: { nl: "/beoordelingsbeleid", en: "/en/review-policy" },
};
export const LEGAL_LABELS: Record<LegalKey, string> = { cookies: "Cookiebeleid", terms: "Algemene voorwaarden", cancellation: "Annuleringsbeleid", reviews: "Beoordelingsbeleid" };
export const DEFAULT_LEGAL_STATUS: Record<LegalKey, boolean> = { cookies: true, terms: false, cancellation: false, reviews: false };

export const PLACEHOLDER = /\[INVULLEN/i;

export function legalStatus(): Record<LegalKey, boolean> {
  const o = override("legal-status", "all");
  const v = o && typeof o === "object" ? (o as Partial<Record<LegalKey, unknown>>) : {};
  return Object.fromEntries(LEGAL_KEYS.map((k) => [k, typeof v[k] === "boolean" ? v[k] : DEFAULT_LEGAL_STATUS[k]])) as Record<LegalKey, boolean>;
}

export function legalDoc(locale: Locale, key: LegalKey): LegalDoc {
  const def = (locale === "en" ? legalEn : legalNl)[key];
  const o = override(`legal:${key}`, locale);
  return o === undefined ? def : mergeContent(def, o);
}

/** Texts that still contain an [INVULLEN …] marker may not be published. */
export function hasPlaceholder(doc: LegalDoc): boolean {
  return PLACEHOLDER.test(JSON.stringify(doc));
}

/** Online = switched on by the owner AND free of [INVULLEN …] markers in this language. */
export function isLegalOnline(locale: Locale, key: LegalKey): boolean {
  return legalStatus()[key] && !hasPlaceholder(legalDoc(locale, key));
}

export function publishedLegal(locale: Locale): { key: LegalKey; href: string; label: string }[] {
  return LEGAL_KEYS.filter((k) => isLegalOnline(locale, k)).map((k) => ({ key: k, href: LEGAL_PATHS[k][locale], label: legalDoc(locale, k).title }));
}
