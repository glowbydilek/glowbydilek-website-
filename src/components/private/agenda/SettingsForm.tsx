"use client";

import { saveBookingSettingsAction } from "@/lib/private/agendaActions";
import type { BookingSettings, PrivateBusinessSettings } from "@/lib/db/settings";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export function SettingsForm({ b, p, bookableCount }: { b: BookingSettings; p: PrivateBusinessSettings; bookableCount: number }) {
  return (
    <ActionForm action={saveBookingSettingsAction}>
      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" name="onlineBookingEnabled" defaultChecked={b.onlineBookingEnabled} className="mt-1 h-5 w-5" />
        <span>
          <span className="block font-medium">Online tijdstip kiezen aanzetten</span>
          <span className="text-sm text-muted">
            Klanten kiezen dan een vrij tijdstip uit je werktijden. Het blijft een aanvraag die jij bevestigt. Alleen behandelingen met een vaste duur en &lsquo;online boekbaar&rsquo; worden aangeboden ({bookableCount} nu).
          </span>
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Klanten tegelijk" hint="Standaard 1"><Input type="number" name="capacity" min={1} max={10} defaultValue={b.capacity} /></Field>
        <Field label="Max. afspraken per dag" hint="Leeg = geen maximum"><Input type="number" name="maxPerDay" min={1} max={50} defaultValue={b.maxPerDay ?? ""} /></Field>
        <Field label="Tijdstappen"><Select name="slotStepMinutes" defaultValue={String(b.slotStepMinutes)}>{[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n} minuten</option>)}</Select></Field>
        <Field label="Minimaal vooraf (uren)" hint="Hoe snel een klant kan boeken"><Input type="number" name="minNoticeHours" min={0} max={336} defaultValue={b.minNoticeHours} /></Field>
        <Field label="Maximaal vooruit (dagen)"><Input type="number" name="maxAdvanceDays" min={1} max={365} defaultValue={b.maxAdvanceDays} /></Field>
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="remindersEnabled" defaultChecked={b.remindersEnabled} className="h-5 w-5" />
        Herinneringsmail sturen
      </label>
      <Field label="Herinnering hoeveel uur vooraf"><Input type="number" name="reminderHoursBefore" min={2} max={72} defaultValue={b.reminderHoursBefore} className="max-w-[8rem]" /></Field>
      <Field label="Praktische locatiegegevens (privé)" hint="Alleen opgenomen in bevestigings- en herinneringsmails. Nooit zichtbaar op de website.">
        <Textarea name="locationDetails" rows={3} maxLength={1000} defaultValue={p.locationDetails} />
      </Field>
      <Field label="E-mailadres voor nieuwe aanvragen" hint="Leeg = hello@glowbydilek.nl (MAIL_TO)"><Input type="email" name="ownerNotifyEmail" defaultValue={p.ownerNotifyEmail} /></Field>
      <SubmitButton>Instellingen opslaan</SubmitButton>
    </ActionForm>
  );
}
