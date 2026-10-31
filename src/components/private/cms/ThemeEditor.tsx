"use client";

import { useMemo, useState } from "react";
import { contentAction } from "@/lib/private/cmsActions";
import { APPROVED_THEME, COLOR_LABELS, PAIRS, THEME_PRESETS, contrast, validateTheme, type Theme } from "@/lib/cms/theme";
import { ActionForm } from "../ActionForm";
import { Notice, Select } from "../ui";
import { Buttons } from "./ContentEditor";

const OPTIONS: { key: keyof Theme; label: string; options: [string, string][] }[] = [
  { key: "buttonShape", label: "Vorm van knoppen", options: [["pill", "Rond (standaard)"], ["rounded", "Afgerond"], ["square", "Recht"]] },
  { key: "headingFont", label: "Lettertype koppen", options: [["cormorant", "Cormorant Garamond (standaard, elegant)"], ["jost", "Jost (modern, strak)"]] },
  { key: "headingWeight", label: "Dikte koppen", options: [["400", "Licht"], ["500", "Normaal (standaard)"], ["600", "Vet"]] },
  { key: "logoHeight", label: "Logogrootte in de header", options: [["small", "Klein"], ["medium", "Normaal (standaard)"], ["large", "Groot"]] },
  { key: "headerStyle", label: "Header", options: [["frosted", "Licht transparant (standaard)"], ["solid", "Effen ivoor"]] },
  { key: "footerTone", label: "Footer", options: [["charcoal", "Antraciet met goud (standaard)"], ["ivory", "Lichte steen"]] },
  { key: "spacing", label: "Witruimte tussen secties", options: [["compact", "Compact"], ["normal", "Normaal (standaard)"], ["airy", "Ruim"]] },
  { key: "radius", label: "Afronding van foto's en kaarten", options: [["soft", "Zacht (standaard)"], ["subtle", "Subtiel"], ["none", "Geen"]] },
];

export function ThemeEditor({ initial, hasDraft, customised }: { initial: Theme; hasDraft: boolean; customised: boolean }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const { errors } = useMemo(() => validateTheme(theme), [theme]);
  const c = theme.colors;
  return (
    <ActionForm action={contentAction} className="space-y-6">
      <input type="hidden" name="docKey" value="theme" />
      <input type="hidden" name="locale" value="all" />
      <input type="hidden" name="path" value="/" />
      <input type="hidden" name="data" value={JSON.stringify(theme)} />

      <div>
        <p className="mb-2 text-sm font-medium">Snelle keuze</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setTheme(p.theme)} className="min-h-10 rounded-full border border-stone bg-white px-4 text-sm hover:border-charcoal/40">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Kleuren</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(COLOR_LABELS) as (keyof Theme["colors"])[]).map((k) => (
            <label key={k} className="flex items-center gap-3 rounded-xl border border-stone bg-white p-2">
              <input type="color" value={c[k]} onChange={(e) => setTheme({ ...theme, colors: { ...c, [k]: e.target.value } })} className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-stone" aria-label={COLOR_LABELS[k]} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{COLOR_LABELS[k]}</span>
                <span className="text-xs text-muted">{c[k]}{c[k] !== APPROVED_THEME.colors[k] ? " · aangepast" : ""}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <label key={o.key} className="space-y-1.5">
            <span className="block text-sm font-medium">{o.label}</span>
            <Select value={String(theme[o.key])} onChange={(e) => setTheme({ ...theme, [o.key]: o.key === "headingWeight" ? Number(e.target.value) : e.target.value } as Theme)}>
              {o.options.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </label>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: c.ivory, color: c.charcoal }}>
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: c.goldDeep }}>Voorbeeld</p>
        <p className="mt-2 text-3xl" style={{ fontFamily: theme.headingFont === "jost" ? "Jost Variable, sans-serif" : "Cormorant Garamond Variable, serif", fontWeight: theme.headingWeight }}>
          Zacht voor je huid. <em style={{ color: c.goldDeep }}>Rustig voor jou.</em>
        </p>
        <p className="mt-2 text-sm" style={{ color: c.charcoalSoft }}>Zo ziet lopende tekst eruit, met <span style={{ color: c.muted }}>gedempte tekst</span>.</p>
        <span className="mt-4 inline-block px-6 py-3 text-xs uppercase tracking-[0.2em]" style={{ background: c.charcoal, color: c.ivory, borderRadius: theme.buttonShape === "pill" ? 999 : theme.buttonShape === "rounded" ? 12 : 3 }}>Afspraak aanvragen</span>
        <span className="ml-2 mt-4 inline-block px-6 py-3 text-xs uppercase tracking-[0.2em]" style={{ background: c.gold, color: c.charcoal, borderRadius: theme.buttonShape === "pill" ? 999 : theme.buttonShape === "rounded" ? 12 : 3 }}>Goud</span>
      </div>

      <details className="rounded-xl border border-stone bg-white p-3 text-sm">
        <summary className="cursor-pointer">Leesbaarheid controleren ({PAIRS.length} combinaties)</summary>
        <ul className="mt-2 space-y-1">
          {PAIRS.map(([fg, bg, label]) => {
            const r = contrast(c[fg], c[bg]);
            return (
              <li key={label} className="flex justify-between">
                <span>{label}</span>
                <span className={r < 4.5 ? "font-semibold text-[#8e2f24]" : "text-[#2f4b2d]"}>{r}:1 {r < 4.5 ? "✕" : "✓"}</span>
              </li>
            );
          })}
        </ul>
      </details>

      {errors.length > 0 && <Notice tone="error">{errors.join(" ")} Pas de kleuren aan; publiceren is pas mogelijk als alles leesbaar is.</Notice>}

      <div className="sticky bottom-2 z-10 flex flex-wrap gap-2 rounded-2xl border border-stone bg-white/95 p-3 shadow-lg backdrop-blur">
        <Buttons op="save" variant="outline">Concept opslaan</Buttons>
        <Buttons op="preview" variant="outline">Voorbeeld op de website</Buttons>
        {errors.length === 0 && <Buttons op="publish">Publiceren</Buttons>}
        {hasDraft && <Buttons op="discard" variant="ghost" confirm="Concept verwijderen?">Concept verwijderen</Buttons>}
        {customised && <Buttons op="reset" variant="ghost" confirm="Het goedgekeurde Glow-thema herstellen?">Goedgekeurd thema herstellen</Buttons>}
      </div>
    </ActionForm>
  );
}
