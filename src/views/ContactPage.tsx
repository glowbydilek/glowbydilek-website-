import { ButtonLink } from "@/components/Button";
import { ContactChannels } from "@/components/ContactChannels";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function ContactPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.contact;

  return (
    <>
      <PageHero {...t.hero} />
      <section className="py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-champagne/25 bg-ivory-100/60 p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl">{t.channelsTitle}</h2>
            <span className="gold-rule mt-5" />
            <div className="mt-8">
              <ContactChannels dict={dict} />
            </div>
            <p className="mt-8 text-sm leading-relaxed text-charcoal-muted">{t.privacy}</p>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-[2rem] bg-nude-light p-8">
              <h2 className="text-3xl">{t.hoursTitle}</h2>
              <span className="gold-rule mt-5" />
              <p className="mt-5 leading-relaxed text-charcoal-soft">{t.hoursBody}</p>
            </div>
            <div className="rounded-[2rem] bg-charcoal p-8 text-ivory">
              <h2 className="text-3xl text-ivory">{dict.booking.hero.title}</h2>
              <p className="mt-4 leading-relaxed text-ivory/75">{dict.booking.notice.title}.</p>
              <ButtonLink
                href={href(locale, "booking")}
                variant="outline"
                className="mt-8 border-ivory/40! text-ivory! hover:border-champagne! hover:text-champagne-light!"
              >
                {dict.cta.book}
              </ButtonLink>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
