import { siteConfig } from "@/content/site";
import { treatmentGroups } from "@/content/treatments";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { RequestComposer } from "./RequestComposer";

/** Server wrapper that localises the treatment list for the composer. */
export function RequestSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const groups = treatmentGroups.map((g) => ({
    id: g.id,
    name: g.name[locale],
    treatments: g.treatments.map((t) => ({ id: t.id, name: t.name[locale] })),
  }));
  return <RequestComposer t={dict.request} groups={groups} email={siteConfig.contact.email} />;
}
