import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AuthShell } from "@/components/private/auth/AuthShell";
import { systemStatus, type CheckState } from "@/lib/ops/status";

export const metadata: Metadata = { title: "Systeemstatus", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const DOT: Record<CheckState, { cls: string; label: string }> = {
  ok: { cls: "bg-[#2f7a4f]", label: "In orde" },
  warn: { cls: "bg-[#b7791f]", label: "Aandacht nodig" },
  fail: { cls: "bg-[#b4232c]", label: "Werkt niet" },
};

/**
 * Operator status: what is configured and working, in plain language.
 * No secret values, no personal data, no host names, no stack traces.
 */
export default async function StatusPage() {
  const h = await headers();
  const checks = await systemStatus(h.get("x-forwarded-host") || h.get("host"));
  const bad = checks.filter((c) => c.state === "fail").length;
  return (
    <AuthShell area="agenda" title="Systeemstatus" label="Glow by Dilek — Beheer">
      <p className="text-sm text-muted">{bad ? `${bad} onderdeel${bad === 1 ? "" : "en"} werkt nog niet. Inloggen lukt pas als database, sessiesleutel en het eigenaarsaccount in orde zijn.` : "Alle onderdelen die nodig zijn om in te loggen zijn in orde."}</p>
      <ul className="mt-4 divide-y divide-line">
        {checks.map((c) => (
          <li key={c.id} className="flex gap-3 py-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[c.state].cls}`} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">
                {c.label} <span className="sr-only">— {DOT[c.state].label}</span>
              </span>
              <span className="block text-sm leading-snug text-muted">{c.hint}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/login" className="text-accent-deep underline underline-offset-4">Naar inloggen</Link>
        <Link href="/login/eerste-wachtwoord" className="text-accent-deep underline underline-offset-4">Eerste wachtwoord</Link>
      </div>
    </AuthShell>
  );
}
