"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { activateDraft, createRevision, deleteDraft, deleteIntakeDocument, IntakeError, saveDraft, uploadSignedIntake } from "../intake/service";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const who = (s: Awaited<ReturnType<typeof assertOwner>>) => ({ userId: s.user.id, mfa: s.user.mfaEnabled && s.mfaPassed });

async function guard(run: () => Promise<FormState | void>): Promise<FormState> {
  try {
    return (await run()) ?? { ok: true };
  } catch (err) {
    if (err instanceof IntakeError) return { error: err.message };
    throw err;
  }
}

export async function newRevisionAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const locale = str(f, "locale") === "en" ? "en" : "nl";
  let id = 0;
  const r = await guard(async () => {
    id = await createRevision(getDb(), locale, s.user.id);
  });
  if (r.error) return r;
  redirect(`/agenda/intake/${id}`);
}

export async function saveDraftAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const r = await guard(async () => {
    await saveDraft(getDb(), id, String(f.get("source") ?? ""), str(f, "changeNote"), s.user.id);
    if (str(f, "intent") === "activate") await activateDraft(getDb(), id, s.user.id);
  });
  if (r.error) return r;
  revalidatePath("/agenda/intake");
  revalidatePath(`/agenda/intake/${id}`);
  return { ok: true, message: str(f, "intent") === "activate" ? "Deze versie is nu actief. De vorige versie blijft bewaard." : "Concept opgeslagen." };
}

export async function deleteDraftAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const r = await guard(() => deleteDraft(getDb(), Number(f.get("id")), s.user.id));
  if (r.error) return r;
  redirect("/agenda/intake?verwijderd=1");
}

export async function uploadIntakeAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const customerId = Number(f.get("customerId"));
  const file = f.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Kies een foto of PDF van het ondertekende formulier." };
  const r = await guard(async () => {
    await uploadSignedIntake(
      getDb(),
      {
        customerId,
        file,
        signedOn: str(f, "signedOn"),
        templateVersion: str(f, "version").split("|")[1] ?? "",
        locale: str(f, "version").split("|")[0] === "en" ? "en" : "nl",
        note: str(f, "note"),
        consentGiven: f.get("consent") === "on",
      },
      who(s),
    );
  });
  if (r.error) return r;
  revalidatePath(`/agenda/klanten/${customerId}`);
  return { ok: true, message: "Versleuteld opgeslagen. Een eerdere versie blijft als geschiedenis bewaard." };
}

export async function deleteIntakeDocumentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const customerId = Number(f.get("customerId"));
  const r = await guard(() => deleteIntakeDocument(getDb(), customerId, Number(f.get("id")), str(f, "reason"), who(s)));
  if (r.error) return r;
  revalidatePath(`/agenda/klanten/${customerId}`);
  return { ok: true, message: "Het bestand is verwijderd; alleen de registratie (zonder gezondheidsgegevens) blijft bewaard." };
}
