"use client";

import { useActionState, useState } from "react";
import { changePasswordAction, confirmMfaAction, disableMfaAction, startMfaAction, type FormState } from "@/lib/private/authActions";
import { ActionForm } from "./ActionForm";
import { Button, Field, Input, Notice, SubmitButton } from "./ui";

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess>
      <Field label="Huidig wachtwoord"><Input type="password" name="current" autoComplete="current-password" required /></Field>
      <Field label="Nieuw wachtwoord" hint="Minimaal 12 tekens."><Input type="password" name="password" autoComplete="new-password" required minLength={12} /></Field>
      <Field label="Herhaal nieuw wachtwoord"><Input type="password" name="confirm" autoComplete="new-password" required minLength={12} /></Field>
      <SubmitButton>Wachtwoord wijzigen</SubmitButton>
    </ActionForm>
  );
}

export function MfaSetup({ enabled, remaining }: { enabled: boolean; remaining: number }) {
  const [setup, setSetup] = useState<{ uri: string; secret: string; qr: string } | null>(null);
  const [state, confirm] = useActionState<FormState, FormData>(confirmMfaAction, {});
  const [busy, setBusy] = useState(false);
  const codes = state.data?.recoveryCodes as string[] | undefined;

  if (codes) {
    return (
      <div className="space-y-3">
        <Notice tone="success">Tweestapsverificatie staat aan.</Notice>
        <p className="text-sm">
          <strong>Bewaar deze herstelcodes nu</strong> op een veilige plek (bijvoorbeeld uitgeprint of in een wachtwoordmanager). Elke code werkt één keer als je je telefoon niet bij de hand hebt. Ze worden maar één keer getoond.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-4 font-mono text-sm">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
        <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}>Kopiëren</Button>
      </div>
    );
  }
  if (enabled) {
    return (
      <div className="space-y-3">
        <Notice tone="success">Tweestapsverificatie staat aan. Nog {remaining} ongebruikte herstelcodes.</Notice>
        <details className="rounded-xl border border-line p-3">
          <summary className="cursor-pointer text-sm">Uitschakelen</summary>
          <ActionForm action={disableMfaAction} className="mt-3 space-y-3">
            <Field label="Bevestig met je wachtwoord"><Input type="password" name="password" required autoComplete="current-password" /></Field>
            <SubmitButton variant="danger" confirm="Tweestapsverificatie uitschakelen?">Uitschakelen</SubmitButton>
          </ActionForm>
        </details>
      </div>
    );
  }
  if (!setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Gebruik een authenticator-app (bijv. de ingebouwde codes in iPhone-wachtwoorden, Google Authenticator of Microsoft Authenticator). Na het inloggen vraagt de site dan om een code van zes cijfers.</p>
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await startMfaAction();
            const QR = await import("qrcode");
            const uri = String(r.data?.uri ?? "");
            setSetup({ uri, secret: String(r.data?.secret ?? ""), qr: await QR.toString(uri, { type: "svg", margin: 1, width: 220 }) });
            setBusy(false);
          }}
        >
          Tweestapsverificatie instellen
        </Button>
      </div>
    );
  }
  return (
    <form action={confirm} className="space-y-4">
      <p className="text-sm">1. Scan deze QR-code met je authenticator-app (of tik op de link op je iPhone).</p>
      <div className="w-56 rounded-xl border border-line bg-white p-2" dangerouslySetInnerHTML={{ __html: setup.qr }} />
      <a href={setup.uri} className="text-sm text-accent-deep underline">Open in authenticator-app</a>
      <p className="text-sm text-muted">Of voer deze sleutel handmatig in: <code className="break-all">{setup.secret}</code></p>
      <Field label="2. Vul de code van zes cijfers in"><Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required /></Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <SubmitButton>Bevestigen en inschakelen</SubmitButton>
    </form>
  );
}
