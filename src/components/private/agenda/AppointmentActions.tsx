"use client";

import type { ReactNode } from "react";
import { appointmentAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton, Textarea } from "../ui";

type Props = {
  id: number;
  status: string;
  day: string;
  time: string;
  duration: number | null;
  hasEmail: boolean;
  archived: boolean;
  internalNote: string;
  hasExactTime: boolean;
  priceInput: string;
  treatments: { id: string; name: string }[];
  currentTreatments: string[];
};

function Panel({ title, children, open = false, tone = "default" }: { title: string; children: ReactNode; open?: boolean; tone?: "default" | "danger" }) {
  return (
    <details open={open} className={`group rounded-2xl border bg-white ${tone === "danger" ? "border-[#8e2f24]/25" : "border-stone"}`}>
      <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 font-medium">
        {title}
        <span aria-hidden="true" className="transition group-open:rotate-90">›</span>
      </summary>
      <div className="border-t border-stone p-4">{children}</div>
    </details>
  );
}

function WhenFields({ day, time, duration, required = true }: { day: string; time: string; duration: number | null; required?: boolean }) {
  return (
    <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-3">
      <Field label="Datum">
        <Input name="day" type="date" defaultValue={day} required={required} />
      </Field>
      <Field label="Begintijd">
        <Input name="time" type="time" step={300} defaultValue={time} required={required} />
      </Field>
      <Field label="Duur (min)" hint={duration ? undefined : "Verplicht als de behandeling geen vaste duur heeft"}>
        <Input name="duration" type="number" min={5} max={600} step={5} defaultValue={duration ?? ""} inputMode="numeric" />
      </Field>
    </div>
  );
}

function Message({ label = "Persoonlijke toelichting in de e-mail (optioneel)" }: { label?: string }) {
  return (
    <Field label={label}>
      <Textarea name="message" rows={2} maxLength={800} />
    </Field>
  );
}

/** Material changes always notify the customer; without an email address that is shown clearly. */
function Notify({ hasEmail, label }: { hasEmail: boolean; label: string }) {
  if (!hasEmail)
    return (
      <p role="note" className="rounded-xl border border-[#8e2f24]/30 bg-[#fbeeec] px-3 py-2 text-sm text-[#74261d]">
        Geen e-mailadres bekend: de klant krijgt hier <strong>geen</strong> bericht van. Laat het de klant zelf weten.
      </p>
    );
  return <p className="rounded-xl bg-ivory-50 px-3 py-2 text-sm text-charcoal-soft">✉ {label}</p>;
}

function Hidden({ id, op }: { id: number; op: string }) {
  return (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
    </>
  );
}

