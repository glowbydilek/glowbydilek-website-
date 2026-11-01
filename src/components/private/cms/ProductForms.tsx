"use client";

import { useState } from "react";
import { MOVEMENT_REASONS, PRODUCT_CATEGORIES, type ProtocolStep } from "@/lib/products/core";
import { productAction, productsPublicAction, protocolAction, stockAction } from "@/lib/private/productActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export type ProductView = {
  id: number | null;
  name: string;
  brand: string;
  variant: string;
  category: string;
  mediaId: number | null;
  description: string;
  usage: string;
  notes: string;
  professionalOnly: boolean;
  supplier: string;
  cost: string;
  stockQty: string;
  reorderLevel: string;
  batch: string;
  expiresOn: string;
  status: string;
  showPublic: boolean;
};

export function ProductForm({ p, media }: { p: ProductView; media: { id: number; name: string }[] }) {
  return (
    <ActionForm action={productAction} resetOnSuccess={!p.id}>
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <Field label="Productnaam"><Input name="name" defaultValue={p.name} required maxLength={160} /></Field>
        <Field label="Merk" hint="Bijv. Depilève of Extenso"><Input name="brand" defaultValue={p.brand} maxLength={80} list="brands" /></Field>
        <Field label="Variant / inhoud"><Input name="variant" defaultValue={p.variant} maxLength={120} /></Field>
        <Field label="Categorie">
          <Select name="category" defaultValue={p.category || "other"}>
            {Object.entries(PRODUCT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Leverancier"><Input name="supplier" defaultValue={p.supplier} maxLength={160} /></Field>
        <Field label="Inkoopprijs (€, intern)"><Input name="cost" inputMode="decimal" defaultValue={p.cost} /></Field>
        {!p.id && <Field label="Huidige voorraad" hint="Daarna via ‘Voorraad aanpassen’"><Input name="stockQty" type="number" defaultValue={p.stockQty} /></Field>}
        <Field label="Bestellen bij (aantal)"><Input name="reorderLevel" type="number" min={0} defaultValue={p.reorderLevel} /></Field>
        <Field label="Batch / lotnummer"><Input name="batch" defaultValue={p.batch} maxLength={60} /></Field>
        <Field label="Houdbaar tot"><Input name="expiresOn" type="date" defaultValue={p.expiresOn} /></Field>
        <Field label="Foto (uit Media)">
          <Select name="mediaId" defaultValue={p.mediaId ?? ""}>
            <option value="">— geen —</option>
            {media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={p.status || "active"}>
            <option value="active">In gebruik</option>
            <option value="archived">Gearchiveerd</option>
          </Select>
        </Field>
      </div>
      <datalist id="brands">
        <option value="Depilève" />
        <option value="Extenso" />
      </datalist>
      <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <Field label="Omschrijving"><Textarea name="description" rows={3} defaultValue={p.description} /></Field>
        <Field label="Zo gebruik ik het" hint="Alleen wat je zelf hebt gecontroleerd (bijv. in de productinformatie)"><Textarea name="usage" rows={3} defaultValue={p.usage} /></Field>
        <Field label="Interne notities"><Textarea name="notes" rows={3} defaultValue={p.notes} /></Field>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" name="professionalOnly" defaultChecked={p.professionalOnly} className="mt-1 h-5 w-5" />Alleen voor professioneel gebruik (niet voor thuisgebruik aanraden)</label>
        <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" name="showPublic" defaultChecked={p.showPublic} className="mt-1 h-5 w-5" />Tonen op de pagina ‘Producten &amp; verzorging’ (als die aanstaat)</label>
      </div>
      <SubmitButton>{p.id ? "Product opslaan" : "Product toevoegen"}</SubmitButton>
    </ActionForm>
  );
}

export function StockForm({ productId }: { productId: number }) {
  return (
    <ActionForm action={stockAction} resetOnSuccess className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <Field label="Reden">
        <Select name="reason" defaultValue="purchase">
          {Object.entries(MOVEMENT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>
      <Field label="Aantal"><Input name="quantity" type="number" required className="w-24" /></Field>
      <Field label="Notitie"><Input name="note" maxLength={300} /></Field>
      <SubmitButton variant="outline">Voorraad aanpassen</SubmitButton>
    </ActionForm>
  );
}

export function ProtocolForm({ treatmentId, steps, notes, products }: { treatmentId: string; steps: ProtocolStep[]; notes: string; products: { id: number; label: string }[] }) {
  const [list, setList] = useState<ProtocolStep[]>(steps.length ? steps : [{ title: "", body: "", productIds: [] }]);
  return (
    <ActionForm action={protocolAction}>
      <input type="hidden" name="treatmentId" value={treatmentId} />
      <input type="hidden" name="count" value={list.length} />
      <ol className="space-y-3">
        {list.map((st, i) => (
          <li key={i} className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Stap {i + 1}</span>
              <button type="button" className="min-h-9 px-2 text-[#8e2f24]" onClick={() => setList((l) => l.filter((_, j) => j !== i))} aria-label={`Stap ${i + 1} verwijderen`}>✕</button>
            </div>
            <Field label="Titel"><Input name={`step${i}.title`} defaultValue={st.title} maxLength={120} /></Field>
            <Field label="Toelichting"><Textarea name={`step${i}.body`} rows={2} defaultValue={st.body} maxLength={1000} /></Field>
            {products.length > 0 && (
              <fieldset className="mt-2 flex flex-wrap gap-x-4">
                <legend className="text-xs text-muted">Producten bij deze stap</legend>
                {products.map((p) => (
                  <label key={p.id} className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" name={`step${i}.products`} value={p.id} defaultChecked={st.productIds.includes(p.id)} className="h-4 w-4" />
                    {p.label}
                  </label>
                ))}
              </fieldset>
            )}
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setList((l) => [...l, { title: "", body: "", productIds: [] }])} className="min-h-10 rounded-full border border-dashed border-ink/30 px-4 text-sm">＋ Stap toevoegen</button>
      <Field label="Notities bij dit protocol"><Textarea name="notes" rows={2} defaultValue={notes} /></Field>
      <SubmitButton>Protocol opslaan</SubmitButton>
    </ActionForm>
  );
}

export function ProductsPublicForm({ enabled }: { enabled: boolean }) {
  return (
    <ActionForm action={productsPublicAction} className="flex flex-wrap items-center gap-4">
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="h-5 w-5" />
        Pagina ‘Producten &amp; verzorging’ tonen (/producten). Geen webshop; alleen informatie over gemarkeerde producten.
      </label>
      <SubmitButton variant="outline">Opslaan</SubmitButton>
    </ActionForm>
  );
}
