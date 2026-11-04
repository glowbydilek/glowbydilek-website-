import type { Metadata } from "next";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { InviteForm, StaffEditor } from "@/components/private/staff/StaffForms";
import { PERM_LABEL, permissionsOf, ROLE_LABEL, type Role } from "@/lib/auth/permissions";
import { requireOwner } from "@/lib/auth/session";
import { listStaff } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/client";
import { formatLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Medewerkers & rechten" };

/** Owner only: individual accounts for staff, with least-privilege rights. */
export default async function StaffPage() {
  await requireOwner("admin");
  const people = await listStaff(getDb());
  const others = people.filter((p) => p.role !== "owner");
  return (
    <>
      <PageHeader
        title="Medewerkers & rechten"
        subtitle="Geef iedereen een eigen account — deel nooit je eigen wachtwoord. Een medewerker ziet alleen wat bij haar rol hoort."
      />
      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <Card title="Iemand uitnodigen">
          <InviteForm />
        </Card>
        <Card title="Wat mag elke rol?">
          <ul className="space-y-3 text-sm">
            {(["staff", "manager", "editor"] as const).map((r) => (
              <li key={r}>
                <strong>{ROLE_LABEL[r]}</strong>: {[...permissionsOf({ role: r, mfa: false })].map((p) => PERM_LABEL[p].toLowerCase()).join(" · ")}.
              </li>
            ))}
            <li className="text-muted">Alleen jij (eigenaar) beheert website-instellingen, SEO, analytics, beveiliging, back-ups, juridische teksten, factuurinstellingen en deze pagina.</li>
          </ul>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 font-serif text-2xl">Accounts ({others.length})</h2>
      {others.length === 0 && <Notice>Er zijn nog geen andere accounts. Alleen jij hebt toegang.</Notice>}
      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        {others.map((u) => (
          <Card
            key={u.id}
            title={u.name || u.email}
            actions={
              <span className="flex flex-wrap gap-1.5">
                <Badge tone="neutral">{ROLE_LABEL[u.role as Role] ?? u.role}</Badge>
                {u.disabled ? <Badge tone="neutral">Uitgezet</Badge> : !u.hasPassword ? <Badge tone="neutral">Uitgenodigd</Badge> : <Badge tone="confirmed">Actief</Badge>}
                {u.mfaEnabled && <Badge tone="confirmed">2FA</Badge>}
              </span>
            }
          >
            <p className="mb-4 text-sm text-muted">
              {u.email} · laatst ingelogd: {u.lastLoginAt ? formatLocal(u.lastLoginAt, "nl", { dateStyle: "medium", timeStyle: "short" }) : "nog niet"}
            </p>
            <StaffEditor u={u} />
          </Card>
        ))}
      </div>
    </>
  );
}
