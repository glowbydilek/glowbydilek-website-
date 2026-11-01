"use client";

import { useMemo, useState } from "react";
import { templateAction } from "@/lib/private/cmsActions";
import { ALLOWED, PLACEHOLDERS, REQUIRED, renderTemplate, validateTemplate, type TemplateKey } from "@/lib/notifications/templates";
import { ActionForm } from "../ActionForm";
import { Field, Input, Notice, SubmitButton, Textarea } from "../ui";

const SAMPLE = { firstName: "Sara", treatments: "Brazilian", date: "maandag 9 november 2026", time: "10:00", endTime: "10:45", request: "Aangevraagd: Brazilian — maandag 9 november 2026 10:00", location: "[praktische locatiegegevens uit Instellingen]", message: "" };

export function TemplateForm({ k, locale, subject, body, custom }: { k: TemplateKey; locale: "nl" | "en"; subject: string; body: string; custom: boolean }) {
  const [t, setT] = useState({ subject, body });
  const errors = useMemo(() => validateTemplate(k, t), [k, t]);
  const preview = renderTemplate(t, SAMPLE);
  return (
    <ActionForm action={templateAction}>
      <input type="hidden" name="key" value={k} />
      <input type="hidden" name="locale" value={locale} />
      <Field label="Onderwerp"><Input name="subject" value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} /></Field>
      <Field label="Tekst" hint="Gewone tekst. Een lege regel begint een nieuwe alinea.">
        <Textarea name="body" rows={12} value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} />
      </Field>
      <div className="text-xs text-muted">
        <p>Plaatshouders (* verplicht):</p>
        <ul className="mt-1 space-y-0.5">
          {ALLOWED[k].map((p) => (
            <li key={p} className="break-words">
              <code className="text-ink">{`{{${p}}}`}{REQUIRED[k].includes(p) ? "*" : ""}</code> {PLACEHOLDERS[p].nl.toLowerCase()}
            </li>
          ))}
        </ul>
      </div>
      {errors.length > 0 && <Notice tone="error">{errors.join(" ")}</Notice>}
      <details className="rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm">Voorbeeld</summary>
        <p className="mt-2 text-sm font-medium">{preview.subject}</p>
        <div className="mt-2 whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm">{preview.text}</div>
      </details>
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="op" value="save" disabled={errors.length > 0}>Opslaan</SubmitButton>
        {custom && <SubmitButton name="op" value="reset" variant="ghost" confirm="Standaardtekst terugzetten (NL en EN)?">Standaardtekst</SubmitButton>}
      </div>
    </ActionForm>
  );
}
