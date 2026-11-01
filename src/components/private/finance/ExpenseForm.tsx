"use client";

import { EXPENSE_CATEGORIES } from "@/lib/expenses/core";
import { expenseAction } from "@/lib/private/financeActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export type ExpenseView = { id: number | null; spentOn: string; category: string; vendor: string; description: string; amount: string; vatRate: string; vatAmount: string; status: string; notes: string };

export function ExpenseForm({ e }: { e: ExpenseView }) {
  return (
    <ActionForm action={expenseAction} resetOnSuccess={!e.id}>
      {e.id && <input type="hidden" name="id" value={e.id} />}
      <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <Field label="Datum"><Input name="spentOn" type="date" defaultValue={e.spentOn} required /></Field>
        <Field label="Categorie">
          <Select name="category" defaultValue={e.category || "other"}>
            {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Leverancier"><Input name="vendor" defaultValue={e.vendor} maxLength={160} /></Field>
        <Field label="Omschrijving"><Input name="description" defaultValue={e.description} maxLength={300} /></Field>
        <Field label="Bedrag incl. btw (€)"><Input name="amount" inputMode="decimal" defaultValue={e.amount} required /></Field>
        <Field label="Status">
          <Select name="status" defaultValue={e.status || "paid"}>
            <option value="paid">Betaald</option>
            <option value="open">Nog te betalen</option>
            <option value="void">Vervallen (telt niet mee)</option>
          </Select>
        </Field>
        <Field label="Btw-bedrag op de bon (€)" hint="Het meest exact; laat leeg om uit het tarief te berekenen"><Input name="vatAmount" inputMode="decimal" defaultValue={e.vatAmount} /></Field>
        <Field label="Of btw-tarief (%)" hint="Bijv. 21 of 9"><Input name="vatRate" inputMode="decimal" defaultValue={e.vatRate} /></Field>
        <Field label="Bon (PDF of foto, max 10 MB)"><Input name="receipt" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /></Field>
      </div>
      <Field label="Notities"><Textarea name="notes" rows={2} defaultValue={e.notes} /></Field>
      <SubmitButton>{e.id ? "Uitgave opslaan" : "Uitgave toevoegen"}</SubmitButton>
    </ActionForm>
  );
}
