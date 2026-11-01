import "server-only";
import { and, eq } from "drizzle-orm";
import { draftMode } from "next/headers";
import { cache } from "react";
import { currentSession } from "../auth/session";
import { databaseConfigured, getDb } from "../db/client";
import { contentEntries, media, treatments } from "../db/schema";
import { EMPTY_SNAPSHOT, setSnapshotResolver, type PhotoOverride, type Snapshot, type TreatmentLive } from "./current";

/**
 * Loads owner-edited content for rendering.
 * - Published content is cached per process (60 s) and invalidated on publish.
 * - Draft preview (Next.js draft mode) is only honoured for a signed-in owner.
 */
// Kept on globalThis: Next.js bundles server actions and page rendering in
// separate module layers, so a module-level variable would be duplicated and
// invalidateContent() from an action would not reach the render cache.
type ContentCache = { published: { snap: Snapshot; at: number } | null; version: number };
const g = globalThis as typeof globalThis & { __glowContent?: ContentCache };
const cacheState: ContentCache = (g.__glowContent ??= { published: null, version: 1 });
const TTL = 60_000;

const requestStore = cache(() => ({ snap: null as Snapshot | null }));

setSnapshotResolver(() => {
  try {
    return requestStore().snap ?? cacheState.published?.snap ?? null;
  } catch {
    // Outside a React request (route handlers, scripts): published cache only.
    return cacheState.published?.snap ?? null;
  }
});

export function invalidateContent() {
  cacheState.published = null;
  cacheState.version++;
}

async function load(status: "published" | "draft"): Promise<Snapshot> {
  const db = getDb();
  const rows = await db.select().from(contentEntries).where(eq(contentEntries.status, "published"));
  const docs = new Map<string, unknown>(rows.map((r) => [`${r.docKey}|${r.locale}`, r.data]));
  if (status === "draft") {
    const drafts = await db.select().from(contentEntries).where(eq(contentEntries.status, "draft"));
    for (const d of drafts) docs.set(`${d.docKey}|${d.locale}`, d.data);
  }
  const trows = await db.select().from(treatments);
  const tmap = new Map<string, TreatmentLive>(trows.map((t) => [t.id, { ...t }]));
  const photoMap = (docs.get("photos|all") ?? {}) as Record<string, number>;
  const ids = Object.values(photoMap).filter((n) => Number.isInteger(n));
  const photos = new Map<string, PhotoOverride>();
  if (ids.length) {
    const ms = await db.select({ id: media.id, updatedAt: media.updatedAt, width: media.width, height: media.height, altNl: media.altNl, altEn: media.altEn, focusMobile: media.focusMobile, focusDesktop: media.focusDesktop }).from(media);
    for (const [slot, id] of Object.entries(photoMap)) {
      const m = ms.find((x) => x.id === id);
      if (m) photos.set(slot, { mediaId: m.id, version: m.updatedAt.getTime(), width: m.width, height: m.height, altNl: m.altNl, altEn: m.altEn, focusMobile: m.focusMobile, focusDesktop: m.focusDesktop });
    }
  }
  return { docs, treatments: tmap, photos, preview: status === "draft", version: cacheState.version };
}

/**
 * Call at the start of every public page/layout render (before any content
 * getter). Safe without a database: the built-in content is used.
 */
export async function ensureContent(): Promise<Snapshot> {
  const store = requestStore();
  if (store.snap) return store.snap;
  if (!databaseConfigured()) return (store.snap = EMPTY_SNAPSHOT);
  try {
    let preview = false;
    try {
      preview = (await draftMode()).isEnabled;
    } catch {
      preview = false;
    }
    if (preview) {
      const s = await currentSession();
      if (s && (!s.mfaRequired || s.mfaPassed)) return (store.snap = await load("draft"));
    }
    const cached = cacheState.published;
    if (cached && Date.now() - cached.at <= TTL) return (store.snap = cached.snap);
    const snap = await load("published");
    cacheState.published = { snap, at: Date.now() };
    return (store.snap = snap);
  } catch (err) {
    console.error("[cms] content could not be loaded, using built-in content:", err instanceof Error ? err.message.slice(0, 160) : err);
    return (store.snap = cacheState.published?.snap ?? EMPTY_SNAPSHOT);
  }
}

export async function getPublishedEntry(docKey: string, locale: string) {
  const [row] = await getDb()
    .select()
    .from(contentEntries)
    .where(and(eq(contentEntries.docKey, docKey), eq(contentEntries.locale, locale), eq(contentEntries.status, "published")));
  return row ?? null;
}
