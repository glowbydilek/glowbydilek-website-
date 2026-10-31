"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { audit } from "../db/audit";
import { contentEntries, media, mediaVariants, treatments } from "../db/schema";
import { MediaError, processImage, FOCUS_PRESETS } from "../cms/media";
import { invalidateContent } from "../cms/store";
import { editorValue, publish, saveDraft } from "../cms/service";
import { photos as builtInPhotos, type PhotoId } from "@/content/media";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const focus = (v: string) => (FOCUS_PRESETS.some(([p]) => p === v) || /^\d{1,3}% \d{1,3}%$/.test(v) ? v : "50% 50%");

function refresh() {
  invalidateContent();
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/admin/media");
}

async function fileBuffer(f: FormData): Promise<{ buf: Buffer; name: string } | null> {
  const file = f.get("file");
  if (!file || typeof file === "string" || file.size === 0) return null;
  return { buf: Buffer.from(await file.arrayBuffer()), name: file.name.replace(/[^\w.\- ]+/g, "").slice(0, 150) || "foto" };
}

export async function uploadMediaAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const file = await fileBuffer(f);
  if (!file) return { error: "Kies een foto om te uploaden." };
  try {
    const p = await processImage(file.buf);
    const db = getDb();
    const id = await db.transaction(async (tx) => {
      const [res] = (await tx.insert(media).values({
        filename: file.name,
        mime: p.mime,
        width: p.width,
        height: p.height,
        bytes: file.buf.length,
        altNl: str(f, "altNl").slice(0, 300),
        altEn: str(f, "altEn").slice(0, 300),
        source: str(f, "source").slice(0, 300),
        license: str(f, "license").slice(0, 300),
      })) as unknown as [{ insertId: number }];
      for (const v of p.variants) await tx.insert(mediaVariants).values({ mediaId: res.insertId, width: v.width, mime: v.mime, data: v.data });
      return res.insertId;
    });
    await audit(db, { userId: s.user.id, action: "media.uploaded", entity: "media", entityId: id });
    revalidatePath("/admin/media");
    return { ok: true, message: `Foto geüpload. Vul de omschrijving (alt-tekst) in en kies eventueel waar hij gebruikt wordt.` };
  } catch (err) {
    if (err instanceof MediaError) return { error: err.message };
    console.error("[media] upload failed:", err instanceof Error ? err.message.slice(0, 160) : err);
    return { error: "De foto kon niet worden verwerkt. Probeer een ander bestand (JPG, PNG of WebP)." };
  }
}

export async function updateMediaAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const db = getDb();
  const file = await fileBuffer(f);
  try {
    if (file) {
      const p = await processImage(file.buf);
      await db.transaction(async (tx) => {
        await tx.delete(mediaVariants).where(eq(mediaVariants.mediaId, id));
        for (const v of p.variants) await tx.insert(mediaVariants).values({ mediaId: id, width: v.width, mime: v.mime, data: v.data });
        await tx.update(media).set({ filename: file.name, mime: p.mime, width: p.width, height: p.height, bytes: file.buf.length }).where(eq(media.id, id));
      });
    }
    await db
      .update(media)
      .set({
        altNl: str(f, "altNl").slice(0, 300),
        altEn: str(f, "altEn").slice(0, 300),
        focusMobile: focus(str(f, "focusMobile")),
        focusDesktop: focus(str(f, "focusDesktop")),
        source: str(f, "source").slice(0, 300),
        license: str(f, "license").slice(0, 300),
      })
      .where(eq(media.id, id));
  } catch (err) {
    if (err instanceof MediaError) return { error: err.message };
    throw err;
  }
  await audit(db, { userId: s.user.id, action: file ? "media.replaced" : "media.updated", entity: "media", entityId: id });
  refresh();
  return { ok: true, message: file ? "Foto vervangen en opgeslagen." : "Opgeslagen." };
}

/** Where a media item is used (photo slots, social images, treatments). */
export async function mediaUsage(id: number): Promise<string[]> {
  const db = getDb();
  const out: string[] = [];
  const photos = ((await editorValue(db, "photos", "all", {})).value ?? {}) as Record<string, number>;
  for (const [slot, mid] of Object.entries(photos)) if (mid === id) out.push(`Fotoplek: ${builtInPhotos[slot as PhotoId]?.brief ?? slot}`);
  const seo = await db.select({ docKey: contentEntries.docKey, data: contentEntries.data }).from(contentEntries);
  for (const r of seo) if (r.docKey.startsWith("seo:") && (r.data as { ogImage?: number })?.ogImage === id) out.push(`Deelafbeelding ${r.docKey.slice(4)}`);
  const tr = await db.select({ id: treatments.id }).from(treatments).where(eq(treatments.mediaId, id));
  for (const t of tr) out.push(`Behandeling ${t.id}`);
  return [...new Set(out)];
}

export async function deleteMediaAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const used = await mediaUsage(id);
  if (used.length) return { error: `Deze foto wordt nog gebruikt (${used.join(", ")}). Kies eerst een andere foto voor die plek.` };
  const db = getDb();
  await db.delete(media).where(eq(media.id, id));
  await audit(db, { userId: s.user.id, action: "media.deleted", entity: "media", entityId: id });
  revalidatePath("/admin/media");
  return { ok: true, message: "Foto verwijderd." };
}

/** Choose which photo appears in a slot of the website (empty = built-in photo). Published immediately. */
export async function assignSlotAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const slot = str(f, "slot") as PhotoId;
  if (!(slot in builtInPhotos)) return { error: "Onbekende fotoplek." };
  const mediaId = str(f, "mediaId") ? Number(str(f, "mediaId")) : null;
  const db = getDb();
  if (mediaId) {
    const [m] = await db.select({ id: media.id, altNl: media.altNl, altEn: media.altEn }).from(media).where(eq(media.id, mediaId));
    if (!m) return { error: "Foto niet gevonden." };
    if (!m.altNl.trim() || !m.altEn.trim()) return { error: "Vul eerst de omschrijving (alt-tekst) in het Nederlands en Engels in. Dat is nodig voor toegankelijkheid en Google." };
  }
  const current = ((await editorValue(db, "photos", "all", {})).value ?? {}) as Record<string, number>;
  const next = { ...current };
  if (mediaId) next[slot] = mediaId;
  else delete next[slot];
  await saveDraft(db, "photos", "all", next, s.user.id);
  await publish(db, "photos", "all", s.user.id);
  refresh();
  return { ok: true, message: mediaId ? "De foto staat nu op de website." : "De oorspronkelijke foto staat weer op de website." };
}
