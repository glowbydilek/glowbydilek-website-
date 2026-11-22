/**
 * Turkish for the private panel, keyed by the Dutch text itself.
 *
 * Every visible Dutch string in Agenda/Admin is its own key: `t("Opslaan")`.
 * Missing translations fall back to Dutch (never an empty label), and
 * tests/panel-tr.test.ts fails when a wrapped string has no Turkish entry.
 * Shared UI pieces (Field, PageHeader, Card, buttons, notices, badges) pass
 * their string props through this automatically, so most screens only need
 * dictionary entries. Customer data and customer e-mails are never translated.
 */
import type { PanelLang } from "./panelLang";
import { TR, TR_PATTERNS } from "./panelTr";

export type T = (s: string) => string;

export function tx(lang: PanelLang, s: string): string {
  if (lang !== "tr" || !s) return s;
  const key = s.trim();
  const hit = TR[key];
  if (hit) return s.replace(key, hit);
  for (const [re, out] of TR_PATTERNS) {
    if (re.test(key)) return s.replace(key, key.replace(re, out));
  }
  return s;
}

export const makeT = (lang: PanelLang): T => (s) => tx(lang, s);
