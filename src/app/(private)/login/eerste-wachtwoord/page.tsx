import type { Metadata } from "next";
import Link from "next/link";
import { setupTokenEnabled } from "@/lib/auth/service";
import { AuthShell } from "@/components/private/auth/AuthShell";
import { SetupForm } from "@/components/private/auth/SetupForm";
import { Notice } from "@/components/private/ui";

export const metadata: Metadata = { title: "Eerste wachtwoord", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function FirstPasswordPage() {
  return (
    <AuthShell area="agenda" title="Eerste wachtwoord instellen" label="Glow by Dilek — Beheer">
      {setupTokenEnabled() ? (
        <SetupForm />
      ) : (
        <div className="space-y-4">
          <Notice>
            Kies je eerste wachtwoord via <Link href="/agenda/login/wachtwoord-vergeten" className="underline">Wachtwoord vergeten?</Link> (je krijgt een e-mail).
            Werkt e-mail nog niet? Zet dan in Hostinger tijdelijk de variabele <code>OWNER_SETUP_TOKEN</code> (minimaal 24 willekeurige tekens) en bouw opnieuw; dan verschijnt hier een formulier.
          </Notice>
          <Link href="/login/status" className="block text-center text-sm text-accent-deep underline underline-offset-4">Systeemstatus bekijken</Link>
        </div>
      )}
    </AuthShell>
  );
}
