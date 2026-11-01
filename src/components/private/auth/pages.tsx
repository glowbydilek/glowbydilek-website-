import Link from "next/link";
import { redirect } from "next/navigation";
import { checkResetToken, ensureOwner } from "@/lib/auth/service";
import { currentSession, safeNext, type Area } from "@/lib/auth/session";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { turnstileConfig, turnstileSiteKey } from "@/lib/forms/turnstile";
import { Notice } from "../ui";
import { AuthShell } from "./AuthShell";
import { ForgotForm } from "./ForgotForm";
import { LoginForm } from "./LoginForm";
import { MfaForm } from "./MfaForm";
import { ResetForm } from "./ResetForm";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const captcha = () => turnstileConfig().mode !== "missing";

function NoDb({ area }: { area: Area }) {
  return (
    <AuthShell area={area} title="Nog niet gekoppeld">
      <Notice tone="warning">De database is nog niet gekoppeld (DATABASE_URL). Volg docs/DEPLOYMENT.md om de beheeromgeving te activeren.</Notice>
    </AuthShell>
  );
}

export async function LoginPage({ area, searchParams }: { area: Area; searchParams: SP }) {
  if (!databaseConfigured()) return <NoDb area={area} />;
  const sp = await searchParams;
  const s = await currentSession();
  const next = safeNext(one(sp.next), area);
  if (s && (!s.mfaRequired || s.mfaPassed)) redirect(next);
  await ensureOwner(getDb());
  const notice = one(sp.reset) ? "Je wachtwoord is opgeslagen. Log in met je nieuwe wachtwoord." : one(sp.uitgelogd) ? "Je bent uitgelogd." : undefined;
  return (
    <AuthShell area={area} title="Inloggen">
      <LoginForm area={area} next={next} siteKey={turnstileSiteKey()} captcha={captcha()} notice={notice} />
    </AuthShell>
  );
}

export async function MfaPage({ area, searchParams }: { area: Area; searchParams: SP }) {
  if (!databaseConfigured()) return <NoDb area={area} />;
  const sp = await searchParams;
  const s = await currentSession();
  if (!s) redirect(`/${area}/login`);
  if (!s.mfaRequired || s.mfaPassed) redirect(safeNext(one(sp.next), area));
  return (
    <AuthShell area={area} title="Tweestapsverificatie">
      <MfaForm area={area} next={one(sp.next)} />
    </AuthShell>
  );
}

export async function ForgotPage({ area }: { area: Area }) {
  if (!databaseConfigured()) return <NoDb area={area} />;
  return (
    <AuthShell area={area} title="Wachtwoord vergeten?">
      <ForgotForm area={area} siteKey={turnstileSiteKey()} captcha={captcha()} />
    </AuthShell>
  );
}

export async function ResetPage({ area, searchParams }: { area: Area; searchParams: SP }) {
  if (!databaseConfigured()) return <NoDb area={area} />;
  const token = one((await searchParams).token) ?? "";
  const valid = token ? await checkResetToken(getDb(), token) : false;
  return (
    <AuthShell area={area} title="Nieuw wachtwoord">
      {valid ? (
        <ResetForm area={area} token={token} />
      ) : (
        <div className="space-y-4">
          <Notice tone="error">Deze link is verlopen of al gebruikt. Een link is 15 minuten geldig en werkt één keer.</Notice>
          <Link href={`/${area}/wachtwoord-vergeten`} className="block text-center text-sm text-gold-deep underline underline-offset-4">
            Vraag een nieuwe link aan
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
