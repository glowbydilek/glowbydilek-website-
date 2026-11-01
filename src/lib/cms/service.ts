/**
 * Draft → preview → publish workflow with version history.
 * Framework-free (tested against MariaDB); callers revalidate pages.
 */
import { and, desc, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { contentEntries, contentVersions } from "../db/schema";
import { DOC_MAP, emptyLeaves, isDocKey, mergeContent, sanitizeContent } from "./registry";

export type Loc = "nl" | "en" | "all";

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}

async function entry(db: DB, docKey: string, locale: Loc, status: "draft" | "published") {
  const [row] = await db
    .select()
    .from(contentEntries)
    .where(and(eq(contentEntries.docKey, docKey), eq(contentEntries.locale, locale), eq(contentEntries.status, status)));
  return row ?? null;
}

/** The value the editor should show: draft, else published, else the built-in default. */
export async function editorValue(db: DB, docKey: string, locale: Loc, fallback?: unknown) {
  const [draft, published] = await Promise.all([entry(db, docKey, locale, "draft"), entry(db, docKey, locale, "published")]);
  const def = locale === "all" ? fallback : (DOC_MAP.get(docKey)?.defaults[locale] ?? fallback);
  const value = draft?.data ?? published?.data;
  return {
    value: def !== undefined && value !== undefined ? mergeContent(def, value) : (value ?? def),
    hasDraft: Boolean(draft),
    published: published ? { version: published.version, updatedAt: published.updatedAt } : null,
    draftUpdatedAt: draft?.updatedAt ?? null,
  };
}

export async function saveDraft(db: DB, docKey: string, locale: Loc, data: unknown, userId: number) {
  if (!isDocKey(docKey) && !/^(theme|menu|photos|business|social|analytics|profile|legal-status|sections:\w+|seo:[\w-]+)$/.test(docKey)) throw new ContentError("Onbekend document.");
  const clean = sanitizeContent(data);
  const def = locale === "all" ? undefined : DOC_MAP.get(docKey)?.defaults[locale];
  const value = def !== undefined ? mergeContent(def, clean) : clean;
  await db
    .insert(contentEntries)
    .values({ docKey, locale, status: "draft", data: value, updatedBy: userId })
    .onDuplicateKeyUpdate({ set: { data: value, updatedBy: userId, updatedAt: new Date() } });
  await audit(db, { userId, action: "content.draft_saved", entity: "content", entityId: `${docKey}|${locale}` });
}

export async function publish(db: DB, docKey: string, locale: Loc, userId: number, note?: string): Promise<{ version: number; warnings: string[] }> {
  const draft = await entry(db, docKey, locale, "draft");
  if (!draft) throw new ContentError("Er is geen concept om te publiceren.");
  const warnings = emptyLeaves(draft.data).length ? [`${emptyLeaves(draft.data).length} lege tekstveld(en)`] : [];
  const version = await db.transaction(async (tx) => {
    const [pub] = await tx
      .select()
      .from(contentEntries)
      .where(and(eq(contentEntries.docKey, docKey), eq(contentEntries.locale, locale), eq(contentEntries.status, "published")))
      .for("update");
    const next = (pub?.version ?? 0) + 1;
    await tx.insert(contentVersions).values({ docKey, locale, version: next, data: draft.data, note: note?.slice(0, 200) ?? null, createdBy: userId });
    if (pub) await tx.update(contentEntries).set({ data: draft.data, version: next, updatedBy: userId, updatedAt: new Date() }).where(eq(contentEntries.id, pub.id));
    else await tx.insert(contentEntries).values({ docKey, locale, status: "published", data: draft.data, version: next, updatedBy: userId });
    await tx.delete(contentEntries).where(eq(contentEntries.id, draft.id));
    return next;
  });
  await audit(db, { userId, action: "content.published", entity: "content", entityId: `${docKey}|${locale}`, details: { version } });
  return { version, warnings };
}

export async function discardDraft(db: DB, docKey: string, locale: Loc, userId: number) {
  await db.delete(contentEntries).where(and(eq(contentEntries.docKey, docKey), eq(contentEntries.locale, locale), eq(contentEntries.status, "draft")));
  await audit(db, { userId, action: "content.draft_discarded", entity: "content", entityId: `${docKey}|${locale}` });
}

/** Removes the owner's published edits: the built-in text is shown again (history kept). */
export async function resetToDefault(db: DB, docKey: string, locale: Loc, userId: number) {
  await db.delete(contentEntries).where(and(eq(contentEntries.docKey, docKey), eq(contentEntries.locale, locale)));
  await audit(db, { userId, action: "content.reset_to_default", entity: "content", entityId: `${docKey}|${locale}` });
}

export async function versions(db: DB, docKey: string, locale: Loc) {
  return db
    .select({ id: contentVersions.id, version: contentVersions.version, createdAt: contentVersions.createdAt, note: contentVersions.note })
    .from(contentVersions)
    .where(and(eq(contentVersions.docKey, docKey), eq(contentVersions.locale, locale)))
    .orderBy(desc(contentVersions.version))
    .limit(30);
}

/** Puts an earlier version back as a draft (review, then publish). */
export async function restoreVersion(db: DB, versionId: number, userId: number) {
  const [v] = await db.select().from(contentVersions).where(eq(contentVersions.id, versionId));
  if (!v) throw new ContentError("Versie niet gevonden.");
  await saveDraft(db, v.docKey, v.locale as Loc, v.data, userId);
  await audit(db, { userId, action: "content.version_restored", entity: "content", entityId: `${v.docKey}|${v.locale}`, details: { version: v.version } });
  return { docKey: v.docKey, locale: v.locale as Loc };
}

/** Translation status per document: published/draft per language and empty fields. */
export async function translationStatus(db: DB, docKey: string) {
  const out: Record<"nl" | "en", { draft: boolean; published: boolean; empty: number }> = {
    nl: { draft: false, published: false, empty: 0 },
    en: { draft: false, published: false, empty: 0 },
  };
  for (const l of ["nl", "en"] as const) {
    const [d, p] = await Promise.all([entry(db, docKey, l, "draft"), entry(db, docKey, l, "published")]);
    out[l] = { draft: Boolean(d), published: Boolean(p), empty: emptyLeaves(d?.data ?? p?.data ?? DOC_MAP.get(docKey)?.defaults[l]).length };
  }
  return out;
}
