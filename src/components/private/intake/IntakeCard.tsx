import { ActionForm } from "@/components/private/ActionForm";
import { Badge, Card, Field, Input, LinkButton, Notice, Select, SubmitButton } from "@/components/private/ui";
import type { DB } from "@/lib/db/client";
import { INTAKE_ACCEPT } from "@/lib/intake/files";
import { intakeDocumentsFor, intakeStorageStatus, listTemplates } from "@/lib/intake/service";
import { deleteIntakeDocumentAction, uploadIntakeAction } from "@/lib/private/intakeActions";
import { formatLocal, todayLocal } from "@/lib/time";

const STATUS = { current: ["Huidig", "confirmed"], superseded: ["Eerdere versie", "neutral"], deleted: ["Bestand verwijderd", "cancelled"] } as const;
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} kB`);
const dateNl = (d: string) => d.split("-").reverse().join("-");

/** Signed intake & consent forms for one customer (metadata only; files via the private route). */
export async function IntakeCard({ db, customerId, mfa }: { db: DB; customerId: number; mfa: boolean }) {
  const [docs, status, templates] = await Promise.all([intakeDocumentsFor(db, customerId), intakeStorageStatus(db, mfa), listTemplates(db)]);
  const versions = templates.filter((t) => t.status !== "draft");
  const active = templates.filter((t) => t.status === "active");
  return (
    <Card title="Intake & toestemming (vertrouwelijk)">
      <div className="flex flex-wrap gap-2">
        {active.map((t) => (
          <LinkButton key={t.id} href={`/agenda/intake-afdruk/${t.id}`}>Formulier afdrukken ({t.locale.toUpperCase()})</LinkButton>
        ))}
      </div>
      {docs.length > 0 && (
        <ul className="mt-4 divide-y divide-line text-sm">
          {docs.map((d) => (
            <li key={d.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">Getekend {dateNl(d.signedOn)} · {d.templateVersion} ({d.locale.toUpperCase()})</span>
                <Badge tone={STATUS[d.status as keyof typeof STATUS]?.[1] ?? "neutral"}>{STATUS[d.status as keyof typeof STATUS]?.[0] ?? d.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                Geüpload {formatLocal(d.createdAt, "nl", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {d.status !== "deleted" && ` · ${d.mime.replace("application/", "").replace("image/", "").toUpperCase()} · ${kb(d.size)}${d.metadataStripped ? " · metadata (EXIF/GPS) verwijderd" : ""}`}
                {` · SHA-256 ${d.sha256.slice(0, 12)}…`}
              </p>
              {d.note && <p className="mt-1 text-xs">{d.note}</p>}
              {d.status === "deleted" ? (
                <p className="mt-1 text-xs text-muted">Reden: {d.deleteReason}</p>
              ) : (
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  {status.enabled && <a href={`/agenda/klanten/${customerId}/intake/${d.id}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-4 text-sm">Downloaden</a>}
                  <details className="text-xs">
                    <summary className="flex min-h-11 cursor-pointer items-center text-muted underline">Bestand verwijderen</summary>
                    <ActionForm action={deleteIntakeDocumentAction} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="customerId" value={customerId} />
                      <input type="hidden" name="id" value={d.id} />
                      <Field label="Reden" htmlFor={`reason-${d.id}`}>
                        <Select id={`reason-${d.id}`} name="reason" defaultValue="Toestemming ingetrokken">
                          <option>Toestemming ingetrokken</option>
                          <option>Bewaartermijn verstreken</option>
                          <option>Verkeerd bestand geüpload</option>
                        </Select>
                      </Field>
                      <SubmitButton variant="outline" pending="Verwijderen…" confirm="Het bestand wordt definitief verwijderd. Doorgaan?">Verwijderen</SubmitButton>
                    </ActionForm>
                  </details>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!docs.length && <p className="mt-4 text-sm text-muted">Nog geen ondertekend formulier bewaard.</p>}

      <div className="mt-5 border-t border-line pt-4">
        {status.enabled ? (
          <ActionForm action={uploadIntakeAction} resetOnSuccess>
            <input type="hidden" name="customerId" value={customerId} />
            <Field label="Foto of PDF van het ondertekende formulier" htmlFor="intake-file" hint="PDF, JPG, PNG of WebP, maximaal 10 MB. Foto's worden opnieuw opgeslagen zonder locatie- en cameragegevens.">
              <Input id="intake-file" name="file" type="file" accept={INTAKE_ACCEPT} capture="environment" required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Datum ondertekend" htmlFor="intake-signed">
                <Input id="intake-signed" name="signedOn" type="date" max={todayLocal()} defaultValue={todayLocal()} required />
              </Field>
              <Field label="Versie op het formulier" htmlFor="intake-version">
                <Select id="intake-version" name="version" defaultValue={active[0] ? `${active[0].locale}|${active[0].version}` : undefined}>
                  {versions.map((t) => (
                    <option key={t.id} value={`${t.locale}|${t.version}`}>
                      {t.version} ({t.locale.toUpperCase()}){t.status === "active" ? " · actief" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Notitie (optioneel, geen gezondheidsinformatie)" htmlFor="intake-note">
              <Input id="intake-note" name="note" maxLength={300} placeholder="Bijv. tweede pagina apart gefotografeerd" />
            </Field>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="consent" className="mt-1 h-5 w-5" required />
              <span>De klant heeft op het formulier aangekruist dat ze toestemming geeft om het ondertekende formulier te bewaren.</span>
            </label>
            <SubmitButton pending="Versleutelen en opslaan…">Versleuteld opslaan</SubmitButton>
          </ActionForm>
        ) : (
          <Notice tone="warning">
            Ondertekende formulieren bewaren is nog niet beschikbaar:
            <ul className="mt-1 list-disc pl-5">
              {status.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            Tot die tijd: bewaar geen foto&apos;s van formulieren op je telefoon en zet geen gezondheidsinformatie in gewone notities.
          </Notice>
        )}
      </div>
    </Card>
  );
}
