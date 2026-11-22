"use client";

import { useId, useRef, useState } from "react";
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

type Line = { description: string; quantity: number; amount: string; vat: string; key: number; onRequest?: boolean };

/** A treatment from Behandelingen & prijzen, offered when filling in an invoice line. */
export type CatalogueOption = { id: string; name: string; group: string; priceCents: number | null; mode: "on_request" | "fixed" | "from"; vat: string };

/**
 * Omschrijving with a searchable list of the salon's treatments. Picking one
 * fills the exact name and the price saved right now (nothing for ‘Op
 * aanvraag’ — the agreed price is typed in). Free text stays possible for a
 * custom line. Changing the line never changes the treatment's own price.
 */
function DescriptionPicker({
  id,
  value,
  index,
  catalogue,
  onText,
  onPick,
}: {
  id?: string;
  value: string;
  index: number;
  catalogue: CatalogueOption[];
  onText: (v: string) => void;
  onPick: (o: CatalogueOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = value.trim().toLowerCase();
  const matches = catalogue.filter((o) => !q || o.name.toLowerCase().includes(q) || o.group.toLowerCase().includes(q)).slice(0, 40);
  const price = (o: CatalogueOption) => (o.mode === "on_request" || o.priceCents == null ? "op aanvraag" : `${o.mode === "from" ? "vanaf " : ""}${formatCents(o.priceCents)}`);
  return (
    <div className="relative">
      <Input
        id={id}
        name="lineDescription"
        value={value}
        role="combobox"
        aria-expanded={open && catalogue.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={catalogue.length ? "Tik om een behandeling te kiezen" : ""}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
        }}
        aria-label={`Omschrijving regel ${index + 1}`}
      />
      {open && catalogue.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-[min(22rem,50dvh)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {matches.length === 0 && <li className="px-3 py-3 text-sm text-muted">Geen behandeling gevonden — je eigen tekst blijft staan als vrije regel.</li>}
          {matches.map((o, k) => (
            <li key={o.id} role="option" aria-selected={false}>
              {(k === 0 || matches[k - 1].group !== o.group) && <p className="px-3 pb-1 pt-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted">{o.group}</p>}
              <button
                type="button"
                onClick={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  onPick(o);
                  setOpen(false);
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-ink/6 focus:bg-ink/6"
              >
                <span className="min-w-0">{o.name}</span>
                <span className="shrink-0 tabular-nums text-muted">{price(o)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
const VAT_OPTS: [string, string][] = [
  ["standard", "Standaard"],
  ["reduced", "Verlaagd"],
  ["zero", "0%"],
  ["exempt", "Vrijgesteld"],
];

/** Draft editor: lines (amounts incl. VAT), buyer details, treatment date and a note. */
export function InvoiceEditor({
  id,
  kind,
  lines: initial,
  buyer,
  supplyDate,
  note,
  vatPerLine = false,
  catalogue = [],
}: {
  id: number;
  kind: "invoice" | "credit";
  lines: { description: string; quantity: number; unitCents: number; vat?: string }[];
  buyer: { name: string; email: string | null; address: string | null };
  /** Treatments with their current prices, for the Omschrijving picker. */
  catalogue?: CatalogueOption[];
  /** Show the per-line VAT category (only with vatMode "standard"). */
  vatPerLine?: boolean;
  supplyDate: string | null;
  note: string | null;
}) {
  const keySeq = useRef(initial.length + 1);
  const [lines, setLines] = useState<Line[]>(
    initial.length ? initial.map((l, n) => ({ description: l.description, quantity: l.quantity, amount: l.unitCents ? (kind === "invoice" && l.unitCents < 0 ? "-" : "") + centsToInput(Math.abs(l.unitCents)) : "", vat: l.vat ?? "standard", key: n })) : [{ description: "", quantity: 1, amount: "", vat: "standard", key: 0 }],
  );
  const cents = (a: string) => (a.trim().startsWith("-") ? -(parseEuroToCents(a.trim().slice(1)) ?? 0) : (parseEuroToCents(a) ?? 0));
  const total = lines.reduce((s, l) => s + cents(l.amount) * (l.quantity || 1), 0);
  const upd = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const fromOption = (o: CatalogueOption): Partial<Line> => ({
    description: o.name,
    quantity: 1,
    amount: o.mode === "on_request" || o.priceCents == null ? "" : centsToInput(o.priceCents),
    vat: ["standard", "reduced", "zero", "exempt"].includes(o.vat) ? o.vat : "standard",
    onRequest: o.mode === "on_request" || o.priceCents == null,
  });
  const pick = (i: number, o: CatalogueOption) => upd(i, fromOption(o));
  const addLine = () => {
    const key = keySeq.current++;
    setLines((ls) => [...ls, { description: "", quantity: 1, amount: "", vat: "standard", key }]);
  };
  const lineTotal = (l: Line) => cents(l.amount) * (l.quantity || 1);
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
        <legend className="text-sm font-medium">Regels {kind === "credit" ? "(worden als negatief bedrag gecrediteerd)" : "(bedragen inclusief eventuele btw; een kortingsregel mag negatief zijn, bijv. −5)"}</legend>
        {vatPerLine && <p className="text-xs text-muted">Kies per regel de btw-categorie. Een ander tarief dan standaard alleen na akkoord van je boekhouder.</p>}
        {lines.map((l, i) => (
          <div key={l.key} className={`grid [&>*]:min-w-0 items-end gap-2 ${vatPerLine ? "grid-cols-[4rem_1fr_1fr_2.75rem] sm:grid-cols-[1fr_4.5rem_7rem_8rem_2.75rem]" : "grid-cols-[4.5rem_1fr_2.75rem] sm:grid-cols-[1fr_4.5rem_7rem_2.75rem]"} rounded-2xl border border-line p-3 sm:border-0 sm:p-0`}>
            <div className={vatPerLine ? "col-span-4 sm:col-span-1" : "col-span-3 sm:col-span-1"}>
              <Field label={i === 0 ? "Omschrijving" : ""}>
                <DescriptionPicker value={l.description} index={i} catalogue={catalogue} onText={(v) => upd(i, { description: v, onRequest: false })} onPick={(o) => pick(i, o)} />
              </Field>
            </div>
            <Field label={i === 0 ? "Aantal" : ""}>
              <Input name="lineQuantity" type="number" min={1} max={99} value={l.quantity} onChange={(e) => upd(i, { quantity: Number(e.target.value) })} aria-label={`Aantal regel ${i + 1}`} />
            </Field>
            <Field label={i === 0 ? "Prijs" : ""}>
              <Input name="lineAmount" inputMode="decimal" value={l.amount} onChange={(e) => upd(i, { amount: e.target.value })} aria-label={`Prijs regel ${i + 1}`} placeholder={l.onRequest ? "afgesproken" : "0,00"} />
            </Field>
            {vatPerLine ? (
              <Field label={i === 0 ? "Btw" : ""}>
                <Select name="lineVat" value={l.vat} onChange={(e) => upd(i, { vat: e.target.value })} aria-label={`Btw regel ${i + 1}`}>
                  {VAT_OPTS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
            ) : (
              <input type="hidden" name="lineVat" value={l.vat} />
            )}
            <button type="button" aria-label={`Regel ${i + 1} verwijderen`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="mb-0.5 h-11 w-11 rounded-full text-[#8e2f24] hover:bg-[#8e2f24]/10 disabled:opacity-30">
              ✕
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addLine} className="min-h-11 rounded-full border border-dashed border-ink/30 px-4 text-sm">
            ＋ {catalogue.length ? "Nog een behandeling of regel" : "Regel toevoegen"}
          </button>
        </div>
        {lines.some((l) => l.quantity > 1 && l.amount) && (
          <ul className="text-xs text-muted">
            {lines.filter((l) => l.quantity > 1 && l.amount).map((l) => (
              <li key={l.key}>{l.description || "Regel"}: {l.quantity} × {formatCents(cents(l.amount))} = {formatCents(lineTotal(l))}</li>
            ))}
          </ul>
        )}
        <p className="rounded-xl bg-surface px-4 py-3 text-base">
          Totaal: <strong className="tabular-nums">{formatCents(kind === "credit" ? -total : total)}</strong>
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
          <input type="checkbox" name="paidNow" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-[var(--color-ink)]" />
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
