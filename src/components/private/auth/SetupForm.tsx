"use client";

import { useActionState } from "react";
import { setupAction, type FormState } from "@/lib/private/authActions";
import { Field, Input, Notice, SubmitButton } from "../ui";

/** First password with the one-time OWNER_SETUP_TOKEN (works without email). */
export function SetupForm() {
  const [state, action] = useActionState<FormState, FormData>(setupAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="E-mailadres van het eigenaarsaccount" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required inputMode="email" />
      </Field>
      <Field label="Eenmalige instelcode" hint="De waarde van OWNER_SETUP_TOKEN die je zelf in Hostinger hebt ingesteld." htmlFor="token">
        <Input id="token" name="token" type="password" autoComplete="off" required minLength={24} />
      </Field>
      <Field label="Nieuw wachtwoord" hint="Minimaal 12 tekens. Een zin van een paar woorden werkt goed." htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <Field label="Herhaal het wachtwoord" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <SubmitButton className="w-full" pending="Bezig met opslaan…">
        Wachtwoord instellen
      </SubmitButton>
      <p className="text-xs leading-relaxed text-muted">Werkt alleen zolang er nog geen wachtwoord is. Verwijder daarna OWNER_SETUP_TOKEN in Hostinger en zet tweestapsverificatie aan.</p>
    </form>
  );
}
