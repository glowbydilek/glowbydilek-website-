import Link from "next/link";
import { ActionForm } from "@/components/private/ActionForm";
import { Badge, Card, LinkButton, Notice, PageHeader, SubmitButton } from "@/components/private/ui";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listTemplates } from "@/lib/intake/service";
import { newRevisionAction } from "@/lib/private/intakeActions";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Intakeformulier" };

const LANG = { nl: "Nederlands", en: "English" } as const;
const STATUS = { active: ["Actief", "confirmed"], draft: ["Concept", "pending"], retired: ["Vorige versie", "neutral"] } as const;

export default async function IntakeTemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireOwner("agenda", "/agenda/intake");
  const sp = await searchParams;
  const rows = await listTemplates(getDb());
  return (
    <>
      <PageHeader
        title="Intake & toestemming"
        subtitle="Eén formulier per taal voor alle behandelingen. Print het, laat de klant tekenen en bewaar de ondertekende versie bij de klant."
      />
      {sp.verwijderd && <div className="mb-4"><Notice tone="success">✓ Het concept is verwijderd.</Notice></div>}
      <div className="mb-5">
        <Notice tone="warning">
          Dit formulier is een concept van de eigenaar en is <strong>niet juridisch gecontroleerd</strong>. Laat de tekst en de bewaartermijn beoordelen (AVG, gezondheidsgegevens) voordat je ondertekende formulieren gaat bewaren.
        </Notice>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {(["nl", "en"] as const).map((locale) => {
          const list = rows.filter((r) => r.locale === locale);
          const active = list.find((r) => r.status === "active");
          return (
            <Card key={locale} title={LANG[locale]}>
              {active && (
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/agenda/intake-afdruk/${active.id}`} variant="primary">Afdrukken (A4)</LinkButton>
                  <LinkButton href={`/agenda/intake/${active.id}/pdf`}>PDF downloaden</LinkButton>
                </div>
              )}
              <ul className="mt-4 divide-y divide-line text-sm">
                {list.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <Link href={`/agenda/intake/${t.id}`} className="font-medium underline-offset-4 hover:underline">{t.version}</Link>
                    <span className="flex items-center gap-2 text-muted">
                      <Badge tone={STATUS[t.status as keyof typeof STATUS]?.[1] ?? "neutral"}>{STATUS[t.status as keyof typeof STATUS]?.[0] ?? t.status}</Badge>
                      {t.activatedAt ? formatLocal(t.activatedAt, "nl", { day: "numeric", month: "short", year: "numeric" }) : "nog niet actief"}
                    </span>
                    {t.changeNote && <span className="w-full text-xs text-muted">{t.changeNote}</span>}
                  </li>
                ))}
              </ul>
              <ActionForm action={newRevisionAction} className="mt-4">
                <input type="hidden" name="locale" value={locale} />
                <SubmitButton variant="outline" pending="Bezig…">{list.some((t) => t.status === "draft") ? "Concept verder bewerken" : "Nieuwe revisie maken"}</SubmitButton>
              </ActionForm>
            </Card>
          );
        })}
      </div>
    </>
  );
}
