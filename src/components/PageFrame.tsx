import type { ReactNode } from "react";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { breadcrumbJsonLd, staticPageMeta, type Crumb } from "@/lib/seo";
import { ensureContent } from "@/lib/cms/store";
import { JsonLd } from "./JsonLd";

/** Wraps a page with its breadcrumb structured data. */
export async function PageFrame({
  locale,
  route,
  crumbs,
  children,
}: {
  locale: Locale;
  route?: RouteKey;
  /** Explicit trail (after Home) for nested pages. */
  crumbs?: Crumb[];
  children: ReactNode;
}) {
  await ensureContent();
  const dict = getDictionary(locale);
  const trail: Crumb[] | null =
    crumbs ?? (route && route !== "home" ? [{ name: navLabel(locale, route), path: href(locale, route) }] : null);
  return (
    <>
      {children}
      {trail && <JsonLd data={breadcrumbJsonLd([{ name: dict.nav.home, path: href(locale, "home") }, ...trail])} />}
    </>
  );
}

function navLabel(locale: Locale, key: RouteKey): string {
  const nav = getDictionary(locale).nav as Record<string, string>;
  return nav[key] ?? staticPageMeta(locale, key).title;
}
