"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Turnstile } from "@/components/forms/Turnstile";
import { forgotAction, type FormState } from "@/lib/private/authActions";
import { Field, Input, Notice, SubmitButton } from "../ui";

export function ForgotForm({ area, siteKey, captcha }: { area: "admin" | "agenda"; siteKey: string; captcha: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(forgotAction, {});
  const [token, setToken] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  if (state.ok) {
    return (
      <div className="space-y-4">
        <Notice tone="success">{state.message}</Notice>
        <Link href={`/${area}/login`} className="block text-center text-sm text-accent-deep underline underline-offset-4">
          Terug naar inloggen
        </Link>
      </div>
    );
  }
  return (
    <form action={(fd) => { action(fd); setReset((r) => r + 1); }} className="space-y-4">
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="turnstileToken" value={token ?? ""} />
      <p className="text-sm leading-relaxed text-muted">
        Vul het e-mailadres van je account in. Je ontvangt een link om een nieuw wachtwoord te kiezen. Eerste keer? Gebruik dit formulier ook om je wachtwoord in te stellen.
      </p>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="E-mailadres" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required inputMode="email" />
      </Field>
      {captcha && (
        <Turnstile
          siteKey={siteKey}
          action="reset"
          locale="nl"
          resetKey={reset}
          onToken={setToken}
          labels={{ title: "Beveiligingscontrole", loading: "Beveiligingscontrole wordt geladen…", blocked: "De beveiligingscontrole kon niet laden.", email: "hello@glowbydilek.nl" }}
        />
      )}
      <SubmitButton className="w-full" pending="Bezig…">
        Stuur mij een link
      </SubmitButton>
      <Link href={`/${area}/login`} className="block text-center text-sm text-accent-deep underline underline-offset-4">
        Terug naar inloggen
      </Link>
    </form>
  );
}
