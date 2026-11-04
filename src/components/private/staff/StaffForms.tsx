"use client";

import { useState } from "react";
import { DELEGABLE, NEEDS_MFA, PERM_LABEL, ROLE_LABEL, type Perm, type Role } from "@/lib/auth/permissions";
import { staffAction } from "@/lib/private/staffActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton } from "../ui";

type Assignable = Exclude<Role, "owner">;
const ROLE_HELP: Record<Assignable, string> = {
  manager: "Agenda en klantgegevens. Extra rechten zet je hieronder zelf aan.",
  staff: "Alleen de agenda en de contactgegevens die nodig zijn voor afspraken.",
  editor: "Alleen websiteteksten als concept bewerken. Jij publiceert.",
};

function RoleAndRights({ role, setRole, perms }: { role: Assignable; setRole: (r: Assignable) => void; perms: Perm[] }) {
  return (
    <>
      <Field label="Rol" hint={ROLE_HELP[role]}>
        <Select name="role" value={role} onChange={(e) => setRole(e.target.value as Assignable)}>
          {(["staff", "manager", "editor"] as const).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
      </Field>
      {DELEGABLE[role].length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Extra rechten (optioneel)</legend>
          {DELEGABLE[role].map((p) => (
            <label key={p} className="flex min-h-11 items-start gap-3 text-sm">
              <input type="checkbox" name="perm" value={p} defaultChecked={perms.includes(p)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]" />
              <span>
                {PERM_LABEL[p]}
                {NEEDS_MFA.includes(p) && <span className="block text-xs text-muted">Werkt pas als deze persoon tweestapsverificatie heeft aangezet.</span>}
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </>
  );
}

export function InviteForm() {
  const [role, setRole] = useState<Assignable>("staff");
  return (
    <ActionForm action={staffAction} resetOnSuccess>
      <input type="hidden" name="op" value="invite" />
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Naam">
          <Input name="name" required maxLength={120} autoComplete="off" />
        </Field>
        <Field label="E-mailadres" hint="Hier komt de uitnodiging binnen.">
          <Input name="email" type="email" required maxLength={190} autoComplete="off" />
        </Field>
      </div>
      <RoleAndRights role={role} setRole={setRole} perms={[]} />
      <SubmitButton pending="Bezig…">Uitnodiging versturen</SubmitButton>
    </ActionForm>
  );
}

export function StaffEditor({ u }: { u: { id: number; name: string; role: string; disabled: boolean; delegations: Perm[] } }) {
  const [role, setRole] = useState<Assignable>((["staff", "manager", "editor"].includes(u.role) ? u.role : "staff") as Assignable);
  return (
    <div className="space-y-4">
      <ActionForm action={staffAction}>
        <input type="hidden" name="op" value="update" />
        <input type="hidden" name="id" value={u.id} />
        <Field label="Naam">
          <Input name="name" defaultValue={u.name} maxLength={120} />
        </Field>
        <RoleAndRights role={role} setRole={setRole} perms={u.delegations} />
        <SubmitButton>Opslaan</SubmitButton>
      </ActionForm>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <ActionForm action={staffAction} className="contents">
          <input type="hidden" name="op" value="reinvite" />
          <input type="hidden" name="id" value={u.id} />
          <SubmitButton variant="outline">Opnieuw uitnodigen</SubmitButton>
        </ActionForm>
        <ActionForm action={staffAction} className="contents">
          <input type="hidden" name="op" value="signout" />
          <input type="hidden" name="id" value={u.id} />
          <SubmitButton variant="outline">Overal uitloggen</SubmitButton>
        </ActionForm>
        <ActionForm action={staffAction} className="contents">
          <input type="hidden" name="op" value={u.disabled ? "enable" : "disable"} />
          <input type="hidden" name="id" value={u.id} />
          <SubmitButton variant="outline" confirm={u.disabled ? undefined : "Account uitzetten? Deze persoon kan dan niet meer inloggen."}>
            {u.disabled ? "Account weer aanzetten" : "Account uitzetten"}
          </SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
