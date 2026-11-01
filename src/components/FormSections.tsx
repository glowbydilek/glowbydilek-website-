import { siteConfig } from "@/content/site";
import { groupCopy } from "@/content/copy";
import { publicGroups, publicItems, publicSections } from "@/lib/catalogue";
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
  // Every published treatment and package, grouped by zone (waxing) or section.
  const groups = publicSections().flatMap((s) => {
    const zones = publicGroups(s.id).map((g) => ({
      id: g.id,
      name: s.id === "waxing" ? groupCopy(locale, g.id, g.name[locale]).label : `${s.name[locale]} · ${g.name[locale]}`,
      treatments: publicItems({ sectionId: s.id, groupId: g.id }).map((t) => ({ id: t.id, name: t.name[locale] })),
    }));
    const loose = publicItems({ sectionId: s.id, groupId: null });
    return loose.length ? [...zones, { id: s.id, name: s.name[locale], treatments: loose.map((t) => ({ id: t.id, name: t.name[locale] })) }] : zones;
  });
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
