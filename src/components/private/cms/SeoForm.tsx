"use client";

import { useState } from "react";
import { contentAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Textarea } from "../ui";
import { Buttons } from "./ContentEditor";

export type Seo = { title?: string; description?: string; noindex?: boolean; ogTitle?: string; ogDescription?: string; ogImage?: number | null };

export function SeoForm({ seoKey, locale, initial, defaults, path, media }: { seoKey: string; locale: "nl" | "en"; initial: Seo; defaults: { title: string; description: string }; path: string; media: { id: number; name: string }[] }) {
  const [v, setV] = useState<Seo>(initial);
  const title = v.title || defaults.title;
  const desc = v.description || defaults.description;
  return (
    <ActionForm action={contentAction}>
      <input type="hidden" name="docKey" value={`seo:${seoKey}`} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="data" value={JSON.stringify(v)} />
      <Field label="SEO-titel" hint={`Leeg = standaard: “${defaults.title}”. Ideaal: tot 60 tekens (${title.length}).`}>
        <Input value={v.title ?? ""} maxLength={70} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </Field>
      <Field label="Meta-omschrijving" hint={`Leeg = standaard. Ideaal: 120–160 tekens (${desc.length}).`}>
        <Textarea rows={3} value={v.description ?? ""} maxLength={200} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      <div className="rounded-xl bg-white p-3 text-sm shadow-sm">
        <p className="text-xs text-[#1a7f37]">glowbydilek.nl{path}</p>
        <p className="text-lg text-[#1a0dab]">{title}</p>
        <p className="text-muted">{desc}</p>
      </div>
      <details className="rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm">Delen op sociale media (Open Graph)</summary>
        <div className="mt-3 space-y-3">
          <Field label="Titel bij delen"><Input value={v.ogTitle ?? ""} onChange={(e) => setV({ ...v, ogTitle: e.target.value })} /></Field>
          <Field label="Omschrijving bij delen"><Textarea rows={2} value={v.ogDescription ?? ""} onChange={(e) => setV({ ...v, ogDescription: e.target.value })} /></Field>
          <Field label="Afbeelding bij delen">
            <select className="block w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5" value={v.ogImage ?? ""} onChange={(e) => setV({ ...v, ogImage: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Standaard Glow by Dilek-afbeelding</option>
              {media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        </div>
      </details>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={Boolean(v.noindex)} onChange={(e) => setV({ ...v, noindex: e.target.checked })} className="h-5 w-5" />
        Niet laten vinden in Google (noindex) — de pagina verdwijnt ook uit de sitemap
      </label>
      <div className="flex flex-wrap gap-2">
        <Buttons op="publish">Publiceren</Buttons>
        <Buttons op="reset" variant="ghost" confirm="Standaardwaarden terugzetten?">Standaard</Buttons>
      </div>
    </ActionForm>
  );
}
