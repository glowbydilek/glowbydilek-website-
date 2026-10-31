import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { businessJsonLd } from "@/lib/seo";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { JsonLd } from "./JsonLd";
import { Motion } from "./Motion";
import { navModel } from "./navModel";
import { WhatsAppButton } from "./WhatsAppButton";

/** Shared <html>/<body> shell used by the Dutch and English root layouts. */
export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale);
  const nav = navModel(locale);
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
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
