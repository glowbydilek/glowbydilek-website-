"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PANEL_LANG_COOKIE, toPanelLang } from "./panelLang";

/** Switch the panel language (NL/TR). Remembered on this device for a year. */
export async function setPanelLangAction(formData: FormData) {
  const lang = toPanelLang(String(formData.get("lang") ?? ""));
  const jar = await cookies();
  jar.set(PANEL_LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  revalidatePath("/agenda", "layout");
  revalidatePath("/admin", "layout");
}
