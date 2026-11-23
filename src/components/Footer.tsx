import Link from "next/link";
import { phoneDisplay, siteConfig, telHref, whatsappLink } from "@/content/site";
import { href, type Locale, pick } from "@/i18n/config";
import { currentSnapshot, override } from "@/lib/cms/current";
import { publicSocial, validateBusiness } from "@/lib/cms/menu";
import type { Dictionary } from "@/i18n/dictionaries";
import { CookieSettingsLink } from "./analytics/Analytics";
import { Glint, LogoStacked } from "./brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { NavModel } from "./navModel";
import { SocialIcons } from "./SocialIcons";
import { Icon } from "./ui/Icon";
import { ProtectedEmail } from "./ProtectedEmail";
import { publishedLegal } from "@/lib/legal";

/** Espresso footer: logo, short promise, grouped navigation, contact, social and legal. */
export function Footer({ locale, dict, nav }: { locale: Locale; dict: Dictionary; nav: NavModel }) {
  const year = new Date().getFullYear();
  const wa = whatsappLink(dict.whatsapp.message);
  const biz = validateBusiness(override("business", "all")).value;
  const social = publicSocial(override("social", "all"));
  const linkCls = "inline-flex min-h-10 max-w-full items-center text-paper/75 transition-colors hover:text-glow sm:min-h-0 sm:py-1";
  const heading = "text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-glow";

  return (
    <footer className="on-dark bg-ink text-paper">
      <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 border-b border-paper/10 py-12 lg:grid-cols-[1.1fr_2fr] lg:gap-16 lg:py-16">
          <div className="flex flex-col items-start gap-6">
            <Link href={href(locale, "home")} aria-label={`Glow by Dilek — ${dict.nav.home}`}>
              <LogoStacked tone="dark" className="h-[4.5rem] w-auto" />
            </Link>
            <p className="max-w-sm text-[0.95rem] leading-relaxed text-paper/75">{dict.footer.tagline}</p>
            <Link href={href(locale, "booking")} className="btn btn-primary group">
              {dict.cta.request}
              <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3">
            <div>
              <p className={heading}>{dict.footer.studio}</p>
              <ul className="mt-3">
                {nav.studio.filter((l) => l.key !== "booking").map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={heading}>{dict.footer.info}</p>
              <ul className="mt-3">
                {nav.info.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                {currentSnapshot().marketing?.productsPage && (
                  <li>
                    <Link href={pick(locale, { nl: "/producten", en: "/en/products", tr: "/tr/urunler" })} className={linkCls}>
                      {dict.products.title}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className={heading}>{dict.footer.contact}</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <ProtectedEmail subject={dict.forms.topics.question} className="inline-flex min-h-10 items-center gap-2 break-all text-left text-paper hover:text-glow sm:min-h-0" />
                </li>
                {telHref(biz.phone || undefined) && (
                  <li>
                    <a href={telHref(biz.phone || undefined)!} className="inline-flex min-h-10 items-center text-paper hover:text-glow sm:min-h-0">
                      {phoneDisplay(biz.phone || undefined)}
                    </a>
                  </li>
                )}
                {wa && (
                  <li>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-paper hover:text-glow sm:min-h-0">
                      <Icon name="whatsapp" className="h-4 w-4 text-glow" />
                      {dict.whatsapp.short}
                    </a>
                  </li>
                )}
                <li className="text-sm leading-relaxed text-paper/65">{dict.common.location}</li>
              </ul>
              <SocialIcons links={social} label={dict.footer.follow} className="-ml-3 mt-4" />
            </div>
          </div>
        </div>

        {/* Treatment categories: one compact row (each category page lists its treatments) */}
        <nav aria-label={dict.footer.treatments} className="border-b border-paper/10 py-8">
          <p className={heading}>{dict.footer.treatments}</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {nav.categories.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className={linkCls}>
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={nav.allHref} className="inline-flex min-h-10 items-center gap-1.5 text-glow hover:text-paper sm:min-h-0 sm:py-1">
                {dict.nav.allTreatments}
                <Icon name="arrow" className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-3 py-6 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <Glint className="h-3 w-auto text-glow" />© {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href={href(locale, "privacy")} className="inline-flex min-h-10 items-center hover:text-glow sm:min-h-0">
              {dict.nav.privacy}
            </Link>
            {publishedLegal(locale).map((l) => (
              <Link key={l.key} href={l.href} className="inline-flex min-h-10 items-center hover:text-glow sm:min-h-0">
                {l.label}
              </Link>
            ))}
            <CookieSettingsLink label={dict.consent.settings} className="inline-flex min-h-10 items-center hover:text-glow sm:min-h-0" />
            <LanguageSwitcher locale={locale} label={dict.nav.languageFooter} tone="dark" placement="up" />
          </div>
        </div>
      </div>
    </footer>
  );
}
