import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function NotFoundPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="bg-silk">
      <Container className="flex min-h-[70dvh] flex-col items-center justify-center pb-24 pt-40 text-center">
        <p className="font-serif text-7xl italic text-champagne-deep">404</p>
        <h1 className="mt-6 text-4xl sm:text-5xl">{dict.notFound.title}</h1>
        <span className="gold-rule mx-auto mt-6" />
        <p className="mt-6 max-w-md leading-relaxed text-charcoal-soft">{dict.notFound.body}</p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <ButtonLink href={href(locale, "home")}>{dict.notFound.back}</ButtonLink>
          <ButtonLink href={href(locale, "treatments")} variant="outline">
            {dict.cta.viewTreatments}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
