"use client";

import { treatmentAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, SubmitButton, Textarea } from "../ui";

export type TreatmentRowView = {
  id: string;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
  priceCents: number | null;
  priceFrom: boolean;
  durationMinutes: number | null;
  bufferMinutes: number;
  active: boolean;
  visible: boolean;
  featured: boolean;
  bookableOnline: boolean;
};

export function TreatmentForm({ t }: { t: TreatmentRowView }) {
  const check = (name: string, label: string, on: boolean, hint?: string) => (
    <label className="flex min-h-11 items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={on} className="mt-1 h-5 w-5" />
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
  return (
    <ActionForm action={treatmentAction}>
      <input type="hidden" name="id" value={t.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Prijs in euro" hint="Leeg = 'op aanvraag'"><Input name="price" inputMode="decimal" defaultValue={t.priceCents != null ? (t.priceCents / 100).toString().replace(".", ",") : ""} placeholder="bijv. 35" /></Field>
        <Field label="Duur (minuten)" hint="Nodig voor online tijdstippen"><Input name="duration" type="number" min={5} max={480} step={5} defaultValue={t.durationMinutes ?? ""} /></Field>
        <Field label="Opruimtijd na afloop (min)"><Input name="buffer" type="number" min={0} max={120} step={5} defaultValue={t.bufferMinutes} /></Field>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {check("priceFrom", "Prijs tonen als 'vanaf'", t.priceFrom)}
        {check("active", "Actief (beschikbaar)", t.active)}
        {check("visible", "Zichtbaar op de website", t.visible)}
        {check("featured", "Uitgelicht", t.featured)}
        {check("bookableOnline", "Online boekbaar (tijdstip kiezen)", t.bookableOnline, "Alleen mogelijk met een ingevulde duur")}
      </div>
      <details className="rounded-xl border border-stone p-3">
        <summary className="cursor-pointer text-sm">Naam en korte omschrijving (NL/EN)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Naam (NL)"><Input name="nameNl" defaultValue={t.nameNl} required /></Field>
          <Field label="Naam (EN)"><Input name="nameEn" defaultValue={t.nameEn} required /></Field>
          <Field label="Omschrijving (NL)"><Textarea name="descriptionNl" rows={3} defaultValue={t.descriptionNl} /></Field>
          <Field label="Omschrijving (EN)"><Textarea name="descriptionEn" rows={3} defaultValue={t.descriptionEn} /></Field>
        </div>
      </details>
      <SubmitButton>Opslaan</SubmitButton>
    </ActionForm>
  );
}
