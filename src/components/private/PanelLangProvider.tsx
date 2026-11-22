"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PanelLang } from "@/lib/private/panelLang";
import { tx } from "@/lib/private/panelT";

const Ctx = createContext<PanelLang>("tr");

/** Makes the panel language available to every client component of Agenda/Admin. */
export function PanelLangProvider({ lang, children }: { lang: PanelLang; children: ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export const usePanelLang = () => useContext(Ctx);

/** `const t = useT(); t("Opslaan")` → "Kaydet" in Turkish. */
export function useT() {
  const lang = useContext(Ctx);
  return (s: string) => tx(lang, s);
}
