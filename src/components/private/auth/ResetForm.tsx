"use client";

import { useActionState } from "react";
import { resetAction, type FormState } from "@/lib/private/authActions";
import { Field, Input, Notice, SubmitButton } from "../ui";

export function ResetForm({ area, token }: { area: "admin" | "agenda"; token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="token" value={token} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Nieuw wachtwoord" hint="Minimaal 12 tekens. Een zin van een paar woorden werkt goed." htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <Field label="Herhaal het nieuwe wachtwoord" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <SubmitButton className="w-full" pending="Bezig met opslaan…">
        Wachtwoord opslaan
      </SubmitButton>
      <p className="text-xs leading-relaxed text-muted">Na het opslaan word je op alle apparaten uitgelogd en log je opnieuw in.</p>
    </form>
  );
}
