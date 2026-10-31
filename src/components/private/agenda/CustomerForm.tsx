"use client";

import { customerAction } from "@/lib/private/agendaActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export function CustomerForm({ c }: { c: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null; locale: string; notes: string | null } }) {
  return (
    <>
      <ActionForm action={customerAction}>
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="op" value="update" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Voornaam"><Input name="firstName" defaultValue={c.firstName} required /></Field>
          <Field label="Achternaam"><Input name="lastName" defaultValue={c.lastName} /></Field>
          <Field label="Telefoon"><Input name="phone" type="tel" defaultValue={c.phone ?? ""} /></Field>
          <Field label="E-mail"><Input name="email" type="email" defaultValue={c.email ?? ""} /></Field>
          <Field label="Taal"><Select name="locale" defaultValue={c.locale}><option value="nl">Nederlands</option><option value="en">Engels</option></Select></Field>
        </div>
        <Field label="Notitie (alleen voor jou)" hint="Geen medische details opslaan."><Textarea name="notes" rows={3} defaultValue={c.notes ?? ""} maxLength={2000} /></Field>
        <SubmitButton>Opslaan</SubmitButton>
      </ActionForm>
      <details className="mt-6 rounded-2xl border border-[#8e2f24]/25 p-4">
        <summary className="cursor-pointer font-medium">Privacy: gegevens verwijderen</summary>
        <p className="mt-2 text-sm text-muted">Verwijdert naam, e-mail, telefoon en notities. Toekomstige afspraken worden geannuleerd (zonder e-mail). De anonieme afspraakgeschiedenis blijft bewaard voor je administratie.</p>
        <ActionForm action={customerAction} className="mt-3">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="op" value="anonymize" />
          <SubmitButton variant="danger" confirm="Weet je het zeker? Dit kan niet ongedaan worden gemaakt.">Persoonsgegevens verwijderen</SubmitButton>
        </ActionForm>
      </details>
    </>
  );
}
