"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Turnstile } from "@/components/forms/Turnstile";
import { loginAction, type FormState } from "@/lib/private/authActions";
import { Field, Input, Notice, SubmitButton } from "../ui";

export function LoginForm({ area, next, siteKey, captcha, notice }: { area: "admin" | "ajanda"; next?: string; siteKey: string; captcha: boolean; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  const [token, setToken] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  return (
    <form action={(fd) => { action(fd); setReset((r) => r + 1); }} className="space-y-4">
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="turnstileToken" value={token ?? ""} />
      {notice && <Notice tone="success">{notice}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="E-mailadres" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required inputMode="email" defaultValue="hello@glowbydilek.nl" />
      </Field>
      <Field label="Wachtwoord" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {captcha && (
        <Turnstile
          siteKey={siteKey}
          action="login"
          locale="nl"
          resetKey={reset}
          onToken={setToken}
          labels={{ title: "Beveiligingscontrole", loading: "Beveiligingscontrole wordt geladen…", blocked: "De beveiligingscontrole kon niet laden.", email: "hello@glowbydilek.nl" }}
        />
      )}
      <SubmitButton className="w-full" pending="Bezig met inloggen…">
        Inloggen
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href={`/${area}/wachtwoord-vergeten`} className="text-gold-deep underline underline-offset-4">
          Wachtwoord vergeten?
        </Link>
      </p>
    </form>
  );
}
