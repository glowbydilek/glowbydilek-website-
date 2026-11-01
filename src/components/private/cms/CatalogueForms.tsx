"use client";

import { useState } from "react";
import { createGroupAction, createItemAction, createSectionAction, groupAction, itemAction, packagePartsAction, sectionAction } from "@/lib/private/catalogueActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export type Opt = { id: string; label: string };

export type ItemView = {
  id: string;
  kind: string;
  sectionId: string;
  groupId: string | null;
  slugNl: string;
  slugEn: string;
  status: string;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
  pricingMode: string;
  priceCents: number | null;
  durationMinutes: number | null;
  bufferMinutes: number;
  vatCategory: string;
  visible: boolean;
  featured: boolean;
  bookableOnline: boolean;
  sort: number;
};

const STATUS_LABEL: Record<string, string> = { draft: "Concept (niet zichtbaar)", published: "Gepubliceerd", archived: "Gearchiveerd" };
const VAT_LABEL: Record<string, string> = {
  standard: "Standaard (21%)",
  reduced: "Verlaagd (9%) — alleen na akkoord boekhouder",
  zero: "0% — alleen na akkoord boekhouder",
  exempt: "Vrijgesteld — alleen na akkoord boekhouder",
};

function Check({ name, label, on, hint }: { name: string; label: string; on?: boolean; hint?: string }) {
  return (
    <label className="flex min-h-11 items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={on} className="mt-1 h-5 w-5 shrink-0" />
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

const euro = (c: number | null) => (c != null ? (c / 100).toFixed(2).replace(".", ",").replace(",00", "") : "");

export function ItemForm({ t, sections, groups }: { t: ItemView; sections: Opt[]; groups: (Opt & { sectionId: string })[] }) {
  const [mode, setMode] = useState(t.pricingMode);
  const [status, setStatus] = useState(t.status);
  const [section, setSection] = useState(t.sectionId);
  const confirmNeeded = status === "published" && t.status !== "published";
  return (
    <ActionForm action={itemAction}>
      <input type="hidden" name="id" value={t.id} />
      <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <Field label="Status">
          <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Categorie">
          <Select name="sectionId" value={section} onChange={(e) => setSection(e.target.value)}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Subcategorie" hint="Optioneel">
          <Select name="groupId" defaultValue={t.groupId ?? ""}>
            <option value="">— geen —</option>
            {groups.filter((g) => g.sectionId === section).map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <Field label="Prijsweergave">
          <Select name="pricingMode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="fixed">Vaste prijs</option>
            <option value="from">Vanaf-prijs</option>
            <option value="on_request">Prijs op aanvraag (prijsvoorstel)</option>
          </Select>
        </Field>
        <Field label="Prijs in euro (incl. btw)" hint={mode === "on_request" ? "Niet nodig bij ‘op aanvraag’" : "Bijv. 35 of 42,50"}>
          <Input name="price" inputMode="decimal" defaultValue={euro(t.priceCents)} disabled={mode === "on_request"} />
        </Field>
        <Field label="Btw-categorie" hint="Laat je boekhouder dit bevestigen">
          <Select name="vat" defaultValue={t.vatCategory}>
            {Object.entries(VAT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Duur (minuten)" hint="Nodig voor online tijdstippen"><Input name="duration" type="number" min={5} max={600} step={5} defaultValue={t.durationMinutes ?? ""} /></Field>
        <Field label="Opruimtijd na afloop (min)"><Input name="buffer" type="number" min={0} max={120} step={5} defaultValue={t.bufferMinutes} /></Field>
        <Field label="Volgorde" hint="Lager = eerder"><Input name="sort" type="number" defaultValue={t.sort} /></Field>
      </div>
      <div className="grid gap-1 sm:grid-cols-3 [&>*]:min-w-0">
        <Check name="visible" label="Zichtbaar op de website" on={t.visible} />
        <Check name="featured" label="Uitgelicht op de homepage" on={t.featured} />
        <Check name="bookableOnline" label="Online boekbaar (tijdstip kiezen)" on={t.bookableOnline} hint="Alleen met duur en vaste/vanaf-prijs" />
      </div>
      <details className="rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm">Naam, korte omschrijving en webadres (NL/EN)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Naam (NL)"><Input name="nameNl" defaultValue={t.nameNl} required /></Field>
          <Field label="Naam (EN)"><Input name="nameEn" defaultValue={t.nameEn} required /></Field>
          <Field label="Omschrijving (NL)"><Textarea name="descriptionNl" rows={3} defaultValue={t.descriptionNl} /></Field>
          <Field label="Omschrijving (EN)"><Textarea name="descriptionEn" rows={3} defaultValue={t.descriptionEn} /></Field>
          <Field label="Webadres (NL)" hint="Kleine letters en streepjes"><Input name="slugNl" defaultValue={t.slugNl} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></Field>
          <Field label="Webadres (EN)"><Input name="slugEn" defaultValue={t.slugEn} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></Field>
        </div>
      </details>
      {confirmNeeded && (
        <div className="rounded-xl border border-accent/60 bg-glow-soft p-3">
          <Check name="confirm" label="Ik bied deze behandeling echt aan en heb de tekst, prijs en duur gecontroleerd." hint="Er staan geen medische claims, certificaten of technieken in die niet kloppen." />
        </div>
      )}
      <SubmitButton>Opslaan</SubmitButton>
    </ActionForm>
  );
}

export function PackagePartsForm({ id, parts, treatments }: { id: string; parts: { treatmentId: string; quantity: number }[]; treatments: (Opt & { group: string })[] }) {
  const has = (tid: string) => parts.find((p) => p.treatmentId === tid);
  const groups = [...new Set(treatments.map((t) => t.group))];
  return (
    <ActionForm action={packagePartsAction}>
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-muted">Kies welke behandelingen in dit pakket zitten (minimaal twee). De pakketpagina toont ze alleen als die behandelingen zelf ook gepubliceerd zijn.</p>
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        {groups.map((g) => (
          <fieldset key={g} className="rounded-xl border border-line p-3">
            <legend className="px-1 text-xs uppercase tracking-[0.14em] text-muted">{g}</legend>
            {treatments.filter((t) => t.group === g).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-1">
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" name="part" value={t.id} defaultChecked={Boolean(has(t.id))} className="h-5 w-5" />
                  {t.label}
                </label>
                <input aria-label={`Aantal ${t.label}`} name={`qty:${t.id}`} type="number" min={1} max={10} defaultValue={has(t.id)?.quantity ?? 1} className="h-10 w-16 rounded-lg border border-line px-2 text-sm" />
              </div>
            ))}
          </fieldset>
        ))}
      </div>
      <SubmitButton variant="outline">Inhoud opslaan</SubmitButton>
    </ActionForm>
  );
}

export function SectionForm({ s }: { s: { id: string; nameNl: string; nameEn: string; status: string; sort: number; slugNl: string; slugEn: string } }) {
  const [status, setStatus] = useState(s.status);
  return (
    <ActionForm action={sectionAction}>
      <input type="hidden" name="id" value={s.id} />
      <div className="grid gap-3 sm:grid-cols-4 [&>*]:min-w-0">
        <Field label="Naam (NL)"><Input name="nameNl" defaultValue={s.nameNl} required /></Field>
        <Field label="Naam (EN)"><Input name="nameEn" defaultValue={s.nameEn} required /></Field>
        <Field label="Status">
          <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={s.id === "waxing"}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          {s.id === "waxing" && <input type="hidden" name="status" value="published" />}
        </Field>
        <Field label="Volgorde"><Input name="sort" type="number" defaultValue={s.sort} /></Field>
      </div>
      <p className="text-xs text-muted">Webadres: /{s.slugNl} · /en/{s.slugEn}</p>
      {status === "published" && s.status !== "published" && <Check name="confirm" label="Publiceer deze categorie (alleen gepubliceerde behandelingen worden getoond)." />}
      <SubmitButton variant="outline">Categorie opslaan</SubmitButton>
    </ActionForm>
  );
}

export function GroupForm({ g }: { g: { id: string; nameNl: string; nameEn: string; status: string; sort: number } }) {
  return (
    <ActionForm action={groupAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={g.id} />
      <Field label="Naam (NL)"><Input name="nameNl" defaultValue={g.nameNl} required /></Field>
      <Field label="Naam (EN)"><Input name="nameEn" defaultValue={g.nameEn} required /></Field>
      <Field label="Status">
        <Select name="status" defaultValue={g.status}>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </Field>
      <Field label="Volgorde"><Input name="sort" type="number" defaultValue={g.sort} className="w-24" /></Field>
      <SubmitButton variant="outline">Opslaan</SubmitButton>
    </ActionForm>
  );
}

export function CreateItemForm({ sections, groups }: { sections: (Opt & { kind: string })[]; groups: (Opt & { sectionId: string })[] }) {
  const [section, setSection] = useState(sections[0]?.id ?? "");
  const isPkg = sections.find((s) => s.id === section)?.kind === "packages";
  return (
    <ActionForm action={createItemAction} resetOnSuccess>
      <input type="hidden" name="kind" value={isPkg ? "package" : "treatment"} />
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Categorie">
          <Select name="sectionId" value={section} onChange={(e) => setSection(e.target.value)}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Subcategorie" hint="Optioneel">
          <Select name="groupId" defaultValue="">
            <option value="">— geen —</option>
            {groups.filter((g) => g.sectionId === section).map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={isPkg ? "Naam pakket (NL)" : "Naam behandeling (NL)"}><Input name="nameNl" required /></Field>
        <Field label="Naam (EN)"><Input name="nameEn" required /></Field>
        <Field label="Korte omschrijving (NL)"><Textarea name="descriptionNl" rows={2} /></Field>
        <Field label="Korte omschrijving (EN)"><Textarea name="descriptionEn" rows={2} /></Field>
      </div>
      <SubmitButton>{isPkg ? "Pakket aanmaken (concept)" : "Behandeling aanmaken (concept)"}</SubmitButton>
    </ActionForm>
  );
}

export function CreateSectionForm() {
  return (
    <ActionForm action={createSectionAction} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end [&>*]:min-w-0">
      <Field label="Naam (NL)"><Input name="nameNl" required placeholder="bijv. Wimpers & wenkbrauwen" /></Field>
      <Field label="Naam (EN)"><Input name="nameEn" required /></Field>
      <SubmitButton variant="outline">Categorie toevoegen</SubmitButton>
    </ActionForm>
  );
}

export function CreateGroupForm({ sections }: { sections: Opt[] }) {
  return (
    <ActionForm action={createGroupAction} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end [&>*]:min-w-0">
      <Field label="Binnen categorie">
        <Select name="sectionId">
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Naam (NL)"><Input name="nameNl" required /></Field>
      <Field label="Naam (EN)"><Input name="nameEn" required /></Field>
      <SubmitButton variant="outline">Subcategorie toevoegen</SubmitButton>
    </ActionForm>
  );
}
