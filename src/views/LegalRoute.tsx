import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import type { LegalKey } from "@/content/copy/legal.nl";
import type { Locale } from "@/i18n/config";
import { currentSnapshot } from "@/lib/cms/current";
import { ensureContent } from "@/lib/cms/store";
import { isLegalOnline, LEGAL_PATHS, legalDoc } from "@/lib/legal";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "./LegalPage";

/** Route helpers shared by the NL and EN legal page files. */
export function legalRoute(locale: Locale, k: LegalKey) {
  const visible = () => isLegalOnline(locale, k) || currentSnapshot().preview;
  async function generateMetadata(): Promise<Metadata> {
    await ensureContent();
    if (!visible()) return {};
    const d = legalDoc(locale, k);
    return buildMetadata({ locale, paths: LEGAL_PATHS[k], title: d.title, description: d.intro.slice(0, 160), seoKey: `legal-${k}` });
  }
  async function Page() {
    await ensureContent();
    if (!visible()) notFound();
    return (
      <PageFrame locale={locale} crumbs={[{ name: legalDoc(locale, k).title, path: LEGAL_PATHS[k][locale] }]}>
        <LegalPage locale={locale} k={k} />
      </PageFrame>
    );
  }
  return { generateMetadata, Page };
}
