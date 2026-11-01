"use client";

import { useState } from "react";
import { SOCIAL_NETWORKS, type Analytics, type Social, type SocialLink } from "@/lib/cms/menu";
import { contentAction } from "@/lib/private/cmsActions";
import { ActionForm } from "../ActionForm";
import { Field, Input } from "../ui";
import { Buttons } from "./ContentEditor";

/** Add, edit, enable/disable and reorder social profile links. */
export function SocialEditor({ initial }: { initial: Social }) {
  const [links, setLinks] = useState<SocialLink[]>(initial.links);
  const move = (i: number, d: number) =>
    setLinks((ls) => {
      const n = [...ls];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  return (
    <ActionForm action={contentAction} className="space-y-4">
      <input type="hidden" name="docKey" value="social" />
      <input type="hidden" name="locale" value="all" />
      <input type="hidden" name="path" value="/" />
      <input type="hidden" name="data" value={JSON.stringify({ links })} />
      <ul className="space-y-3">
        {links.map((l, i) => (
          <li key={l.network} className="rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{SOCIAL_NETWORKS[l.network].label}</p>
              <span className="flex items-center gap-1">
                <button type="button" aria-label="Omhoog" disabled={i === 0} onClick={() => move(i, -1)} className="h-11 w-11 rounded-full hover:bg-ink/6 disabled:opacity-30">↑</button>
                <button type="button" aria-label="Omlaag" disabled={i === links.length - 1} onClick={() => move(i, 1)} className="h-11 w-11 rounded-full hover:bg-ink/6 disabled:opacity-30">↓</button>
              </span>
            </div>
            <Field label="Link naar je profiel" hint={`Bijvoorbeeld https://www.${SOCIAL_NETWORKS[l.network].hosts[0]}/jouwnaam`}>
              <Input type="url" inputMode="url" value={l.url} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            </Field>
            <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={l.enabled} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} className="h-5 w-5 accent-[var(--color-ink)]" />
              Tonen op de website
            </label>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Een icoon verschijnt alleen als er een geldige link is én ‘tonen’ aan staat. Links openen in een nieuw venster.</p>
      <div className="flex flex-wrap gap-2">
        <Buttons op="preview" variant="outline">Voorbeeld</Buttons>
        <Buttons op="publish">Publiceren</Buttons>
      </div>
    </ActionForm>
  );
}

export function AnalyticsEditor({ initial }: { initial: Analytics }) {
  const [v, setV] = useState(initial);
  return (
    <ActionForm action={contentAction} className="space-y-4">
      <input type="hidden" name="docKey" value="analytics" />
      <input type="hidden" name="locale" value="all" />
      <input type="hidden" name="path" value="/" />
      <input type="hidden" name="data" value={JSON.stringify(v)} />
      <Field label="GA4 Measurement ID" hint="Google Analytics → Beheer → Gegevensstreams → je website. Begint met G-.">
        <Input value={v.measurementId} onChange={(e) => setV({ ...v, measurementId: e.target.value.trim() })} placeholder="G-XXXXXXXXXX" />
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} className="h-5 w-5 accent-[var(--color-ink)]" />
        Analytics aanzetten (bezoekers krijgen eerst de toestemmingsvraag)
      </label>
      <Buttons op="publish">Publiceren</Buttons>
    </ActionForm>
  );
}
