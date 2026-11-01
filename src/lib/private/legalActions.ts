"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { audit } from "../db/audit";
import { getDb } from "../db/client";
import { mergeContent } from "../cms/registry";
import { publish, saveDraft } from "../cms/service";
import { getPublishedEntry, invalidateContent } from "../cms/store";
import { legalEn } from "@/content/copy/legal.en";
import { legalNl, type LegalKey } from "@/content/copy/legal.nl";
import { DEFAULT_LEGAL_STATUS, hasPlaceholder, LEGAL_KEYS } from "../legal";
import type { FormState } from "./authActions";

/** Switch a legal page on or off. Refused while the published text still contains [INVULLEN …]. */
export async function legalStatusAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const key = String(f.get("key") ?? "") as LegalKey;
  if (!LEGAL_KEYS.includes(key)) return { error: "Onbekende pagina." };
  const on = f.get("on") === "1";
  if (on) {
    for (const [loc, def] of [["nl", legalNl[key]], ["en", legalEn[key]]] as const) {
      const row = await getPublishedEntry(`legal:${key}`, loc);
      const doc = row ? mergeContent(def, row.data) : def;
      if (hasPlaceholder(doc)) return { error: `De ${loc === "nl" ? "Nederlandse" : "Engelse"} tekst bevat nog [INVULLEN …]-markeringen. Pas de tekst aan onder Pagina's en publiceer hem eerst.` };
      if (!doc.effectiveDate.trim()) return { error: `Vul in de ${loc === "nl" ? "Nederlandse" : "Engelse"} tekst de ingangsdatum in (veld ‘Effective date’) en publiceer hem eerst.` };
    }
  }
  const row = await getPublishedEntry("legal-status", "all");
  const current = { ...DEFAULT_LEGAL_STATUS, ...((row?.data as object) ?? {}) };
  await saveDraft(db, "legal-status", "all", { ...current, [key]: on }, s.user.id);
  await publish(db, "legal-status", "all", s.user.id, `${key}: ${on ? "online" : "offline"}`);
  await audit(db, { userId: s.user.id, action: "legal.status", entity: "legal", entityId: key, details: { on } });
  invalidateContent();
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/admin/juridisch");
  return { ok: true, message: on ? "De pagina staat online en is gelinkt in de footer." : "De pagina is offline gehaald." };
}
