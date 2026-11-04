"use server";

import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "../auth/mail";
import { ROLE_LABEL, type Role } from "../auth/permissions";
import { assertOwner } from "../auth/session";
import { inviteStaff, reinviteStaff, revokeStaffSessions, setStaffDisabled, StaffError, updateStaff } from "../auth/staff";
import { getDb } from "../db/client";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
/** Editors only work in the website admin; everyone else starts in the agenda. */
const areaFor = (role: string) => (role === "editor" ? "admin" : "agenda");

async function invite(email: string, name: string, token: string, role: string): Promise<string> {
  try {
    await sendInviteEmail(email, name, token, areaFor(role), ROLE_LABEL[role as Role] ?? role);
    return `Uitnodiging verstuurd naar ${email}. De link is 48 uur geldig.`;
  } catch (err) {
    console.error("[staff] invitation email could not be sent:", (err as { code?: string })?.code ?? "error");
    return "Het account is aangemaakt, maar de uitnodiging kon niet worden verstuurd (e-mail nog niet ingesteld?). Probeer later ‘Opnieuw uitnodigen’.";
  }
}

/** Owner only: invite, change rights, disable, sign out. */
export async function staffAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const op = str(f, "op");
  const id = Number(f.get("id"));
  try {
    if (op === "invite") {
      const r = await inviteStaff(db, { email: str(f, "email"), name: str(f, "name"), role: str(f, "role"), delegations: f.getAll("perm").map(String) }, s.user.id);
      const message = await invite(r.user.email, r.user.name, r.token, r.user.role);
      revalidatePath("/admin/medewerkers");
      return { ok: true, message };
    }
    if (op === "update") {
      await updateStaff(db, id, { name: str(f, "name"), role: str(f, "role"), delegations: f.getAll("perm").map(String) }, s.user.id);
      revalidatePath("/admin/medewerkers");
      return { ok: true, message: "Wijzigingen opgeslagen." };
    }
    if (op === "reinvite") {
      const r = await reinviteStaff(db, id, s.user.id);
      return { ok: true, message: await invite(r.user.email, r.user.name, r.token, r.user.role) };
    }
    if (op === "disable" || op === "enable") {
      await setStaffDisabled(db, id, op === "disable", s.user.id);
      revalidatePath("/admin/medewerkers");
      return { ok: true, message: op === "disable" ? "Account uitgezet en overal uitgelogd." : "Account weer aangezet." };
    }
    if (op === "signout") {
      await revokeStaffSessions(db, id, s.user.id);
      return { ok: true, message: "Overal uitgelogd." };
    }
    return { error: "Onbekende actie." };
  } catch (err) {
    if (err instanceof StaffError) return { error: err.message };
    console.error("[staff] action failed:", (err as { code?: string })?.code ?? "error");
    return { error: "Opslaan lukte niet. Probeer het opnieuw." };
  }
}
