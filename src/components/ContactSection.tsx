import { mailto, siteConfig, whatsappLink } from "@/content/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";
import { ContactFormBlock } from "./FormSections";
import { Icon } from "./ui/Icon";

/** Contact intro + direct channels + contact form. */
export function ContactSection({
  locale,
  dict,
  eyebrow,
  title,
  body,
  as: Tag = "h2",
}: {
  locale: Locale;
  dict: Dictionary;
  eyebrow: string;
  title: string;
  body: string;
  as?: "h1" | "h2";
}) {
  const wa = whatsappLink(dict.whatsapp.message);
  return (
    <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div data-reveal>
        <p className="eyebrow">{eyebrow}</p>
        <Tag className="display mt-5 text-[2.5rem] sm:text-5xl lg:text-6xl">{title}</Tag>
        <p className="lead mt-6">{body}</p>
        <ul className="mt-10 space-y-3">
          <li>
            <a
              href={mailto(dict.forms.topics.question)}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-forest/12 bg-ivory-50 p-5 transition-colors duration-500 hover:border-forest/40"
            >
              <span className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-ivory">
                  <Icon name="mail" className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted">{dict.contact.emailLabel}</span>
                  <span className="font-serif text-xl text-forest sm:text-2xl">{siteConfig.contact.email}</span>
                </span>
              </span>
              <Icon name="arrow" className="h-4 w-4 text-gold-deep transition-transform duration-500 group-hover:translate-x-1" />
            </a>
          </li>
          {wa && (
            <li>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-2xl border border-forest/12 bg-ivory-50 p-5 transition-colors duration-500 hover:border-forest/40"
              >
                <span className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-ivory">
                    <Icon name="whatsapp" className="h-5 w-5" />
                  </span>
                  <span className="font-serif text-xl text-forest sm:text-2xl">{dict.whatsapp.label}</span>
                </span>
                <Icon name="arrow" className="h-4 w-4 text-gold-deep" />
              </a>
            </li>
          )}
          <li className="flex items-start gap-4 rounded-2xl p-5 text-charcoal-soft">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-light text-forest">
              <Icon name="pin" className="h-5 w-5" />
            </span>
            <span className="pt-1 leading-relaxed">{dict.common.location}</span>
          </li>
        </ul>
      </div>
      <div className="rounded-[2rem] bg-ivory-50 p-6 shadow-card sm:p-10" data-reveal>
        <h3 className="font-serif text-3xl text-forest">{dict.contact.formTitle}</h3>
        <p className="mt-2 text-sm text-muted">{dict.contact.formIntro}</p>
        <div className="mt-8">
          <ContactFormBlock locale={locale} dict={dict} />
        </div>
      </div>
    </Container>
  );
}
