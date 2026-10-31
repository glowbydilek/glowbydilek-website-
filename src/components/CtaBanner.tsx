import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ButtonLink } from "./Button";
import { Container } from "./Container";
import { Ornament } from "./PageHero";

export function CtaBanner({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-nude-light px-6 py-16 text-center sm:px-16 sm:py-20">
          <Ornament className="text-champagne/40" />
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl">{dict.home.closing.title}</h2>
            <span className="gold-rule mx-auto mt-6" />
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-charcoal-soft">{dict.home.closing.body}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ButtonLink href={href(locale, "booking")}>{dict.cta.book}</ButtonLink>
              <ButtonLink href={href(locale, "contact")} variant="outline">
                {dict.cta.contact}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
