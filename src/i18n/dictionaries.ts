import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { nl, type Dictionary } from "./dictionaries/nl";

const dictionaries: Record<Locale, Dictionary> = { nl, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
