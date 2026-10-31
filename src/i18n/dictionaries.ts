import { currentSnapshot, type Snapshot } from "../lib/cms/current";
import { mergeContent } from "../lib/cms/registry";
import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { nl, type Dictionary } from "./dictionaries/nl";

const dictionaries: Record<Locale, Dictionary> = { nl, en };
const memo = new WeakMap<Snapshot, Partial<Record<Locale, Dictionary>>>();

/** UI copy for a locale: built-in text with the owner's published (or previewed) edits merged in. */
export function getDictionary(locale: Locale): Dictionary {
  const snap = currentSnapshot();
  if (!snap.docs.size) return dictionaries[locale];
  const cached = memo.get(snap)?.[locale];
  if (cached) return cached;
  const base = dictionaries[locale];
  const out = { ...base } as Record<string, unknown>;
  for (const k of Object.keys(base)) {
    const o = snap.docs.get(`dict:${k}|${locale}`);
    if (o !== undefined) out[k] = mergeContent((base as Record<string, unknown>)[k], o);
  }
  memo.set(snap, { ...memo.get(snap), [locale]: out as Dictionary });
  return out as Dictionary;
}

/** Built-in copy only (editor defaults). */
export function getDefaultDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
