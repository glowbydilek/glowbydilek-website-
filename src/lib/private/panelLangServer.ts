import "server-only";
import { cookies } from "next/headers";
import { PANEL_LANG_COOKIE, toPanelLang, type PanelLang } from "./panelLang";
import { makeT } from "./panelT";

/** The panel language chosen on this device (default Turkish: Dilek's working language). */
export async function getPanelLang(): Promise<PanelLang> {
  const jar = await cookies();
  return toPanelLang(jar.get(PANEL_LANG_COOKIE)?.value);
}

/** Server components: `const t = await panelT(); t("Opslaan")`. */
export async function panelT() {
  return makeT(await getPanelLang());
}
