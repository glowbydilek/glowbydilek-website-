"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { audit } from "../db/audit";
import { getDb } from "../db/client";
import { campaigns, promotions } from "../db/schema";
import { invalidateContent } from "../cms/store";
import { parseEuroToCents } from "../finance/money";
import { validatePromotion } from "../promotions/core";
import { isLocalDate, localToUtc } from "../time";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const dayStart = (d: string) => localToUtc(d, 0);
const dayEnd = (d: string) => new Date(localToUtc(d, 24 * 60 - 1).getTime() + 59_999);

function refresh() {
  invalidateContent();
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/admin/acties");
}

export async function promotionAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const v = validatePromotion(
    {
      nameNl: str(f, "nameNl"),
      nameEn: str(f, "nameEn"),
      kind: str(f, "kind"),
      value: str(f, "value"),
      scope: str(f, "scope"),
      scopeIds: f.getAll("scopeIds").map(String),
      code: str(f, "code"),
      startsAt: str(f, "startsAt"),
      endsAt: str(f, "endsAt"),
      maxUses: str(f, "maxUses"),
      minSpend: str(f, "minSpend"),
      status: str(f, "status"),
      showPublic: f.get("showPublic") === "on",
      noteNl: str(f, "noteNl"),
      noteEn: str(f, "noteEn"),
    },
    parseEuroToCents,
    dayStart,
    dayEnd,
  );
  if (!v.ok) return { error: v.error };
  const id = Number(str(f, "id")) || null;
  if (v.value.code) {
    const [dup] = await db.select({ id: promotions.id }).from(promotions).where(eq(promotions.code, v.value.code));
    if (dup && dup.id !== id) return { error: "Deze actiecode wordt al gebruikt door een andere actie." };
  }
  if (id) {
    await db.update(promotions).set(v.value).where(eq(promotions.id, id));
  } else {
    await db.insert(promotions).values(v.value);
  }
  await audit(db, { userId: s.user.id, action: id ? "promotion.updated" : "promotion.created", entity: "promotion", entityId: String(id ?? "new"), details: { status: v.value.status, kind: v.value.kind, value: v.value.value } });
  refresh();
  return { ok: true, message: v.value.status === "active" ? "Opgeslagen. De actie geldt binnen de ingestelde periode." : "Opgeslagen als concept — nog niet actief." };
}

const SAFE_PATH = /^\/(?!admin|agenda|ajanda|login|api|media|_next)[a-z0-9\-/]*$/;

export async function campaignAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const titleNl = str(f, "titleNl").slice(0, 140);
  if (!titleNl) return { error: "Vul een titel in." };
  const href = str(f, "href");
  if (href && !SAFE_PATH.test(href)) return { error: "De link moet een pagina van deze website zijn, bijv. /prijzen of /gezichtsbehandelingen." };
  const startsAt = str(f, "startsAt");
  const endsAt = str(f, "endsAt");
  if ((startsAt && !isLocalDate(startsAt)) || (endsAt && !isLocalDate(endsAt))) return { error: "Controleer de datums." };
  if (startsAt && endsAt && endsAt < startsAt) return { error: "De einddatum ligt vóór de begindatum." };
  const mediaId = Number(str(f, "mediaId")) || null;
  const status = ["draft", "active", "archived"].includes(str(f, "status")) ? str(f, "status") : "draft";
  const values = {
    titleNl,
    titleEn: str(f, "titleEn").slice(0, 140) || titleNl,
    textNl: str(f, "textNl").slice(0, 400),
    textEn: str(f, "textEn").slice(0, 400),
    ctaNl: str(f, "ctaNl").slice(0, 60),
    ctaEn: str(f, "ctaEn").slice(0, 60),
    href,
    mediaId,
    startsAt: startsAt ? dayStart(startsAt) : null,
    endsAt: endsAt ? dayEnd(endsAt) : null,
    status,
    sort: Number(str(f, "sort")) || 0,
  };
  const id = Number(str(f, "id")) || null;
  if (id) await db.update(campaigns).set(values).where(eq(campaigns.id, id));
  else await db.insert(campaigns).values(values);
  await audit(db, { userId: s.user.id, action: id ? "campaign.updated" : "campaign.created", entity: "campaign", entityId: String(id ?? "new"), details: { status } });
  refresh();
  return { ok: true, message: status === "active" ? "Opgeslagen. De slide staat op de homepage binnen de ingestelde periode." : "Opgeslagen (niet zichtbaar)." };
}
