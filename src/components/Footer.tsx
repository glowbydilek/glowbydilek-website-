import Link from "next/link";
import { siteConfig } from "@/content/site";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Monogram } from "./Logo";

const footerNav: RouteKey[] = ["home", "treatments", "prices", "about", "contact", "booking"];

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-charcoal text-ivory/80">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Monogram className="h-11 w-11 text-champagne" />
            <span className="font-serif text-2xl text-ivory">{siteConfig.name}</span>
          </div>
          <p className="mt-6 max-w-sm leading-relaxed text-ivory/70">{dict.footer.tagline}</p>
        </div>

        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-champagne">{dict.footer.navigation}</p>
          <ul className="mt-5 space-y-3">
            {footerNav.map((key) => (
              <li key={key}>
                <Link href={href(locale, key)} className="transition-colors hover:text-champagne-light">
                  {dict.nav[key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-champagne">{dict.footer.information}</p>
          <ul className="mt-5 space-y-3 text-ivory/70">
            <li>{dict.footer.byAppointment}</li>
            <li>{dict.footer.bookingSoon}</li>
            {siteConfig.contact.region && <li>{siteConfig.contact.region}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-ivory/50 sm:flex-row sm:justify-between sm:px-8">
          <p>
            © {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <p>{dict.meta.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
