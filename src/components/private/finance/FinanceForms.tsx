"use client";

import { useState } from "react";
import { createInvoiceAction, invoiceOpAction, recordPaymentAction, saveInvoiceAction, voidPaymentAction } from "@/lib/private/financeActions";
import { centsToInput, formatCents, parseEuroToCents } from "@/lib/finance/money";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export const METHOD_OPTIONS = [
  ["pin", "Pin"],
  ["cash", "Contant"],
  ["transfer", "Overboeking"],
  ["tikkie", "Betaalverzoek"],
  ["other", "Anders"],
] as const;

function MethodSelect({ id = "method" }: { id?: string }) {
  return (
    <Select id={id} name="method" defaultValue="pin">
      {METHOD_OPTIONS.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </Select>
  );
}

/** Record a received payment or a refund. Only real, received money. */
export function PaymentForm({
  customerId,
  appointments = [],
  invoices = [],
  today,
  defaultAppointmentId,
  defaultAmount,
  invoiceId,
}: {
  invoiceId?: number;
  customerId: number;
  appointments?: { id: number; label: string }[];
  invoices?: { id: number; label: string }[];
  today: string;
  defaultAppointmentId?: number;
  defaultAmount?: number | null;
}) {
  return (
    <ActionForm action={recordPaymentAction} resetOnSuccess className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      {invoiceId && <input type="hidden" name="invoiceId" value={invoiceId} />}
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Soort">
          <Select name="kind" defaultValue="payment">
            <option value="payment">Ontvangen betaling</option>
            <option value="refund">Terugbetaling aan klant</option>
          </Select>
        </Field>
        <Field label="Bedrag" hint="Bijvoorbeeld 45 of 45,50">
          <Input name="amount" inputMode="decimal" required defaultValue={centsToInput(defaultAmount)} />
        </Field>
        <Field label="Betaalmethode">
          <MethodSelect id="pay-method" />
        </Field>
        <Field label="Datum ontvangen">
          <Input name="paidOn" type="date" defaultValue={today} required />
        </Field>
        {appointments.length > 0 && (
          <Field label="Bij afspraak (optioneel)">
            <Select name="appointmentId" defaultValue={defaultAppointmentId ? String(defaultAppointmentId) : ""}>
              <option value="">—</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {invoices.length > 0 && (
          <Field label="Bij factuur (optioneel)">
            <Select name="invoiceId" defaultValue="">
              <option value="">—</option>
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <Field label="Notitie (optioneel)">
        <Input name="note" maxLength={300} />
      </Field>
      <SubmitButton pending="Bezig…">Vastleggen</SubmitButton>
    </ActionForm>
  );
}

export function VoidPaymentForm({ id }: { id: number }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted underline">ongedaan maken</summary>
      <ActionForm action={voidPaymentAction} className="mt-2 flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={id} />
        <Input name="reason" placeholder="Reden, bijv. dubbel ingevoerd" required minLength={3} className="max-w-xs" aria-label="Reden" />
        <SubmitButton variant="outline" confirm="Deze betaling ongedaan maken? Hij blijft zichtbaar in de geschiedenis.">
          Ongedaan maken
        </SubmitButton>
      </ActionForm>
    </details>
  );
}

export function NewInvoiceButton({ customerId, appointmentId, label = "＋ Factuur maken" }: { customerId: number; appointmentId?: number; label?: string }) {
  return (
    <ActionForm action={createInvoiceAction} className="">
      <input type="hidden" name="customerId" value={customerId} />
      {appointmentId && <input type="hidden" name="appointmentId" value={appointmentId} />}
      <SubmitButton variant="outline" pending="Bezig…">
        {label}
      </SubmitButton>
    </ActionForm>
  );
}

type Line = { description: string; quantity: number; amount: string };

/** Draft editor: lines (amounts incl. VAT), buyer details, treatment date and a note. */
export function InvoiceEditor({
  id,
  kind,
  lines: initial,
  buyer,
  supplyDate,
  note,
}: {
  id: number;
  kind: "invoice" | "credit";
  lines: { description: string; quantity: number; unitCents: number }[];
  buyer: { name: string; email: string | null; address: string | null };
  supplyDate: string | null;
  note: string | null;
}) {
  const [lines, setLines] = useState<Line[]>(
    initial.length ? initial.map((l) => ({ description: l.description, quantity: l.quantity, amount: l.unitCents ? centsToInput(Math.abs(l.unitCents)) : "" })) : [{ description: "", quantity: 1, amount: "" }],
  );
  const total = lines.reduce((s, l) => s + (parseEuroToCents(l.amount) ?? 0) * (l.quantity || 1), 0);
  const upd = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <ActionForm action={saveInvoiceAction} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Naam klant">
          <Input name="buyerName" defaultValue={buyer.name} required />
        </Field>
        <Field label="E-mailadres klant" hint="Wordt op de factuur vermeld.">
          <Input name="buyerEmail" type="email" defaultValue={buyer.email ?? ""} />
        </Field>
        <Field label="Adres klant (optioneel)">
          <Textarea name="buyerAddress" rows={2} defaultValue={buyer.address ?? ""} />
        </Field>
        <Field label="Datum behandeling">
          <Input name="supplyDate" type="date" defaultValue={supplyDate ?? ""} />
        </Field>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Regels {kind === "credit" ? "(worden als negatief bedrag gecrediteerd)" : "(bedragen inclusief eventuele btw)"}</legend>
        {lines.map((l, i) => (
          <div key={i} className="grid [&>*]:min-w-0 grid-cols-[1fr_4.5rem_7rem_2.75rem] items-end gap-2">
            <Field label={i === 0 ? "Omschrijving" : ""}>
              <Input name="lineDescription" value={l.description} onChange={(e) => upd(i, { description: e.target.value })} aria-label={`Omschrijving regel ${i + 1}`} />
            </Field>
            <Field label={i === 0 ? "Aantal" : ""}>
              <Input name="lineQuantity" type="number" min={1} max={99} value={l.quantity} onChange={(e) => upd(i, { quantity: Number(e.target.value) })} aria-label={`Aantal regel ${i + 1}`} />
            </Field>
            <Field label={i === 0 ? "Prijs" : ""}>
              <Input name="lineAmount" inputMode="decimal" value={l.amount} onChange={(e) => upd(i, { amount: e.target.value })} aria-label={`Prijs regel ${i + 1}`} placeholder="0,00" />
            </Field>
            <button type="button" aria-label={`Regel ${i + 1} verwijderen`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="mb-0.5 h-11 w-11 rounded-full text-[#8e2f24] hover:bg-[#8e2f24]/10 disabled:opacity-30">
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setLines((ls) => [...ls, { description: "", quantity: 1, amount: "" }])} className="min-h-11 rounded-full border border-dashed border-charcoal/30 px-4 text-sm">
          ＋ Regel toevoegen
        </button>
        <p className="text-sm">
          Totaal: <strong>{formatCents(kind === "credit" ? -total : total)}</strong>
        </p>
      </fieldset>
      <Field label="Opmerking op de factuur (optioneel)">
        <Textarea name="note" rows={2} maxLength={500} defaultValue={note ?? ""} />
      </Field>
      <SubmitButton pending="Bezig met opslaan…">Concept opslaan</SubmitButton>
    </ActionForm>
  );
}

export function IssueForm({ id, kind, ready, today }: { id: number; kind: "invoice" | "credit"; ready: boolean; today: string }) {
  const [paid, setPaid] = useState(false);
  return (
    <ActionForm action={invoiceOpAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value="issue" />
      {kind === "invoice" && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="paidNow" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-[var(--color-charcoal)]" />
          De klant heeft al betaald (de factuur vermeldt dan &quot;Voldaan&quot;)
        </label>
      )}
      {paid && (
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
          <Field label="Betaalmethode">
            <MethodSelect id="issue-method" />
          </Field>
          <Field label="Datum betaald">
            <Input name="paidOn" type="date" defaultValue={today} />
          </Field>
        </div>
      )}
      <SubmitButton disabled={!ready} confirm="Factuur definitief uitgeven? Daarna kan hij niet meer worden gewijzigd (alleen gecrediteerd).">
        {kind === "credit" ? "Creditfactuur uitgeven" : "Factuur uitgeven"}
      </SubmitButton>
    </ActionForm>
  );
}

export function InvoiceOpButton({ id, op, label, variant = "outline", confirm }: { id: number; op: string; label: string; variant?: "outline" | "danger" | "primary" | "ghost"; confirm?: string }) {
  return (
    <ActionForm action={invoiceOpAction} className="">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton variant={variant} confirm={confirm} pending="Bezig…">
        {label}
      </SubmitButton>
    </ActionForm>
  );
}
