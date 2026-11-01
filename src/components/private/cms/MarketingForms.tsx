"use client";

import { useState } from "react";
import { campaignAction, promotionAction } from "@/lib/private/marketingActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Select, SubmitButton, Textarea } from "../ui";

export type PromoView = {
  id: number | null;
  nameNl: string;
  nameEn: string;
  kind: string;
  value: string;
  scope: string;
  scopeIds: string[];
  code: string;
  startsAt: string;
  endsAt: string;
  maxUses: string;
  minSpend: string;
  status: string;
  showPublic: boolean;
  noteNl: string;
  noteEn: string;
};

export type ScopeOpts = { sections: { id: string; label: string }[]; items: { id: string; label: string; group: string }[] };

const STATUS = [
  ["draft", "Concept (niet actief)"],
  ["active", "Actief binnen de periode"],
  ["archived", "Gearchiveerd"],
];

export function PromotionForm({ p, opts }: { p: PromoView; opts: ScopeOpts }) {
  const [kind, setKind] = useState(p.kind || "percent");
  const [scope, setScope] = useState(p.scope || "all");
  const groups = [...new Set(opts.items.map((i) => i.group))];
  return (
    <ActionForm action={promotionAction} resetOnSuccess={!p.id}>
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Naam van de actie (NL)"><Input name="nameNl" defaultValue={p.nameNl} required placeholder="bijv. Voorjaarsactie" /></Field>
        <Field label="Naam (EN)"><Input name="nameEn" defaultValue={p.nameEn} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-4 [&>*]:min-w-0">
        <Field label="Soort korting">
          <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="percent">Percentage</option>
            <option value="fixed">Vast bedrag</option>
          </Select>
        </Field>
        <Field label={kind === "percent" ? "Percentage" : "Bedrag in euro"}><Input name="value" inputMode="decimal" defaultValue={p.value} required placeholder={kind === "percent" ? "bijv. 15" : "bijv. 10"} /></Field>
        <Field label="Actiecode" hint="Leeg = automatisch toegepast"><Input name="code" defaultValue={p.code} placeholder="bijv. LENTE15" className="uppercase" /></Field>
        <Field label="Status">
          <Select name="status" defaultValue={p.status || "draft"}>
            {STATUS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Vanaf (datum)"><Input name="startsAt" type="date" defaultValue={p.startsAt} /></Field>
        <Field label="Tot en met (datum)"><Input name="endsAt" type="date" defaultValue={p.endsAt} /></Field>
        <Field label="Maximaal aantal keer" hint="Leeg = onbeperkt"><Input name="maxUses" type="number" min={1} defaultValue={p.maxUses} /></Field>
        <Field label="Minimaal bedrag (€)" hint="Optioneel"><Input name="minSpend" inputMode="decimal" defaultValue={p.minSpend} /></Field>
      </div>
      <Field label="Geldt voor">
        <Select name="scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">Alle behandelingen met een vaste prijs</option>
          <option value="section">Bepaalde categorieën</option>
          <option value="items">Bepaalde behandelingen of pakketten</option>
        </Select>
      </Field>
      {scope === "section" && (
        <fieldset className="grid gap-1 rounded-xl border border-line p-3 sm:grid-cols-3">
          {opts.sections.map((s) => (
            <label key={s.id} className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="scopeIds" value={s.id} defaultChecked={p.scopeIds.includes(s.id)} className="h-5 w-5" />
              {s.label}
            </label>
          ))}
        </fieldset>
      )}
      {scope === "items" && (
        <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          {groups.map((g) => (
            <fieldset key={g} className="rounded-xl border border-line p-3">
              <legend className="px-1 text-xs uppercase tracking-[0.14em] text-muted">{g}</legend>
              {opts.items.filter((i) => i.group === g).map((i) => (
                <label key={i.id} className="flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" name="scopeIds" value={i.id} defaultChecked={p.scopeIds.includes(i.id)} className="h-5 w-5" />
                  {i.label}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}
      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" name="showPublic" defaultChecked={p.showPublic} className="mt-1 h-5 w-5" />
        <span className="text-sm">
          Toon de actie op de website (tarieven en behandelpagina&apos;s)
          <span className="block text-xs text-muted">De site toont de korting, de periode en — als de prijsgeschiedenis 30 dagen beslaat — de laagste prijs van de afgelopen 30 dagen. Nooit een verzonnen ‘van’-prijs.</span>
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Korte toelichting (NL, optioneel)"><Input name="noteNl" defaultValue={p.noteNl} maxLength={300} /></Field>
        <Field label="Toelichting (EN)"><Input name="noteEn" defaultValue={p.noteEn} maxLength={300} /></Field>
      </div>
      <SubmitButton>{p.id ? "Actie opslaan" : "Actie aanmaken"}</SubmitButton>
    </ActionForm>
  );
}

export type CampaignView = {
  id: number | null;
  titleNl: string;
  titleEn: string;
  textNl: string;
  textEn: string;
  ctaNl: string;
  ctaEn: string;
  href: string;
  mediaId: number | null;
  startsAt: string;
  endsAt: string;
  status: string;
  sort: number;
};

export function CampaignForm({ c, media }: { c: CampaignView; media: { id: number; name: string }[] }) {
  return (
    <ActionForm action={campaignAction} resetOnSuccess={!c.id}>
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Titel (NL)"><Input name="titleNl" defaultValue={c.titleNl} required maxLength={140} /></Field>
        <Field label="Titel (EN)"><Input name="titleEn" defaultValue={c.titleEn} maxLength={140} /></Field>
        <Field label="Tekst (NL)"><Textarea name="textNl" rows={2} defaultValue={c.textNl} maxLength={400} /></Field>
        <Field label="Tekst (EN)"><Textarea name="textEn" rows={2} defaultValue={c.textEn} maxLength={400} /></Field>
        <Field label="Knoptekst (NL)"><Input name="ctaNl" defaultValue={c.ctaNl} maxLength={60} placeholder="bijv. Bekijk de actie" /></Field>
        <Field label="Knoptekst (EN)"><Input name="ctaEn" defaultValue={c.ctaEn} maxLength={60} /></Field>
        <Field label="Link (pagina op deze site)" hint="bijv. /prijzen"><Input name="href" defaultValue={c.href} pattern="/[a-z0-9\-/]*" /></Field>
        <Field label="Foto (uit Media)">
          <Select name="mediaId" defaultValue={c.mediaId ?? ""}>
            <option value="">— geen foto —</option>
            {media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-4 [&>*]:min-w-0">
        <Field label="Vanaf"><Input name="startsAt" type="date" defaultValue={c.startsAt} /></Field>
        <Field label="Tot en met"><Input name="endsAt" type="date" defaultValue={c.endsAt} /></Field>
        <Field label="Status">
          <Select name="status" defaultValue={c.status || "draft"}>
            {STATUS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Volgorde"><Input name="sort" type="number" defaultValue={c.sort} /></Field>
      </div>
      <SubmitButton>{c.id ? "Slide opslaan" : "Slide toevoegen"}</SubmitButton>
    </ActionForm>
  );
}
