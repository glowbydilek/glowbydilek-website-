"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import { getDb } from "../db/client";
import { dismiss, markRead, removeDevice } from "../notify/service";

export async function markAllReadAction() {
  await assertOwner();
  await markRead(getDb(), "all");
  revalidatePath("/agenda/meldingen");
}

export async function dismissAction(form: FormData) {
  await assertOwner();
  const id = Number(form.get("id"));
  if (Number.isInteger(id) && id > 0) await dismiss(getDb(), id);
  revalidatePath("/agenda/meldingen");
}

export async function removeDeviceAction(form: FormData) {
  const s = await assertOwner();
  const id = Number(form.get("id"));
  if (Number.isInteger(id) && id > 0) await removeDevice(getDb(), s.user.id, id);
  revalidatePath("/agenda/meldingen");
}
