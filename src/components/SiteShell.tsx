import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { businessJsonLd } from "@/lib/seo";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { JsonLd } from "./JsonLd";

/** Shared <html>/<body> shell used by the Dutch and English root layouts. */
export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale);
  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col">
        <Header locale={locale} dict={dict} />
        <main id="main" className="-mt-20 flex-1">
          {children}
        </main>
        <Footer locale={locale} dict={dict} />
        <JsonLd data={businessJsonLd(locale)} />
      </body>
    </html>
  );
}