export function AppointmentActions(p: Props) {
  const pending = p.status === "requested" || p.status === "proposed";
  return (
    <div className="space-y-3">
      {pending && (
        <>
          <Panel title={p.hasExactTime ? "✓ Bevestigen" : "✓ Bevestigen op een tijdstip"} open>
            <ActionForm action={appointmentAction}>
              <Hidden id={p.id} op="approve" />
              {!p.hasExactTime ? (
                <WhenFields day={p.day} time={p.time} duration={p.duration} />
              ) : (
                <p className="text-sm text-muted">De afspraak wordt bevestigd op het aangevraagde tijdstip. Het systeem controleert eerst of het nog vrij is.</p>
              )}
              <Message />
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" name="allowOutsideHours" className="h-5 w-5" /> Toestaan buiten mijn werktijden
              </label>
              <SubmitButton pending="Bezig met bevestigen…">Afspraak bevestigen{p.hasEmail ? " en klant mailen" : ""}</SubmitButton>
            </ActionForm>
          </Panel>
          <Panel title="↻ Ander tijdstip voorstellen">
            <ActionForm action={appointmentAction}>
              <Hidden id={p.id} op="propose" />
              <WhenFields day={p.day} time={p.time} duration={p.duration} />
              <Message label="Toelichting voor de klant (optioneel)" />
              <p className="text-xs text-muted">Het tijdstip wordt voorlopig voor deze klant vastgehouden. De klant antwoordt per e-mail; daarna bevestig je hier.</p>
              <SubmitButton variant="outline">Voorstel versturen</SubmitButton>
            </ActionForm>
          </Panel>
          <Panel title="✕ Afwijzen" tone="danger">
            <ActionForm action={appointmentAction}>
              <Hidden id={p.id} op="decline" />
              <Message label="Toelichting voor de klant (optioneel)" />
              <Notify hasEmail={p.hasEmail} label="De klant krijgt automatisch een vriendelijk bericht." />
              <SubmitButton variant="danger" confirm="Weet je zeker dat je deze aanvraag wilt afwijzen?">Aanvraag afwijzen</SubmitButton>
            </ActionForm>
          </Panel>
        </>
      )}

      {p.status === "confirmed" && (
        <>
          <Panel title="↻ Verplaatsen of wijzigen" open>
            <ActionForm action={appointmentAction}>
              <Hidden id={p.id} op="reschedule" />
              <WhenFields day={p.day} time={p.time} duration={p.duration} />
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium">Behandeling(en)</legend>
                <div className="flex flex-wrap gap-2">
                  {p.treatments.map((t) => (
                    <label key={t.id} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone bg-white px-3 text-sm has-[:checked]:border-charcoal has-[:checked]:bg-charcoal has-[:checked]:text-ivory">
                      <input type="checkbox" name="treatments" value={t.id} defaultChecked={p.currentTreatments.includes(t.id)} className="sr-only" />
                      {t.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Afgesproken prijs" hint="Leeg = geen prijs vastgelegd. Een gewijzigde prijs stuurt geen e-mail.">
                <Input name="price" inputMode="decimal" defaultValue={p.priceInput} placeholder="bijv. 45,00" />
              </Field>
              <Message />
              <Notify hasEmail={p.hasEmail} label="Verandert het tijdstip, de duur of de behandeling, dan krijgt de klant automatisch een e-mail met de nieuwe gegevens." />
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" name="allowOutsideHours" className="h-5 w-5" /> Toestaan buiten mijn werktijden
              </label>
              <SubmitButton>Wijziging opslaan</SubmitButton>
            </ActionForm>
          </Panel>
          <Panel title="Status">
            <div className="flex flex-wrap gap-2">
              <ActionForm action={appointmentAction} className="">
                <Hidden id={p.id} op="complete" />
                <SubmitButton variant="outline">✓ Afgerond</SubmitButton>
              </ActionForm>
              <ActionForm action={appointmentAction} className="">
                <Hidden id={p.id} op="noshow" />
                <SubmitButton variant="outline" confirm="Markeren als niet verschenen?">Niet verschenen</SubmitButton>
              </ActionForm>
            </div>
          </Panel>
          <Panel title="✕ Annuleren" tone="danger">
            <ActionForm action={appointmentAction}>
              <Hidden id={p.id} op="cancel" />
              <Message />
              <Notify hasEmail={p.hasEmail} label="De klant krijgt automatisch een annuleringsbericht." />
              <p className="text-xs text-muted">De afspraak blijft in de geschiedenis staan; het tijdstip komt weer vrij.</p>
              <SubmitButton variant="danger" confirm="Weet je zeker dat je deze afspraak wilt annuleren?">Afspraak annuleren</SubmitButton>
            </ActionForm>
          </Panel>
        </>
      )}

      <Panel title="Interne notitie">
        <ActionForm action={appointmentAction}>
          <Hidden id={p.id} op="notes" />
          <Textarea name="internalNote" rows={3} maxLength={2000} defaultValue={p.internalNote} aria-label="Interne notitie" />
          <p className="text-xs text-muted">Alleen zichtbaar voor jou. Geen medische details opslaan.</p>
          <SubmitButton variant="outline">Notitie opslaan</SubmitButton>
        </ActionForm>
      </Panel>

      {!["requested", "proposed", "confirmed"].includes(p.status) && (
        <ActionForm action={appointmentAction} className="">
          <Hidden id={p.id} op={p.archived ? "unarchive" : "archive"} />
          <SubmitButton variant="ghost">{p.archived ? "Uit archief halen" : "Archiveren"}</SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
