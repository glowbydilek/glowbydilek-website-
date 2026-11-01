"use client";

import { deleteConsultationAction, saveConsultationAction } from "@/lib/private/consultationActions";
import type { ConsultationAnswers } from "@/lib/consultation/service";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

type Q = { key: keyof ConsultationAnswers; note?: keyof ConsultationAnswers; nl: string; why: string };

export function ConsultationForm({ customerId, questions, answers, consentText }: { customerId: number; questions: Q[]; answers: ConsultationAnswers | null; consentText: string }) {
  return (
    <ActionForm action={saveConsultationAction} className="space-y-5">
      <input type="hidden" name="customerId" value={customerId} />
      {questions.map((q) => (
        <fieldset key={q.key} className="rounded-2xl border border-stone p-4">
          <legend className="px-1 text-sm font-medium">{q.nl}</legend>
          <p className="mb-2 text-xs text-muted">Waarom: {q.why}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {[["no", "Nee"], ["yes", "Ja"], ["unknown", "Weet niet / niet gevraagd"]].map(([v, l]) => (
              <label key={v} className="flex min-h-11 items-center gap-2">
                <input type="radio" name={q.key} value={v} defaultChecked={(answers?.[q.key] ?? "unknown") === v} className="h-5 w-5 accent-[var(--color-charcoal)]" />
                {l}
              </label>
            ))}
          </div>
          {q.note && (
            <Field label="Toelichting (kort, alleen wat nodig is)">
              <Input name={q.note} maxLength={300} defaultValue={(answers?.[q.note] as string) ?? ""} />
            </Field>
          )}
        </fieldset>
      ))}
      <Field label="Afgesproken voorzorg bij de behandeling (optioneel)">
        <Textarea name="precautions" rows={2} maxLength={600} defaultValue={answers?.precautions ?? ""} />
      </Field>
      <div className="space-y-3 rounded-2xl bg-ivory-50 p-4 text-sm">
        <p className="font-medium">Toestemmingsverklaring (lees voor of laat lezen)</p>
        <p className="leading-relaxed">{consentText}</p>
        <Field label="Hoe is de toestemming gegeven?">
          <Select name="consentMethod" defaultValue="in_person">
            <option value="in_person">Mondeling, in persoon, na voorlezen</option>
            <option value="written">Schriftelijk ondertekend</option>
            <option value="digital">Digitaal (bijv. per e-mail bevestigd)</option>
          </Select>
        </Field>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="consent" required className="h-5 w-5 accent-[var(--color-charcoal)]" />
          De klant heeft uitdrukkelijk toestemming gegeven voor deze verklaring.
        </label>
      </div>
      <SubmitButton pending="Versleutelen en opslaan…">Versleuteld opslaan</SubmitButton>
    </ActionForm>
  );
}

export function DeleteConsultation({ customerId }: { customerId: number }) {
  return (
    <ActionForm action={deleteConsultationAction} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <Select name="reason" defaultValue="withdrawn" aria-label="Reden">
        <option value="withdrawn">De klant trekt de toestemming in</option>
        <option value="owner">Niet meer nodig</option>
      </Select>
      <SubmitButton variant="danger" confirm="De consultatiegegevens definitief verwijderen?">Gegevens verwijderen</SubmitButton>
    </ActionForm>
  );
}
