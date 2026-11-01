import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { ChangePasswordForm, MfaSetup } from "@/components/private/SecurityForms";
import { Card, PageHeader, SubmitButton } from "@/components/private/ui";
import { logoutEverywhereAction } from "@/lib/private/authActions";
import { remainingRecoveryCodes } from "@/lib/auth/service";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { auditLogs, sessions } from "@/lib/db/schema";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Beveiliging" };

const ACTION_NL: Record<string, string> = {
  "auth.login": "Ingelogd",
  "auth.login_failed": "Mislukte inlogpoging",
  "auth.password_reset": "Wachtwoord opnieuw ingesteld",
  "auth.reset_requested": "Herstellink aangevraagd",
  "auth.password_changed": "Wachtwoord gewijzigd",
  "auth.mfa_enabled": "Tweestapsverificatie ingeschakeld",
  "auth.mfa_disabled": "Tweestapsverificatie uitgeschakeld",
  "auth.account_locked": "Account tijdelijk geblokkeerd",
  "auth.login_recovery_code": "Ingelogd met herstelcode",
  "auth.mfa_failed": "Verkeerde verificatiecode",
  "auth.logout_all": "Overal uitgelogd",
};

export default async function Security() {
  const s = await requireOwner("admin");
  const db = getDb();
  const [remaining, active, log] = await Promise.all([
    remainingRecoveryCodes(db, s.user.id),
    db.select().from(sessions).where(and(eq(sessions.userId, s.user.id), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).orderBy(desc(sessions.lastSeenAt)),
    db.select().from(auditLogs).where(eq(auditLogs.userId, s.user.id)).orderBy(desc(auditLogs.createdAt)).limit(25),
  ]);
  return (
    <>
      <PageHeader title="Beveiliging" subtitle={`Account: ${s.user.email}. Dit account geeft toegang tot zowel Admin als Agenda.`} />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-2">
        <Card title="Tweestapsverificatie"><MfaSetup enabled={s.user.mfaEnabled} remaining={remaining} /></Card>
        <Card title="Wachtwoord wijzigen"><ChangePasswordForm /></Card>
        <Card title={`Actieve sessies (${active.length})`}>
          <ul className="space-y-2 text-sm">
            {active.map((x) => (
              <li key={x.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{x.id === s.sessionId ? "Dit apparaat" : (x.userAgent ?? "Onbekend apparaat").slice(0, 60)}</span>
                <span className="shrink-0 text-xs text-muted">{formatLocal(x.lastSeenAt, "nl", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
          <form action={logoutEverywhereAction} className="mt-4">
            <SubmitButton variant="outline" confirm="Op alle apparaten uitloggen, ook op dit apparaat?">Overal uitloggen</SubmitButton>
          </form>
          <p className="mt-2 text-xs text-muted">Gebruik dit als een telefoon of computer kwijt is. Vermoed je dat iemand je wachtwoord kent? Wijzig dan ook je wachtwoord.</p>
        </Card>
        <Card title="Recente beveiligingsgebeurtenissen">
          <ul className="space-y-1.5 text-sm">
            {log.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>{ACTION_NL[l.action] ?? l.action}</span>
                <span className="shrink-0 text-xs text-muted">{formatLocal(l.createdAt, "nl", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
