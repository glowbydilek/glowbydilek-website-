"use client";

import { useState } from "react";
import type { InvoiceSettings } from "@/lib/db/settings";
import { saveInvoiceSettingsAction } from "@/lib/private/financeActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export function BusinessForm({ v }: { v: InvoiceSettings }) {
  const [mode, setMode] = useState(v.vatMode);
  return (
    <ActionForm action={saveInvoiceSettingsAction} className="space-y-6">
      <fieldset className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl">Onderneming</legend>
        <Field label="Naam zoals ingeschreven bij de KVK">
          <Input name="legalName" defaultValue={v.legalName} />
        </Field>
        <Field label="Handelsnaam">
          <Input name="tradeName" defaultValue={v.tradeName} />
        </Field>
        <Field label="KVK-nummer" hint="8 cijfers, zie je uittreksel.">
          <Input name="kvk" inputMode="numeric" defaultValue={v.kvk} />
        </Field>
        <Field label="Factuurvoorvoegsel" hint="Bijv. GBD → GBD-2026-0001">
          <Input name="prefix" defaultValue={v.prefix} />
        </Field>
      </fieldset>
      <fieldset className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl">Adres op de factuur</legend>
        <p className="text-sm text-muted sm:col-span-2">Een factuur moet het adres van de onderneming vermelden. Dit adres staat alleen op facturen, nooit op de website.</p>
        <Field label="Straat en huisnummer">
          <Input name="street" defaultValue={v.street} autoComplete="off" />
        </Field>
        <Field label="Postcode">
          <Input name="postcode" defaultValue={v.postcode} autoComplete="off" />
        </Field>
        <Field label="Plaats">
          <Input name="city" defaultValue={v.city} autoComplete="off" />
        </Field>
        <Field label="Land">
          <Input name="country" defaultValue={v.country} />
        </Field>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-2 font-serif text-xl">Btw</legend>
        <p className="text-sm text-muted">Kies wat je boekhouder of de Belastingdienst voor jouw situatie heeft bevestigd. Het systeem kiest hier niets voor je en vult geen tarief in.</p>
        <Field label="Btw-situatie">
          <Select name="vatMode" value={mode} onChange={(e) => setMode(e.target.value as InvoiceSettings["vatMode"])}>
            <option value="">— nog niet gekozen —</option>
            <option value="standard">Ik reken btw</option>
            <option value="exempt">Ik ben vrijgesteld (bijv. kleineondernemersregeling)</option>
          </Select>
        </Field>
        {mode === "standard" && (
          <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Btw-identificatienummer" hint="NL…B.., zie je brief van de Belastingdienst.">
              <Input name="vatNumber" defaultValue={v.vatNumber} />
            </Field>
            <Field label="Btw-tarief (%)" hint="Het tarief dat op jouw behandelingen van toepassing is.">
              <Input name="vatRate" inputMode="decimal" defaultValue={v.vatRateBp ? String(v.vatRateBp / 100).replace(".", ",") : ""} />
            </Field>
          </div>
        )}
        {mode === "exempt" && (
          <Field label="Tekst op de factuur" hint="De exacte vermelding die je boekhouder heeft bevestigd.">
            <Textarea name="exemptionText" rows={2} defaultValue={v.exemptionText} />
          </Field>
        )}
      </fieldset>
      <fieldset className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl">Betalen en contact</legend>
        <Field label="IBAN (optioneel)">
          <Input name="iban" defaultValue={v.iban} autoComplete="off" />
        </Field>
        <Field label="Ten name van">
          <Input name="accountHolder" defaultValue={v.accountHolder} />
        </Field>
        <Field label="Betaaltermijn (dagen)">
          <Input name="paymentTermDays" type="number" min={0} max={60} defaultValue={v.paymentTermDays} />
        </Field>
        <Field label="E-mail op de factuur">
          <Input name="email" type="email" defaultValue={v.email} />
        </Field>
        <Field label="Telefoon op de factuur (optioneel)">
          <Input name="phone" defaultValue={v.phone} />
        </Field>
        <Field label="Extra regel onderaan (optioneel)">
          <Input name="footer" defaultValue={v.footer} maxLength={200} />
        </Field>
      </fieldset>
      <SubmitButton pending="Bezig met opslaan…">Opslaan</SubmitButton>
    </ActionForm>
  );
}
