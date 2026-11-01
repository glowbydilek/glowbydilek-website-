"use client";

import { useState } from "react";
import { contentAction } from "@/lib/private/cmsActions";
import type { MenuConfig } from "@/lib/cms/menu";
import { ActionForm } from "../ActionForm";
import { Field, Input } from "../ui";
import { Buttons } from "./ContentEditor";

function Picker({ title, value, choices, labels, onChange, locked = [] }: { title: string; value: string[]; choices: string[]; labels: Record<string, string>; onChange: (v: string[]) => void; locked?: string[] }) {
  const rest = choices.filter((c) => !value.includes(c));
  const move = (i: number, d: number) => {
    const n = [...value];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <ul className="space-y-1.5">
        {value.map((k, i) => (
          <li key={k} className="flex items-center justify-between gap-2 rounded-xl border border-stone bg-white px-3 py-1.5 text-sm">
            <span>{labels[k] ?? k}</span>
            <span className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} aria-label="Omhoog" className="h-9 w-9 rounded-full hover:bg-charcoal/6">↑</button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Omlaag" className="h-9 w-9 rounded-full hover:bg-charcoal/6">↓</button>
              {!locked.includes(k) && <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} aria-label="Verbergen" className="h-9 w-9 rounded-full text-[#8e2f24] hover:bg-[#8e2f24]/10">✕</button>}
            </span>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rest.map((k) => (
            <button key={k} type="button" onClick={() => onChange([...value, k])} className="min-h-9 rounded-full border border-dashed border-charcoal/30 px-3 text-xs">＋ {labels[k] ?? k}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuEditor({ initial, choices, labels }: { initial: MenuConfig; choices: string[]; labels: Record<string, string> }) {
  const [m, setM] = useState(initial);
  return (
    <ActionForm action={contentAction} className="space-y-5">
      <input type="hidden" name="docKey" value="menu" />
      <input type="hidden" name="locale" value="all" />
      <input type="hidden" name="path" value="/" />
      <input type="hidden" name="data" value={JSON.stringify(m)} />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-3">
        <Picker title="Hoofdmenu (header)" value={m.header} choices={choices} labels={labels} locked={["treatments"]} onChange={(header) => setM({ ...m, header: header as MenuConfig["header"] })} />
        <Picker title="Footer: Studio" value={m.footerStudio} choices={choices} labels={labels} onChange={(v) => setM({ ...m, footerStudio: v as MenuConfig["header"] })} />
        <Picker title="Footer: Goed om te weten" value={m.footerInfo} choices={choices} labels={labels} onChange={(v) => setM({ ...m, footerInfo: v as MenuConfig["header"] })} />
      </div>
      <p className="text-xs text-muted">Menulabels, de knoptekst &lsquo;Afspraak aanvragen&rsquo; en de footertekst wijzig je onder Pagina&apos;s → Algemene teksten.</p>
      <div className="flex flex-wrap gap-2">
        <Buttons op="preview" variant="outline">Voorbeeld</Buttons>
        <Buttons op="publish">Publiceren</Buttons>
        <Buttons op="reset" variant="ghost" confirm="Standaardmenu terugzetten?">Standaard</Buttons>
      </div>
    </ActionForm>
  );
}

export function BusinessForm({ phone, instagram }: { phone: string; instagram: string }) {
  const [v, setV] = useState({ phone, instagram });
  return (
    <ActionForm action={contentAction}>
      <input type="hidden" name="docKey" value="business" />
      <input type="hidden" name="locale" value="all" />
      <input type="hidden" name="data" value={JSON.stringify(v)} />
      <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Telefoonnummer (optioneel, zichtbaar in de footer)"><Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} inputMode="tel" /></Field>
        <Field label="Instagram-gebruikersnaam (optioneel)"><Input value={v.instagram} onChange={(e) => setV({ ...v, instagram: e.target.value })} placeholder="glowbydilek" /></Field>
      </div>
      <p className="text-xs text-muted">E-mail: hello@glowbydilek.nl. Een adres of woonplaats wordt bewust nergens op de website getoond.</p>
      <Buttons op="publish">Publiceren</Buttons>
    </ActionForm>
  );
}
