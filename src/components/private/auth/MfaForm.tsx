"use client";

import { useActionState } from "react";
import { mfaAction, type FormState } from "@/lib/private/authActions";
import { Field, Input, Notice, SubmitButton } from "../ui";

export function MfaForm({ area, next }: { area: "admin" | "ajanda"; next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(mfaAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="next" value={next ?? ""} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Code uit je authenticator-app" hint="Zes cijfers. Geen telefoon bij de hand? Vul een van je herstelcodes in." htmlFor="code">
        <Input id="code" name="code" autoComplete="one-time-code" inputMode="text" required autoFocus maxLength={11} className="text-center text-xl tracking-[0.3em]" />
      </Field>
      <SubmitButton className="w-full">Bevestigen</SubmitButton>
    </form>
  );
}
