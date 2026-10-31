import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";
import { ButtonLink } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";

/** Dark appointment band with a layered photo; ends most pages. */
export function AppointmentCta({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.appointment;
  return (
    <section className="px-3 py-3 sm:px-5 sm:py-5">
      <div className="on-dark relative overflow-hidden rounded-[2rem] bg-forest text-ivory lg:rounded-[2.5rem]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <Container className="relative py-16 sm:py-20 lg:py-24 lg:pr-4">
            <div data-reveal>
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 className="display mt-6 text-5xl text-ivory sm:text-6xl lg:text-7xl">{t.title}</h2>
              <p className="lead mt-6 max-w-xl">{t.body}</p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href={href(locale, "booking")} variant="gold" arrow>
                  {dict.cta.request}
                </ButtonLink>
                <ButtonLink href={href(locale, "contact")} variant="outline-light">
                  {dict.cta.contact}
                </ButtonLink>
              </div>
              <ul className="mt-12 grid gap-4 border-t border-ivory/12 pt-8 text-sm text-ivory/75 sm:grid-cols-2">
                <li className="flex items-start gap-3">
                  <Icon name="clock" className="h-5 w-5 shrink-0 text-gold" />
                  {dict.common.byAppointment}
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="pin" className="h-5 w-5 shrink-0 text-gold" />
                  {dict.common.location}
                </li>
              </ul>
            </div>
          </Container>
          <div className="relative min-h-[20rem] lg:min-h-full" data-reveal="mask">
            <Photo id="experience" locale={locale} fill parallax={0.05} sizes="(min-width: 1024px) 42vw, 100vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
