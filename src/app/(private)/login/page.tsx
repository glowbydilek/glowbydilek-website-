import type { Metadata } from "next";
import Link from "next/link";
import { ensureOwner } from "@/lib/auth/service";
import { currentSession } from "@/lib/auth/session";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { turnstileConfig, turnstileSiteKey } from "@/lib/forms/turnstile";
import { logoutAction } from "@/lib/private/authActions";
import { AuthShell } from "@/components/private/auth/AuthShell";
import { LoginForm } from "@/components/private/auth/LoginForm";
import { PanelIcon } from "@/components/private/PanelIcon";
import { Notice } from "@/components/private/ui";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Inloggen" };

const LABEL = "Glow by Dilek — Beheer";

/**
 * One front door for the owner. Signed out: the login form. Signed in: a
 * choice between website management and the agenda. Both areas keep their
 * own server-side authorization; this page only routes.
 */
export default async function CentralLogin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!databaseConfigured()) {
    return (
      <AuthShell area="agenda" title="Nog niet gekoppeld" label={LABEL}>
        <Notice tone="warning">De database is nog niet gekoppeld (DATABASE_URL). Volg docs/DEPLOYMENT.md om de beheeromgeving te activeren.</Notice>
      </AuthShell>
    );
  }
  const sp = await searchParams;
  const s = await currentSession();
  if (s && s.mfaRequired && !s.mfaPassed) redirect("/agenda/login/verificatie?next=%2Flogin");
  if (s) {
    const choices = [
      { href: "/admin", icon: "pages" as const, title: "Websitebeheer", text: "Teksten, behandelingen, prijzen, foto's, thema en instellingen van de website." },
      { href: "/agenda", icon: "calendar" as const, title: "Agenda", text: "Afspraken, aanvragen, klanten, betalingen en facturen." },
    ];
    return (
      <AuthShell area="agenda" title="Waar wil je naartoe?" label={LABEL}>
        <ul className="space-y-3">
          {choices.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="flex items-start gap-4 rounded-xl border border-line p-4 transition-colors hover:border-accent hover:bg-paper focus-visible:outline-2 focus-visible:outline-accent">
                <span className="mt-0.5 text-accent-deep"><PanelIcon name={c.icon} /></span>
                <span>
                  <span className="block font-medium text-ink">{c.title}</span>
                  <span className="mt-1 block text-sm text-muted">{c.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <form action={logoutAction} className="mt-5 text-center">
          <input type="hidden" name="area" value="agenda" />
          <button className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-ink">Uitloggen</button>
        </form>
      </AuthShell>
    );
  }
  await ensureOwner(getDb());
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const notice = one(sp.reset) ? "Je wachtwoord is opgeslagen. Log in met je nieuwe wachtwoord." : one(sp.uitgelogd) ? "Je bent uitgelogd." : undefined;
  return (
    <AuthShell area="agenda" title="Inloggen" label={LABEL}>
      <LoginForm area="agenda" next="/login" siteKey={turnstileSiteKey()} captcha={turnstileConfig().mode !== "missing"} notice={notice} />
    </AuthShell>
  );
}
