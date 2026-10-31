import { siteConfig } from "@/content/site";
import { treatmentGroups } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { AppointmentForm } from "./forms/AppointmentForm";
import { turnstileSiteKey } from "@/lib/forms/turnstile";
import { ContactForm } from "./forms/ContactForm";

/** Server wrappers that localise data for the client forms. */
export function ContactFormBlock({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return <ContactForm locale={locale} t={dict.forms} privacyHref={href(locale, "privacy")} email={siteConfig.contact.email} turnstileSiteKey={turnstileSiteKey()} />;
}

export function AppointmentFormBlock({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const groups = treatmentGroups.map((g) => ({
    id: g.id,
    name: g.name[locale],
    treatments: g.treatments.map((t) => ({ id: t.id, name: t.name[locale] })),
  }));
  return (
    <AppointmentForm
      locale={locale}
      t={dict.forms}
      groups={groups}
      privacyHref={href(locale, "privacy")}
      email={siteConfig.contact.email}
      notConfirmed={dict.booking.notConfirmed}
      turnstileSiteKey={turnstileSiteKey()}
    />
  );
}
