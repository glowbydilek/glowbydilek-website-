import { LogoMark } from "@/components/brand/Logo";
import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function NotFoundPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="bg-ivory-100">
      <Container className="flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
        <LogoMark className="h-20 w-20" />
        <p className="mt-8 font-serif text-6xl italic text-champagne-deep">404</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{dict.notFound.title}</h1>
        <p className="mt-6 max-w-md leading-relaxed text-espresso-soft">{dict.notFound.body}</p>
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
