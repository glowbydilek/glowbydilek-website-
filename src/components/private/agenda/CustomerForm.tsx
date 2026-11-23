"use client";

import { customerAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";
import { useT } from "@/components/private/PanelLangProvider";

export function CustomerForm({ c, owner = false }: { c: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null; locale: string; notes: string | null; blockedAt?: Date | null; blockReason?: string | null }; owner?: boolean }) {
  const t = useT();
  return (
    <>
      <ActionForm action={customerAction}>
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="op" value="update" />
        <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
          <Field label="Voornaam"><Input name="firstName" defaultValue={c.firstName} required /></Field>
          <Field label="Achternaam"><Input name="lastName" defaultValue={c.lastName} /></Field>
          <Field label="Telefoon"><Input name="phone" type="tel" defaultValue={c.phone ?? ""} /></Field>
          <Field label="E-mail"><Input name="email" type="email" defaultValue={c.email ?? ""} /></Field>
          <Field label="Taal"><Select name="locale" defaultValue={c.locale}><option value="nl">{t("Nederlands")}</option><option value="en">{t("Engels")}</option><option value="tr">{t("Turks")}</option></Select></Field>
        </div>
        <Field label="Notitie (alleen voor jou)" hint="Geen medische details opslaan."><Textarea name="notes" rows={3} defaultValue={c.notes ?? ""} maxLength={2000} /></Field>
        <SubmitButton>{t("Opslaan")}</SubmitButton>
      </ActionForm>
      {owner && (
        <details className="mt-6 rounded-2xl border border-line p-4" open={Boolean(c.blockedAt)}>
          <summary className="cursor-pointer font-medium">{t(c.blockedAt ? "Geblokkeerd" : "Klant blokkeren")}</summary>
          {c.blockedAt ? (
            <>
              <p className="mt-2 text-sm text-muted">{t("Online aanvragen met dit e-mailadres of telefoonnummer worden geweigerd. De geschiedenis blijft bewaard.")}</p>
              {c.blockReason && <p className="mt-2 text-sm">{t("Reden")}: {c.blockReason}</p>}
              <ActionForm action={customerAction} className="mt-3">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="op" value="unblock" />
                <SubmitButton variant="outline">{t("Blokkade opheffen")}</SubmitButton>
              </ActionForm>
            </>
          ) : (
            <ActionForm action={customerAction} className="mt-3">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="op" value="block" />
              <p className="mb-3 text-sm text-muted">{t("Na blokkeren worden online aanvragen met dit e-mailadres of telefoonnummer vriendelijk geweigerd. Bestaande afspraken en facturen blijven staan.")}</p>
              <Field label="Reden (alleen voor jou)"><Input name="reason" maxLength={300} /></Field>
              <SubmitButton variant="danger" confirm="Deze klant blokkeren?">{t("Klant blokkeren")}</SubmitButton>
            </ActionForm>
          )}
        </details>
      )}
      <details className="mt-6 rounded-2xl border border-[#8e2f24]/25 p-4">
        <summary className="cursor-pointer font-medium">{t("Privacy: gegevens verwijderen")}</summary>
        <p className="mt-2 text-sm text-muted">{t("Verwijdert naam, e-mail, telefoon en notities. Toekomstige afspraken worden geannuleerd (zonder e-mail). De anonieme afspraakgeschiedenis blijft bewaard voor je administratie.")}</p>
        <ActionForm action={customerAction} className="mt-3">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="op" value="anonymize" />
          <SubmitButton variant="danger" confirm="Weet je het zeker? Dit kan niet ongedaan worden gemaakt.">{t("Persoonsgegevens verwijderen")}</SubmitButton>
        </ActionForm>
      </details>
    </>
  );
}
