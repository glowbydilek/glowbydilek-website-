import type { RequestCalendar } from "@/lib/booking/calendar";
import { emailDisplay } from "@/content/site";
import { groupCopy } from "@/content/copy";
import { priceLabel, publicGroups, publicItems, publicSections } from "@/lib/catalogue";
import { currentSnapshot } from "@/lib/cms/current";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { AppointmentForm, type FormSection } from "./forms/AppointmentForm";
import { turnstileSiteKey } from "@/lib/forms/turnstile";
import { ContactForm } from "./forms/ContactForm";

/** Server wrappers that localise data for the client forms. */
export function ContactFormBlock({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return <ContactForm locale={locale} t={dict.forms} privacyHref={href(locale, "privacy")} email={emailDisplay} turnstileSiteKey={turnstileSiteKey()} />;
}

export function AppointmentFormBlock({ locale, dict, calendar }: { locale: Locale; dict: Dictionary; calendar: RequestCalendar }) {
  // Every published treatment and package, per website category (same order
  // and names as the menu); waxing keeps its zones as sub-groups.
  // Same price wording as the booking journey and the price list, so every step shows the same amount.
  const price = (i: Parameters<typeof priceLabel>[0]) => priceLabel(i, locale, { from: dict.prices.from, onRequest: "" }) || null;
  const sections: FormSection[] = publicSections(locale)
    .map((s) => {
      const zones = publicGroups(s.id, locale).map((g) => ({
        id: g.id,
        name: s.id === "waxing" ? groupCopy(locale, g.id, g.name[locale]).label : g.name[locale],
        treatments: publicItems({ sectionId: s.id, groupId: g.id, locale }).map((t) => ({ id: t.id, name: t.name[locale], price: price(t) })),
      }));
      const loose = publicItems({ sectionId: s.id, groupId: null, locale }).map((t) => ({ id: t.id, name: t.name[locale], price: price(t) }));
      const groups = [...zones, ...(loose.length ? [{ id: s.id, name: zones.length ? s.name[locale] : null, treatments: loose }] : [])].filter((g) => g.treatments.length);
      return { id: s.id, name: s.name[locale], groups };
    })
    .filter((s) => s.groups.length);
  return (
    <AppointmentForm
      locale={locale}
      t={dict.forms}
      sections={sections}
      calendar={calendar}
      privacyHref={href(locale, "privacy")}
      email={emailDisplay}
      notConfirmed={dict.booking.notConfirmed}
      turnstileSiteKey={turnstileSiteKey()}
      promoField={Boolean(currentSnapshot().marketing?.hasCodes)}
    />
  );
}
