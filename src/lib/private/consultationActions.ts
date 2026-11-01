"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { ConsultationError, deleteConsultation, saveConsultation, saveConsultationSettings, type ConsultationAnswers } from "../consultation/service";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const yn = (v: string): "yes" | "no" | "unknown" => (v === "yes" || v === "no" ? v : "unknown");

export async function saveConsultationAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const customerId = Number(f.get("customerId"));
  const answers: ConsultationAnswers = {
    allergy: yn(str(f, "allergy")),
    allergyNote: str(f, "allergyNote"),
    skinThinning: yn(str(f, "skinThinning")),
    skinThinningNote: str(f, "skinThinningNote"),
    bloodThinners: yn(str(f, "bloodThinners")),
    skinCondition: yn(str(f, "skinCondition")),
    skinConditionNote: str(f, "skinConditionNote"),
    healing: yn(str(f, "healing")),
    precautions: str(f, "precautions"),
  };
  const method = str(f, "consentMethod");
  try {
    await saveConsultation(
      getDb(),
      customerId,
      { answers, consentMethod: method === "written" || method === "digital" ? method : "in_person", consentGiven: f.get("consent") === "on" },
      { userId: s.user.id, mfa: s.user.mfaEnabled && s.mfaPassed },
    );
  } catch (err) {
    if (err instanceof ConsultationError) return { error: err.message };
    throw err;
  }
  revalidatePath(`/agenda/klanten/${customerId}/consultatie`);
  return { ok: true, message: "Versleuteld opgeslagen." };
}

export async function deleteConsultationAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const customerId = Number(f.get("customerId"));
  await deleteConsultation(getDb(), customerId, s.user.id, str(f, "reason") === "withdrawn" ? "consent_withdrawn" : "owner");
  redirect(`/agenda/klanten/${customerId}/consultatie?verwijderd=1`);
}

export async function consultationSettingsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const months = Math.min(60, Math.max(1, Number(str(f, "retentionMonths")) || 24));
  await saveConsultationSettings(
    getDb(),
    {
      consentConfirmed: f.get("consentConfirmed") === "on",
      noticeConfirmed: f.get("noticeConfirmed") === "on",
      assessmentConfirmed: f.get("assessmentConfirmed") === "on",
      retentionMonths: months,
      confirmedAt: null,
    },
    s.user.id,
  );
  revalidatePath("/admin/privacy");
  return { ok: true, message: "Opgeslagen." };
}
