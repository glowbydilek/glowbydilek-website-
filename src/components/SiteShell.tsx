import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ensureContent } from "@/lib/cms/store";
import { businessJsonLd } from "@/lib/seo";
import { override } from "@/lib/cms/current";
import { themeCss, validateTheme } from "@/lib/cms/theme";
import { PreviewBanner } from "./PreviewBanner";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { JsonLd } from "./JsonLd";
import { Motion } from "./Motion";
import { navModel } from "./navModel";
import { WhatsAppButton } from "./WhatsAppButton";

/** Shared <html>/<body> shell used by the Dutch and English root layouts. */
export async function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const snap = await ensureContent();
  const dict = getDictionary(locale);
  // Owner theme (validated tokens only; never free CSS).
  const themeOverride = override("theme", "all");
  const css = themeOverride ? themeCss(validateTheme(themeOverride).theme) : "";
  const nav = navModel(locale);
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        {css && <style id="glow-theme" dangerouslySetInnerHTML={{ __html: css }} />}
        {snap.preview && <PreviewBanner />}
        <Header locale={locale} dict={dict} nav={nav} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} dict={dict} nav={nav} />
        <WhatsAppButton dict={dict} />
        <Motion />
        <JsonLd data={businessJsonLd(locale)} />
      </body>
    </html>
  );
}
