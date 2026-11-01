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

function Notify({ hasEmail, label }: { hasEmail: boolean; label: string }) {
  if (!hasEmail) return <p className="text-sm text-muted">Geen e-mailadres bekend: de klant krijgt geen automatisch bericht.</p>;
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input type="checkbox" name="notify" value="on" defaultChecked className="h-5 w-5 accent-[var(--color-charcoal)]" onChange={(e) => { const h = e.currentTarget.form?.querySelector<HTMLInputElement>("input[name=notify][type=hidden]"); if (h) h.disabled = e.currentTarget.checked; }} />
      <input type="hidden" name="notify" value="off" disabled />
      {label}
    </label>
  );
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
              <Notify hasEmail={p.hasEmail} label="Stuur de klant een vriendelijk bericht" />
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
              <Message />
              <Notify hasEmail={p.hasEmail} label="Stuur de klant het nieuwe tijdstip (alleen als het tijdstip verandert)" />
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
              <Notify hasEmail={p.hasEmail} label="Stuur de klant een annuleringsbericht" />
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
