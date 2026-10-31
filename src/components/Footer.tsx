import Link from "next/link";
import { publishedCategories } from "@/content/services";
import { mailto, siteConfig } from "@/content/site";
import { treatmentGroups } from "@/content/treatments";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Logo } from "./brand/Logo";
import { Icon } from "./ui/Icon";

const studioNav: RouteKey[] = ["home", "about", "prices", "contact", "booking"];

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  const linkCls = "text-ivory/70 transition-colors hover:text-champagne-light";
  return (
    <footer className="on-dark bg-espresso text-ivory">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pb-12 pt-20 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-12">
        <div>
          <Logo tone="light" className="h-12 w-auto" />
          <p className="mt-7 max-w-xs leading-relaxed text-ivory/65">{dict.footer.tagline}</p>
        </div>

        <div>
          <p className="eyebrow">{dict.footer.treatments}</p>
          <ul className="mt-6 space-y-3">
            {publishedCategories().map((cat) =>
              cat.route ? (
                <li key={cat.id}>
                  <Link href={href(locale, cat.route)} className={linkCls}>
                    {cat.name[locale]}
                  </Link>
                </li>
              ) : null,
            )}
            {treatmentGroups.map((g) => (
              <li key={g.id}>
                <Link href={`${href(locale, "treatments")}#${g.id}`} className={linkCls}>
                  {g.name[locale]}
                </Link>
              </li>
            ))}
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
          <ul className="mt-6 space-y-4 text-ivory/70">
            <li>
              <a href={mailto(dict.contact.email.subject)} className="flex items-center gap-3 text-ivory hover:text-champagne-light">
                <Icon name="mail" className="h-4 w-4 text-champagne" />
                {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="pin" className="mt-1 h-4 w-4 shrink-0 text-champagne" />
              <span className="text-sm leading-relaxed">{dict.common.location}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>
            © {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <p className="tracking-[0.2em] uppercase">{dict.meta.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
