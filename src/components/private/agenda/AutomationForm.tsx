"use client";

import { useState } from "react";
import type { AftercareSettings, InvoiceAutomation } from "@/lib/db/settings";
import { automationSettingsAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton } from "../ui";

/** Invoice automation (all off by default) and the optional aftercare email. */
export function AutomationForm({ a, c, ready }: { a: InvoiceAutomation; c: AftercareSettings; ready: boolean }) {
  const [draft, setDraft] = useState(a.autoDraft);
  const [issue, setIssue] = useState(a.autoIssue);
  const box = (name: string, label: string, hint: string, checked: boolean, onChange?: (v: boolean) => void, disabled = false) => (
    <label className={`flex min-h-11 items-start gap-3 ${disabled ? "opacity-50" : ""}`}>
      <input type="checkbox" name={name} defaultChecked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} className="mt-1 h-5 w-5" />
      <span className="text-sm">
        {label}
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
  return (
    <ActionForm action={automationSettingsAction}>
      <fieldset className="space-y-1">
        <legend className="mb-2 text-sm font-medium">Facturen na een afgeronde afspraak</legend>
        {box("autoDraft", "Automatisch een factuurconcept maken", "Alleen als er een afgesproken prijs is en er nog geen factuur bestaat.", a.autoDraft, setDraft)}
        {box("autoIssue", "Het concept direct uitgeven (definitief nummer)", ready ? "Uitgegeven facturen zijn definitief; corrigeren kan alleen met een creditfactuur." : "Kan pas als de bedrijfsgegevens compleet zijn (Admin → Bedrijf & facturen).", a.autoIssue, setIssue, !draft)}
        {box("autoEmail", "De uitgegeven factuur direct mailen", "Naar het e-mailadres van de klant, met de PDF als bijlage.", a.autoEmail, undefined, !draft || !issue)}
        <p className="text-xs text-muted">Per afspraak kun je kiezen voor ‘handmatig’ of ‘geen factuur’. Wijzigings- en annuleringsmails worden altijd verstuurd.</p>
      </fieldset>
      <fieldset className="space-y-1">
        <legend className="mb-2 text-sm font-medium">Nazorgbericht</legend>
        {box("aftercare", "Na een afgeronde afspraak een nazorgbericht mailen", "Tekst aanpasbaar onder Admin → E-mailteksten.", c.enabled)}
        <Field label="Hoeveel uur na afronding"><Input name="delayHours" type="number" min={0} max={72} defaultValue={c.delayHours} className="w-28" /></Field>
      </fieldset>
      <SubmitButton>Opslaan</SubmitButton>
    </ActionForm>
  );
}
