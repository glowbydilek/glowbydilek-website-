import { mailto, siteConfig } from "@/content/site";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LogoMark } from "./brand/Logo";
import { Container } from "./Container";
import { ButtonLink } from "./ui/Button";
import { Icon } from "./ui/Icon";

export function FinalCta({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.final;
  return (
    <section className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="on-dark grain relative overflow-hidden rounded-[2rem] bg-espresso text-ivory">
        <div
          className="absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgb(199_164_119/0.28),transparent_60%),radial-gradient(50%_70%_at_0%_100%,rgb(216_184_169/0.18),transparent_60%)]"
          aria-hidden="true"
        />
        <LogoMark
          className="absolute -right-24 -top-24 h-[28rem] w-[28rem] opacity-[0.07]"
          ink="#faf7f2"
          accent="#faf7f2"
        />
        <Container className="relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-28">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 className="display mt-6 text-5xl text-ivory sm:text-6xl lg:text-7xl">{t.title}</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/75">{t.body}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href={href(locale, "booking")} variant="light" arrow>
                {dict.cta.request}
              </ButtonLink>
              <ButtonLink href={href(locale, "contact")} variant="outline-light">
                {dict.cta.contact}
              </ButtonLink>
            </div>
          </div>
          <div className="space-y-5 border-t border-ivory/15 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <a
              href={mailto(dict.contact.email.subject)}
              className="flex items-center gap-4 text-ivory transition-colors hover:text-champagne-light"
            >
              <Icon name="mail" className="h-5 w-5 text-champagne" />
              <span className="font-serif text-2xl">{siteConfig.contact.email}</span>
            </a>
            <p className="flex items-start gap-4 text-ivory/70">
              <Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-champagne" />
              {dict.common.location}
            </p>
            <p className="flex items-center gap-4 text-ivory/70">
              <Icon name="clock" className="h-5 w-5 text-champagne" />
              {dict.common.byAppointment}
            </p>
          </div>
        </Container>
      </div>
    </section>
  );
}
