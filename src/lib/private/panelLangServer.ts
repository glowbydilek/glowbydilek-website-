import "server-only";
import { cookies } from "next/headers";
import { PANEL_LANG_COOKIE, toPanelLang, type PanelLang } from "./panelLang";

/** The panel language chosen on this device (default Dutch). */
export async function getPanelLang(): Promise<PanelLang> {
  const jar = await cookies();
  return toPanelLang(jar.get(PANEL_LANG_COOKIE)?.value);
}
