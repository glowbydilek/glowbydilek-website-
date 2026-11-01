"use client";

import { useState } from "react";
import { contentAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { SubmitButton } from "../ui";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const LABELS: Record<string, string> = {
  title: "Titel",
  titleEm: "Titel (cursief vervolg)",
  subtitle: "Ondertitel",
  eyebrow: "Bovenkop",
  body: "Tekst",
  intro: "Inleiding",
  lead: "Inleidende zin",
  paragraphs: "Alinea's",
  items: "Punten",
  steps: "Stappen",
  facts: "Kernpunten",
  q: "Vraag",
  a: "Antwoord",
  label: "Label",
  value: "Waarde",
  hero: "Openingsbeeld",
  quote: "Citaat",
  signature: "Ondertekening",
  seoTitle: "SEO-titel",
  seoDescription: "SEO-omschrijving",
  teaser: "Korte omschrijving (kaarten)",
  faqs: "Veelgestelde vragen",
  sections: "Onderdelen",
  caveat: "Let op-tekst",
  area: "Om welke zone gaat het?",
  appointment: "Zo verloopt de afspraak",
  know: "Goed om te weten vooraf",
  reactions: "Voorzorg en mogelijke reacties",
  aftercare: "Nazorg",
  recovery: "Voorbereiden en herstel",
  preparation: "Voorbereiding",
  precautions: "Voorzorg",
  suitable: "Voor wie",
  involves: "Wat het inhoudt",
  expect: "Wat je kunt verwachten",
  groups: "Groepen",
  h: "Kop",
  p: "Tekst",
  icon: "Pictogram (niet wijzigen)",
  message: "Bericht",
  tagline: "Slogan",
  cta: "Knop",
};

const LONG = /(body|paragraph|intro|subtitle|lead|a$|^p$|description|teaser|caveat|area|recovery|quote|note|message)/i;

function label(k: string) {
  return LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Empty copy of a value's shape (for "add item"). */
function blank(v: Json): Json {
  if (typeof v === "string") return "";
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return v;
}

function Node({ k, v, path, onChange, depth }: { k: string; v: Json; path: string; onChange: (v: Json) => void; depth: number }) {
  const id = `f-${path.replace(/[^\w-]/g, "-")}`;
  if (typeof v === "string") {
    const long = LONG.test(k) || v.length > 90;
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-ink">{label(k)}</label>
        {long ? (
          <textarea id={id} value={v} rows={Math.min(8, Math.max(2, Math.ceil(v.length / 70)))} onChange={(e) => onChange(e.target.value)} className="block w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-[0.95rem] leading-relaxed outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/40" />
        ) : (
          <input id={id} value={v} onChange={(e) => onChange(e.target.value)} disabled={k === "icon"} className="block w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-[0.95rem] outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/40 disabled:bg-sand" />
        )}
        {!v.trim() && k !== "icon" && <p className="text-xs text-[#8e2f24]">Leeg veld</p>}
      </div>
    );
  }
  if (typeof v === "number" || typeof v === "boolean" || v === null) return null;
  if (Array.isArray(v)) {
    const template = v[0] ?? "";
    return (
      <fieldset className="space-y-2 rounded-2xl border border-line p-3">
        <legend className="px-1 text-sm font-semibold text-ink">{label(k)} ({v.length})</legend>
        {v.map((item, i) => (
          <div key={i} className="rounded-xl bg-surface p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
              <span>#{i + 1}</span>
              <span className="flex gap-1">
                <button type="button" aria-label="Omhoog" disabled={i === 0} onClick={() => { const n = [...v]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }} className="h-9 w-9 rounded-full hover:bg-ink/6 disabled:opacity-30">↑</button>
                <button type="button" aria-label="Omlaag" disabled={i === v.length - 1} onClick={() => { const n = [...v]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; onChange(n); }} className="h-9 w-9 rounded-full hover:bg-ink/6 disabled:opacity-30">↓</button>
                <button type="button" aria-label="Verwijderen" onClick={() => { if (confirm("Dit onderdeel verwijderen?")) onChange(v.filter((_, j) => j !== i)); }} className="h-9 w-9 rounded-full text-[#8e2f24] hover:bg-[#8e2f24]/10">✕</button>
              </span>
            </div>
            <Node k={typeof item === "string" ? k.replace(/s$/, "") : "item"} v={item} path={`${path}.${i}`} depth={depth + 1} onChange={(nv) => onChange(v.map((x, j) => (j === i ? nv : x)))} />
          </div>
        ))}
        <button type="button" onClick={() => onChange([...v, blank(template)])} className="min-h-10 rounded-full border border-dashed border-ink/30 px-4 text-sm">＋ Toevoegen</button>
      </fieldset>
    );
  }
  const entries = Object.entries(v);
  const inner = (
    <div className="space-y-3">
      {entries.map(([ck, cv]) => (
        <Node key={ck} k={ck} v={cv} path={`${path}.${ck}`} depth={depth + 1} onChange={(nv) => onChange({ ...v, [ck]: nv })} />
      ))}
    </div>
  );
  if (depth === 0 || k === "item") return inner;
  return (
    <details open={depth < 2} className="rounded-2xl border border-line bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-ink">{label(k)}</summary>
      <div className="mt-3">{inner}</div>
    </details>
  );
}

export function Buttons({ op, children, variant, confirm }: { op: string; children: string; variant?: "primary" | "outline" | "gold" | "ghost" | "danger"; confirm?: string }) {
  return (
    <SubmitButton name="op" value={op} variant={variant} confirm={confirm}>
      {children}
    </SubmitButton>
  );
}

export function ContentEditor({ docKey, locale, initial, path, hasDraft, canReset }: { docKey: string; locale: string; initial: Json; path: string; hasDraft: boolean; canReset: boolean }) {
  const [value, setValue] = useState<Json>(initial);
  const [dirty, setDirty] = useState(false);
  const data = JSON.stringify(value);
  return (
    <ActionForm action={contentAction} className="space-y-4">
      <input type="hidden" name="docKey" value={docKey} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="data" value={data} />
      <div onChange={() => setDirty(true)}>
        <Node k="root" v={value} path="root" depth={0} onChange={(v) => { setValue(v); setDirty(true); }} />
      </div>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-10 flex flex-wrap gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur">
        <Buttons op="save" variant="outline">Concept opslaan</Buttons>
        <Buttons op="preview" variant="outline">Voorbeeld bekijken</Buttons>
        <Buttons op="publish">Publiceren</Buttons>
        {hasDraft && !dirty && <Buttons op="discard" variant="ghost" confirm="Het concept verwijderen? De gepubliceerde versie blijft staan.">Concept verwijderen</Buttons>}
        {canReset && <Buttons op="reset" variant="ghost" confirm="De oorspronkelijke tekst terugzetten op de website? Je wijzigingen blijven in de geschiedenis.">Oorspronkelijke tekst</Buttons>}
        {dirty && <span className="self-center text-xs text-muted">Niet-opgeslagen wijzigingen</span>}
      </div>
    </ActionForm>
  );
}
