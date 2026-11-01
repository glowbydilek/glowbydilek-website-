import { notFound } from "next/navigation";
import { ActionForm } from "@/components/private/ActionForm";
import { IntakeSheet } from "@/components/private/intake/IntakeSheet";
import { Badge, Card, Field, Input, LinkButton, Notice, PageHeader, SubmitButton, Textarea } from "@/components/private/ui";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getTemplate } from "@/lib/intake/service";
import { deleteDraftAction, saveDraftAction } from "@/lib/private/intakeActions";

export const metadata = { title: "Intakeformulier" };

const HELP = [
  ["= Titel", "titel bovenaan"],
  ["# Kop", "kop van een onderdeel"],
  ["> Tekst", "uitleg"],
  ["! Tekst", "opvallende opmerking"],
  ["- Label", "kort invulveld"],
  ["[] Optie", "aankruisvakje (eindig met : voor een invullijn)"],
  ["?? Groep", "titel boven vragen"],
  ["? Vraag", "vraag met Ja / Nee / Weet niet"],
  ["_ Label", "brede invullijn"],
  ["* Zin", "toestemmingsvakje"],
  ["~ Label | Label", "handtekeningregel"],
  ["---", "nieuwe pagina"],
  ["{version}", "versienummer"],
];

export default async function IntakeTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await requireOwner("agenda", `/agenda/intake/${id}`);
  const t = await getTemplate(getDb(), id);
  if (!t) notFound();
  const locale = t.locale === "en" ? "en" : "nl";
  const draft = t.status === "draft";
  return (
    <>
      <PageHeader
        title={`${t.version} · ${locale === "nl" ? "Nederlands" : "English"}`}
        subtitle={draft ? "Concept: pas de tekst aan en activeer de versie als hij klaar is." : "Vastgelegde versie: alleen-lezen, zodat elk ondertekend formulier herleidbaar blijft."}
        actions={
          <>
            <Badge tone={draft ? "pending" : t.status === "active" ? "confirmed" : "neutral"}>{draft ? "Concept" : t.status === "active" ? "Actief" : "Vorige versie"}</Badge>
            <LinkButton href={`/agenda/intake-afdruk/${t.id}`}>Afdrukken (A4)</LinkButton>
            <LinkButton href={`/agenda/intake/${t.id}/pdf`}>PDF</LinkButton>
          </>
        }
      />
      <div className="grid [&>*]:min-w-0 gap-5 xl:grid-cols-[1fr_1fr]">
        {draft ? (
          <Card title="Tekst bewerken">
            <ActionForm action={saveDraftAction}>
              <input type="hidden" name="id" value={t.id} />
              <Field label="Formulier" htmlFor="source" hint="Elke regel begint met een teken dat bepaalt hoe hij wordt afgedrukt (zie hieronder).">
                <Textarea id="source" name="source" defaultValue={t.source} rows={28} className="font-mono text-[0.8rem]" spellCheck={false} />
              </Field>
              <Field label="Wat is er veranderd?" htmlFor="changeNote" hint="Verplicht voor activeren; komt in de versiegeschiedenis.">
                <Input id="changeNote" name="changeNote" defaultValue={t.changeNote ?? ""} maxLength={300} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <SubmitButton name="intent" value="save" pending="Opslaan…">Concept opslaan</SubmitButton>
                <SubmitButton name="intent" value="activate" variant="outline" pending="Activeren…" confirm="Deze versie wordt het actieve formulier. De huidige versie blijft bewaard als vorige versie. Doorgaan?">
                  Opslaan en activeren
                </SubmitButton>
              </div>
            </ActionForm>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-medium">Opmaaktekens</summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {HELP.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-mono text-xs">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </details>
            <ActionForm action={deleteDraftAction} className="mt-5 border-t border-line pt-4">
              <input type="hidden" name="id" value={t.id} />
              <SubmitButton variant="outline" pending="Verwijderen…" confirm="Dit concept verwijderen?">Concept verwijderen</SubmitButton>
            </ActionForm>
          </Card>
        ) : (
          <Card title="Over deze versie">
            <p className="text-sm text-muted">{t.changeNote ?? "—"}</p>
            <div className="mt-4">
              <Notice>Wil je iets aanpassen? Maak via Intakeformulier een nieuwe revisie. Ondertekende formulieren houden altijd hun eigen versie.</Notice>
            </div>
          </Card>
        )}
        <div className="overflow-x-auto rounded-2xl bg-surface p-3 sm:p-5">
          <IntakeSheet source={t.source} version={t.version} locale={locale} />
        </div>
      </div>
    </>
  );
}
