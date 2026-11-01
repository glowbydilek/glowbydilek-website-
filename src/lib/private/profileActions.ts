"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { audit } from "../db/audit";
import { getDb } from "../db/client";
import { publish, saveDraft } from "../cms/service";
import { invalidateContent } from "../cms/store";
import { parseCertificateLines, parseProfile, type Profile } from "../profile";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Saves and publishes the "Over Dilek" profile (with version history in the CMS). */
export async function profileAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const p: Profile = parseProfile({
    published: f.get("published") === "on",
    verified: f.get("verified") === "on",
    diplomaTitle: str(f, "diplomaTitle"),
    level: str(f, "level"),
    institution: str(f, "institution"),
    year: str(f, "year"),
    certificates: parseCertificateLines(str(f, "certificates")),
    backgroundNl: str(f, "backgroundNl"),
    backgroundEn: str(f, "backgroundEn"),
    photoMediaId: Number(str(f, "photoMediaId")) || null,
    photoIsReal: f.get("photoIsReal") === "on",
  });
  if (p.verified && !p.diplomaTitle) return { error: "Vul de diplomatitel in, of haal het vinkje ‘exact gecontroleerd’ weg." };
  if (p.photoMediaId && !p.photoIsReal) return { error: "Bevestig dat de foto echt een foto van jou is, of kies ‘geen foto’." };
  const db = getDb();
  await saveDraft(db, "profile", "all", p, s.user.id);
  await publish(db, "profile", "all", s.user.id, p.published ? "profiel online" : "profiel offline");
  await audit(db, { userId: s.user.id, action: "profile.saved", entity: "content", entityId: "profile", details: { published: p.published, verified: p.verified } });
  invalidateContent();
  revalidatePath("/over-dilek");
  revalidatePath("/en/about-dilek");
  revalidatePath("/admin/over-dilek");
  return { ok: true, message: p.published ? (p.verified ? "Opgeslagen en zichtbaar op Over Dilek." : "Opgeslagen. Achtergrond en certificaten zijn zichtbaar; het diploma pas na het vinkje ‘exact gecontroleerd’.") : "Opgeslagen (niet zichtbaar op de website)." };
}
