"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { siteConfig } from "@/content/site";
import { deliverSoon } from "../notifications/deliver";
import { inviteForReview, moderateReview, replyToReview, ReviewError, saveReviewSettings } from "../reviews/service";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refreshPublic = () => {
  revalidatePath("/beoordelingen");
  revalidatePath("/en/reviews");
  revalidatePath("/admin/beoordelingen");
};

export async function moderateReviewAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const op = str(f, "op");
  if (!["publish", "reject", "remove", "pending"].includes(op)) return { error: "Onbekende actie." };
  await moderateReview(getDb(), id, op as "publish", str(f, "note"), s.user.id);
  refreshPublic();
  // The review moves to another list: show the result on the page itself.
  redirect(`/admin/beoordelingen?s=${encodeURIComponent(str(f, "from") || "pending")}&melding=${op}`);
}

export async function replyReviewAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  await replyToReview(getDb(), Number(f.get("id")), str(f, "reply"), s.user.id);
  refreshPublic();
  return { ok: true, message: "Reactie opgeslagen." };
}

export async function reviewSettingsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const url = str(f, "googleReviewUrl");
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" || !/(^|\.)(google\.[a-z.]+|g\.page|maps\.app\.goo\.gl)$/.test(u.hostname)) throw new Error("host");
    } catch {
      return { error: "Gebruik de link die Google je geeft voor beoordelingen (begint met https://g.page/… of https://www.google.…)." };
    }
  }
  await saveReviewSettings(getDb(), { googleReviewUrl: url, invitesEnabled: f.get("invitesEnabled") === "on" }, s.user.id);
  refreshPublic();
  return { ok: true, message: "Opgeslagen." };
}

export async function inviteReviewAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  try {
    await inviteForReview(getDb(), Number(f.get("appointmentId")), s.user.id, siteConfig.url);
  } catch (e) {
    if (e instanceof ReviewError) return { error: e.message };
    throw e;
  }
  await deliverSoon(getDb());
  return { ok: true, message: "Uitnodiging in de verzendwachtrij gezet." };
}
