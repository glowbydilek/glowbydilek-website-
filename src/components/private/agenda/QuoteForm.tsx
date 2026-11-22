"use client";

import { sendQuoteAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";
import { useT } from "@/components/private/PanelLangProvider";

/** Send a price proposal for a "price on request" appointment. */
export function QuoteForm({ appointmentId, hasOpen }: { appointmentId: number; hasOpen: boolean }) {
  const t = useT();
  return (
    <ActionForm action={sendQuoteAction}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <p className="text-sm text-muted">
        De klant krijgt een persoonlijke link om het voorstel te accepteren of af te wijzen. Na acceptatie wordt het bedrag de afgesproken prijs van deze afspraak.
        {hasOpen && " Een nieuw voorstel vervangt het openstaande."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Bedrag in euro (incl. btw)"><Input name="amount" inputMode="decimal" required placeholder={t("bijv. 65")} /></Field>
        <Field label="Geldig">
          <Select name="days" defaultValue="7">
            <option value="3">{t("3 dagen")}</option>
            <option value="7">{t("7 dagen")}</option>
            <option value="14">{t("14 dagen")}</option>
            <option value="30">{t("30 dagen")}</option>
          </Select>
        </Field>
      </div>
      <Field label="Toelichting voor de klant (optioneel)"><Textarea name="message" rows={3} maxLength={1000} /></Field>
      <SubmitButton pending="Versturen…">{t("Prijsvoorstel versturen")}</SubmitButton>
    </ActionForm>
  );
}
