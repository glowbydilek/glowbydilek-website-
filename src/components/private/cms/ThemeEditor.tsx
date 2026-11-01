"use client";

import { useMemo, useState } from "react";
import { contentAction } from "@/lib/private/cmsActions";
import { APPROVED_THEME, COLOR_LABELS, PAIRS, THEME_PRESETS, contrast, validateTheme, type Theme } from "@/lib/cms/theme";
import { ActionForm } from "../ActionForm";
import { Notice, Select } from "../ui";
import { Buttons } from "./ContentEditor";

const OPTIONS: { key: keyof Theme; label: string; options: [string, string][] }[] = [
  { key: "buttonShape", label: "Vorm van knoppen", options: [["pill", "Rond (standaard)"], ["rounded", "Licht afgerond"], ["square", "Recht"]] },
  { key: "headingFont", label: "Lettertype koppen", options: [["bodoni", "Bodoni Moda (standaard, luxe redactioneel)"], ["newsreader", "Newsreader (zacht redactioneel)"], ["instrument", "Instrument Sans (modern, strak)"]] },
  { key: "headingWeight", label: "Dikte koppen", options: [["340", "Licht"], ["380", "Normaal (standaard)"], ["460", "Krachtig"]] },
  { key: "logoHeight", label: "Logogrootte in de header", options: [["small", "Klein"], ["medium", "Normaal (standaard)"], ["large", "Groot"]] },
  { key: "headerStyle", label: "Header", options: [["frosted", "Licht transparant (standaard)"], ["solid", "Effen"]] },
  { key: "footerTone", label: "Footer", options: [["ink", "Donker (standaard)"], ["sand", "Licht zand"]] },
  { key: "spacing", label: "Witruimte tussen secties", options: [["compact", "Compact"], ["normal", "Normaal (standaard)"], ["airy", "Ruim"]] },
  { key: "radius", label: "Hoeken van foto's en blokken", options: [["editorial", "Strak (standaard)"], ["soft", "Afgerond"], ["none", "Recht"]] },
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
            <button key={p.id} type="button" onClick={() => setTheme(p.theme)} className="min-h-10 rounded-full border border-line bg-white px-4 text-sm hover:border-ink/40">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Kleuren</p>
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
          {(Object.keys(COLOR_LABELS) as (keyof Theme["colors"])[]).map((k) => (
            <label key={k} className="flex items-center gap-3 rounded-xl border border-line bg-white p-2">
              <input type="color" value={c[k]} onChange={(e) => setTheme({ ...theme, colors: { ...c, [k]: e.target.value } })} className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-line" aria-label={COLOR_LABELS[k]} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{COLOR_LABELS[k]}</span>
                <span className="text-xs text-muted">{c[k]}{c[k] !== APPROVED_THEME.colors[k] ? " · aangepast" : ""}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid [&>*]:min-w-0 gap-4 sm:grid-cols-2">
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

      <div className="rounded-2xl p-5" style={{ background: c.paper, color: c.ink }}>
        <p className="text-xs uppercase tracking-[0.22em]" style={{ color: c.accentDeep }}>Voorbeeld</p>
        <p className="mt-2 text-3xl" style={{ fontFamily: theme.headingFont === "instrument" ? "Instrument Sans Variable, sans-serif" : theme.headingFont === "newsreader" ? "Newsreader Variable, serif" : "Bodoni Moda Variable, serif", fontWeight: theme.headingWeight }}>
          Jouw moment <em style={{ color: c.accent }}>om te stralen.</em>
        </p>
        <p className="mt-2 text-sm" style={{ color: c.inkSoft }}>Zo ziet lopende tekst eruit, met <span style={{ color: c.muted }}>gedempte tekst</span>.</p>
        <span className="mt-4 inline-block px-6 py-3 text-sm" style={{ background: c.ink, color: c.paper, borderRadius: theme.buttonShape === "pill" ? 999 : theme.buttonShape === "rounded" ? 8 : 2 }}>Afspraak aanvragen</span>
        <span className="ml-2 mt-4 inline-block px-6 py-3 text-sm" style={{ background: c.accent, color: c.paper, borderRadius: theme.buttonShape === "pill" ? 999 : theme.buttonShape === "rounded" ? 8 : 2 }}>Accentknop</span>
        <div className="mt-4 rounded-xl p-4" style={{ background: c.ink, color: c.paper }}>
          Donkere sectie met <span style={{ color: c.glow }}>gloed-accent</span>.
        </div>
      </div>

      <details className="rounded-xl border border-line bg-white p-3 text-sm">
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

      <div className="sticky bottom-2 z-10 flex flex-wrap gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur">
        <Buttons op="save" variant="outline">Concept opslaan</Buttons>
        <Buttons op="preview" variant="outline">Voorbeeld op de website</Buttons>
        {errors.length === 0 && <Buttons op="publish">Publiceren</Buttons>}
        {hasDraft && <Buttons op="discard" variant="ghost" confirm="Concept verwijderen?">Concept verwijderen</Buttons>}
        {customised && <Buttons op="reset" variant="ghost" confirm="Het goedgekeurde Glow-thema herstellen?">Goedgekeurd thema herstellen</Buttons>}
      </div>
    </ActionForm>
  );
}
