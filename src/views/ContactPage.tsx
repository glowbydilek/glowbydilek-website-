import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { RequestSection } from "@/components/RequestSection";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { mailto, siteConfig } from "@/content/site";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function ContactPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.contact;
  const c = siteConfig.contact;

  const extra: { icon: IconName; label: string; value: string; href: string }[] = [];
  if (c.phone) extra.push({ icon: "comfort", label: t.phone, value: c.phone, href: `tel:${c.phone}` });
  if (c.whatsapp) extra.push({ icon: "comfort", label: t.whatsapp, value: `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp}` });
  if (c.instagram) {
    const h = c.instagram.replace(/^@/, "");
    extra.push({ icon: "sparkle", label: t.instagram, value: `@${h}`, href: `https://www.instagram.com/${h}` });
  }

  return (
    <>
      <PageHero locale={locale} photo="hero-detail" {...t.hero} />

      <section className="py-20 sm:py-24">
        <Container className="grid gap-6 lg:grid-cols-3">
          <a
            href={mailto(t.email.subject)}
            className="on-dark group rounded-[1.75rem] bg-espresso p-8 text-ivory transition-transform duration-500 hover:-translate-y-1 lg:col-span-2 sm:p-10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ivory/10 text-champagne">
              <Icon name="mail" />
            </span>
            <p className="eyebrow mt-8">{t.email.label}</p>
            <p className="mt-4 break-all font-serif text-4xl text-ivory sm:text-6xl">{c.email}</p>
            <p className="mt-5 flex items-center gap-3 text-ivory/70">
              {t.email.note}
              <Icon name="arrow" className="h-4 w-4 text-champagne transition-transform duration-500 group-hover:translate-x-1" />
            </p>
          </a>
          <div className="flex flex-col gap-6">
            <div className="flex-1 rounded-[1.75rem] bg-ivory-100 p-8">
              <Icon name="pin" className="h-6 w-6 text-champagne-deep" />
              <h2 className="mt-5 text-2xl">{t.location.title}</h2>
              <p className="mt-3 leading-relaxed text-espresso-soft">{dict.common.location}</p>
            </div>
            <div className="flex-1 rounded-[1.75rem] bg-blush-light p-8">
              <Icon name="clock" className="h-6 w-6 text-champagne-deep" />
              <h2 className="mt-5 text-2xl">{t.hours.title}</h2>
              <p className="mt-3 leading-relaxed text-espresso-soft">{t.hours.body}</p>
            </div>
          </div>
          {extra.map((e) => (
            <a key={e.label} href={e.href} className="rounded-[1.75rem] border border-espresso/10 p-8 hover:border-espresso/30">
              <p className="eyebrow">{e.label}</p>
              <p className="mt-3 font-serif text-2xl">{e.value}</p>
            </a>
          ))}
        </Container>
        <Container>
          <p className="mt-8 flex max-w-3xl items-start gap-3 text-sm leading-relaxed text-espresso-muted">
            <Icon name="privacy" className="mt-0.5 h-4 w-4 shrink-0 text-champagne-deep" />
            {t.privacy}
          </p>
        </Container>
      </section>

      <section className="bg-ivory-100 py-20 sm:py-24">
        <Container className="max-w-5xl">
          <RequestSection locale={locale} dict={dict} />
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <Faq items={dict.faq.general.slice(2, 6)} />
        </Container>
      </section>
    </>
  );
}
