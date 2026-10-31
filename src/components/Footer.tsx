import Link from "next/link";
import { mailto, siteConfig, whatsappLink } from "@/content/site";
import { treatmentGroups } from "@/content/treatments";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Logo } from "./brand/Logo";
import { Icon } from "./ui/Icon";

const studioNav: RouteKey[] = ["about", "prices", "booking", "contact", "privacy"];

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  const wa = whatsappLink(dict.whatsapp.message);
  const linkCls = "link-underline text-ivory/75 transition-colors hover:text-ivory";
  return (
    <footer className="on-dark relative overflow-hidden bg-forest-deep text-ivory">
      <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 border-b border-ivory/10 py-16 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] lg:py-20">
          <div>
            <Logo tone="light" className="h-12 w-auto" />
            <p className="mt-7 max-w-sm leading-relaxed text-ivory/70">{dict.footer.tagline}</p>
            <p className="mt-6 flex items-center gap-3 text-sm text-sage-light">
              <Icon name="leaf" className="h-4 w-4 text-gold" />
              {dict.footer.newsletterless}
            </p>
          </div>

          <div>
            <p className="eyebrow">{dict.footer.treatments}</p>
            <ul className="mt-6 space-y-3">
              {treatmentGroups.map((g) => (
                <li key={g.id}>
                  <Link href={`${href(locale, "treatments")}#${g.id}`} className={linkCls}>
                    {g.name[locale]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={href(locale, "treatments")} className={linkCls}>
                  {dict.nav.treatments}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">{dict.footer.studio}</p>
            <ul className="mt-6 space-y-3">
              {studioNav.map((key) => (
                <li key={key}>
                  <Link href={href(locale, key)} className={linkCls}>
                    {dict.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">{dict.footer.contact}</p>
            <ul className="mt-6 space-y-4">
              <li>
                <a href={mailto(dict.forms.topics.question)} className="flex items-center gap-3 text-ivory hover:text-gold-light">
                  <Icon name="mail" className="h-4 w-4 text-gold" />
                  {siteConfig.contact.email}
                </a>
              </li>
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ivory hover:text-gold-light">
                    <Icon name="whatsapp" className="h-4 w-4 text-gold" />
                    {dict.whatsapp.short}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3 text-sm leading-relaxed text-ivory/70">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {dict.common.location}
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 py-6 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <p className="uppercase tracking-[0.24em]">{dict.meta.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
