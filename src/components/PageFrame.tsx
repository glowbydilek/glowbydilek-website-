import type { ReactNode } from "react";
import type { Locale, RouteKey } from "@/i18n/config";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

/** Wraps an inner page with its breadcrumb structured data. */
export function PageFrame({ locale, route, children }: { locale: Locale; route: RouteKey; children: ReactNode }) {
  return (
    <>
      {children}
      {route !== "home" && <JsonLd data={breadcrumbJsonLd(locale, route)} />}
    </>
  );
}
