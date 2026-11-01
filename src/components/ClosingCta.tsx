import { hasPhoto } from "@/content/media";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";
import { ButtonLink } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";

/** The one dark (charcoal) band of a page: the booking invitation. */
export function ClosingCta({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.closing;
  const withPhoto = hasPhoto("experience");
  return (
    <section className="section-tight">
      <Container>
        <div className={`on-dark relative grid overflow-hidden rounded-[var(--radius-media)] bg-ink text-paper ${withPhoto ? "md:grid-cols-[1.15fr_0.85fr]" : ""}`}>
          <div className={`relative p-7 sm:p-10 lg:p-14 ${withPhoto ? "" : "lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-14"}`} data-reveal>
            <div>
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 className="display mt-4 max-w-2xl text-[2.3rem] text-paper sm:text-5xl lg:text-[3.6rem]">{t.title}</h2>
              <p className="lead mt-4 max-w-xl">{t.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href={href(locale, "booking")} variant="gold" arrow>
                  {dict.cta.request}
                </ButtonLink>
                <ButtonLink href={href(locale, "contact")} variant="outline-light">
                  {dict.cta.contact}
                </ButtonLink>
              </div>
            </div>
            <ul className={`mt-8 grid gap-3 border-t border-paper/12 pt-6 text-sm text-paper/75 ${withPhoto ? "" : "lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"}`}>
              <li className="flex items-start gap-3">
                <Icon name="clock" className="h-5 w-5 shrink-0 text-glow" />
                {dict.common.byAppointment}
              </li>
              <li className="flex items-start gap-3">
                <Icon name="pin" className="h-5 w-5 shrink-0 text-glow" />
                {dict.common.location}
              </li>
            </ul>
          </div>
          {withPhoto && (
            <div className="relative min-h-[16rem] md:min-h-full">
              <Photo id="experience" locale={locale} fill label={dict.common.moodImage} sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
