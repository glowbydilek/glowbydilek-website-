import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { faqPageCopy } from "@/content/copy";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function FaqPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const f = faqPageCopy(locale);
  const all = f.groups.flatMap((g) => g.items);

  return (
    <>
      <PageHero locale={locale} photo="vase" ratio={5 / 4} crumbs={[{ name: dict.nav.faq }]} {...f.hero}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={href(locale, "contact")} arrow>
            {dict.cta.contact}
          </ButtonLink>
          <ButtonLink href={href(locale, "booking")} variant="outline">
            {dict.cta.request}
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section-tight border-t border-stone/70">
        <Container className="space-y-12 lg:space-y-16">
          {f.groups.map((g) => (
            <div key={g.title} className="grid gap-6 md:grid-cols-[0.75fr_1.25fr] lg:gap-16">
              <h2 className="display text-[2rem] sm:text-[2.6rem]">{g.title}</h2>
              <Faq items={g.items} />
            </div>
          ))}
        </Container>
        <JsonLd data={faqJsonLd(all)} />
      </section>

      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
