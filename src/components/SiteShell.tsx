import type { ReactNode } from "react";
import { fontVariables } from "@/app/fonts";
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
import { Analytics } from "./analytics/Analytics";
import { GlowTransition } from "./GlowTransition";
import { validateAnalytics } from "@/lib/cms/menu";
import { href, routes } from "@/i18n/config";

/** Shared <html>/<body> shell used by the Dutch and English root layouts. */
export async function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const snap = await ensureContent();
  const dict = getDictionary(locale);
  // Owner theme (validated tokens only; never free CSS).
  const themeOverride = override("theme", "all");
  const css = themeOverride ? themeCss(validateTheme(themeOverride).theme) : "";
  const nav = navModel(locale);
  const analytics = validateAnalytics(override("analytics", "all")).value;
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={fontVariables}>
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
        <GlowTransition />
        <Analytics
          measurementId={analytics.enabled ? analytics.measurementId : null}
          locale={locale}
          labels={{ title: dict.consent.title, body: dict.consent.body, accept: dict.consent.accept, decline: dict.consent.decline, more: dict.consent.more }}
          privacyHref={href(locale, "privacy")}
          bookingPaths={[routes.booking.nl, routes.booking.en]}
        />
        <JsonLd data={businessJsonLd(locale)} />
      </body>
    </html>
  );
}
