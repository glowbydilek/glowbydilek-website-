"use client";

import { assignSlotAction, deleteMediaAction, updateMediaAction, uploadMediaAction } from "@/lib/private/mediaActions";
import { FOCUS_PRESETS } from "@/lib/cms/focus";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton } from "../ui";

export function UploadForm() {
  return (
    <ActionForm action={uploadMediaAction} resetOnSuccess>
      <Field label="Foto (JPG, PNG of WebP, max. 12 MB)">
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-ink file:px-4 file:text-paper" />
      </Field>
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Omschrijving (NL)" hint="Wat staat er op de foto?"><Input name="altNl" maxLength={300} /></Field>
        <Field label="Omschrijving (EN)"><Input name="altEn" maxLength={300} /></Field>
        <Field label="Bron" hint="Bijv. eigen foto, Adobe Stock #123"><Input name="source" maxLength={300} /></Field>
        <Field label="Licentie" hint="Bijv. eigen werk, Adobe Stock Standard"><Input name="license" maxLength={300} /></Field>
      </div>
      <p className="text-xs text-muted">Gebruik alleen foto&apos;s die je commercieel mag gebruiken. Gebruik geen foto&apos;s van klanten zonder schriftelijke toestemming.</p>
      <SubmitButton pending="Bezig met uploaden…">Uploaden</SubmitButton>
    </ActionForm>
  );
}

type M = { id: number; filename: string; altNl: string; altEn: string; focusMobile: string; focusDesktop: string; source: string; license: string; width: number; height: number; version: number };

export function MediaItem({ m, usage }: { m: M; usage: string[] }) {
  const sel = (name: string, value: string) => (
    <Select name={name} defaultValue={value}>
      {FOCUS_PRESETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      {!FOCUS_PRESETS.some(([v]) => v === value) && <option value={value}>{value}</option>}
    </Select>
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
      <img src={`/media/${m.id}/640?v=${m.version}`} alt={m.altNl} className="aspect-[4/3] w-full object-cover" style={{ objectPosition: m.focusDesktop }} />
      <div className="p-3 text-sm">
        <p className="truncate font-medium">{m.filename}</p>
        <p className="text-xs text-muted">{m.width}×{m.height}{usage.length ? ` · gebruikt: ${usage.join(", ")}` : " · niet in gebruik"}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-accent-deep">Bewerken</summary>
          <ActionForm action={updateMediaAction} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={m.id} />
            <Field label="Omschrijving (NL)"><Input name="altNl" defaultValue={m.altNl} maxLength={300} /></Field>
            <Field label="Omschrijving (EN)"><Input name="altEn" defaultValue={m.altEn} maxLength={300} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Uitsnede mobiel">{sel("focusMobile", m.focusMobile)}</Field>
              <Field label="Uitsnede desktop">{sel("focusDesktop", m.focusDesktop)}</Field>
            </div>
            <Field label="Bron"><Input name="source" defaultValue={m.source} /></Field>
            <Field label="Licentie"><Input name="license" defaultValue={m.license} /></Field>
            <Field label="Vervangen door nieuw bestand (optioneel)"><input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs" /></Field>
            <SubmitButton>Opslaan</SubmitButton>
          </ActionForm>
          {usage.length === 0 && (
            <ActionForm action={deleteMediaAction} className="mt-2">
              <input type="hidden" name="id" value={m.id} />
              <SubmitButton variant="danger" confirm="Deze foto definitief verwijderen?">Verwijderen</SubmitButton>
            </ActionForm>
          )}
        </details>
      </div>
    </div>
  );
}

export function SlotForm({ slot, label, current, options, preview }: { slot: string; label: string; current: number | null; options: { id: number; name: string }[]; preview: string }) {
  return (
    <ActionForm action={assignSlotAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-3">
      <input type="hidden" name="slot" value={slot} />
      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
      <img src={preview} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-medium">{label}</p>
        <Select name="mediaId" defaultValue={current ?? ""} aria-label={`Foto voor ${label}`}>
          <option value="">Oorspronkelijke foto</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      </div>
      <SubmitButton variant="outline">Toepassen</SubmitButton>
    </ActionForm>
  );
}
