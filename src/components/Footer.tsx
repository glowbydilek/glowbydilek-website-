import Link from "next/link";
import { mailto, siteConfig, whatsappLink } from "@/content/site";
import { href, type Locale } from "@/i18n/config";
import { override } from "@/lib/cms/current";
import { validateBusiness } from "@/lib/cms/menu";
import type { Dictionary } from "@/i18n/dictionaries";
import { Logo } from "./brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { NavModel } from "./navModel";
import { Icon } from "./ui/Icon";


/** Compact charcoal footer with grouped navigation and subtle gold accents. */
export function Footer({ locale, dict, nav }: { locale: Locale; dict: Dictionary; nav: NavModel }) {
  const year = new Date().getFullYear();
  const wa = whatsappLink(dict.whatsapp.message);
  const biz = validateBusiness(override("business", "all")).value;
  const linkCls = "inline-flex min-h-9 items-center text-ivory/75 transition-colors hover:text-gold-light sm:min-h-0 sm:py-1";
  const heading = "text-[0.66rem] font-medium uppercase tracking-[0.24em] text-gold";

  return (
    <footer className="on-dark bg-charcoal text-ivory">
      <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-12">
        {/* Brand row */}
        <div className="flex flex-col gap-6 border-b border-ivory/10 py-10 md:flex-row md:items-center md:justify-between lg:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <Link href={href(locale, "home")} aria-label={`Glow by Dilek — ${dict.nav.home}`} className="shrink-0">
              <Logo tone="dark" className="h-14 w-auto" />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-ivory/70">{dict.footer.tagline}</p>
          </div>
          <Link
            href={href(locale, "booking")}
            className="group inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full bg-gold px-7 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-charcoal transition-colors hover:bg-gold-light md:self-auto"
          >
            {dict.cta.request}
            <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Link groups */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 lg:py-12">
          <div>
            <p className={heading}>{dict.footer.treatments}</p>
            <ul className="mt-3">
              {nav.categories.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className={linkCls}>
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={href(locale, "treatments")} className={linkCls}>
                  {dict.nav.allTreatments}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={heading}>{dict.footer.studio}</p>
            <ul className="mt-3">
              {nav.studio.map((l) => (
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
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className={heading}>{dict.footer.contact}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a href={mailto(dict.forms.topics.question)} className="inline-flex min-h-9 items-center gap-2 text-ivory hover:text-gold-light sm:min-h-0">
                  <Icon name="mail" className="h-4 w-4 shrink-0 text-gold" />
                  {siteConfig.contact.email}
                </a>
              </li>
              {biz.phone && (
                <li>
                  <a href={`tel:${biz.phone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-9 items-center gap-2 text-ivory hover:text-gold-light sm:min-h-0">
                    {biz.phone}
                  </a>
                </li>
              )}
              {biz.instagram && (
                <li>
                  <a href={`https://www.instagram.com/${biz.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-ivory hover:text-gold-light sm:min-h-0">
                    Instagram · @{biz.instagram}
                  </a>
                </li>
              )}
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-ivory hover:text-gold-light">
                    <Icon name="whatsapp" className="h-4 w-4 text-gold" />
                    {dict.whatsapp.short}
                  </a>
                </li>
              )}
              <li className="text-sm leading-relaxed text-ivory/60">{dict.common.location}</li>
            </ul>
          </div>
        </div>

        {/* Legal bar */}
        <div className="flex flex-col gap-3 border-t border-ivory/10 py-5 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href={href(locale, "privacy")} className="hover:text-gold-light">
              {dict.nav.privacy}
            </Link>
            <span>{dict.footer.note}</span>
            <LanguageSwitcher locale={locale} label={dict.nav.languageFooter} tone="dark" className="-my-2" />
          </div>
        </div>
      </div>
    </footer>
  );
}
