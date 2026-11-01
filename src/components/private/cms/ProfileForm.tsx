"use client";

import { useState } from "react";
import type { Profile } from "@/lib/profile";
import { SENSITIVE_CLAIMS } from "@/lib/profile";
import { profileAction } from "@/lib/private/profileActions";
import { ActionForm } from "../ActionForm";
import { Field, Input, Notice, Select, SubmitButton, Textarea } from "../ui";

export function ProfileForm({ p, media }: { p: Profile; media: { id: number; name: string }[] }) {
  const [text, setText] = useState([p.diplomaTitle, p.level, p.backgroundNl, p.backgroundEn, ...p.certificates.map((c) => c.name)].join(" "));
  const warn = SENSITIVE_CLAIMS.test(text);
  return (
    <ActionForm action={profileAction}>
      <div onInput={(e) => setText((e.currentTarget as HTMLDivElement).innerText + " " + Array.from((e.currentTarget as HTMLDivElement).querySelectorAll("input,textarea")).map((x) => (x as HTMLInputElement).value).join(" "))} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Diplomatitel (exact zoals op je diploma)" hint="Bijv. de volledige opleidingsnaam"><Input name="diplomaTitle" defaultValue={p.diplomaTitle} maxLength={160} /></Field>
          <Field label="Niveau" hint="Bijv. MBO niveau 3"><Input name="level" defaultValue={p.level} maxLength={60} /></Field>
          <Field label="Onderwijsinstelling"><Input name="institution" defaultValue={p.institution} maxLength={160} /></Field>
          <Field label="Jaar van afstuderen"><Input name="year" defaultValue={p.year} maxLength={9} inputMode="numeric" /></Field>
        </div>
        <label className="flex min-h-11 items-start gap-3 rounded-xl border border-accent/50 bg-glow-soft p-3">
          <input type="checkbox" name="verified" defaultChecked={p.verified} className="mt-1 h-5 w-5" />
          <span className="text-sm">Ik heb diplomatitel, niveau en instelling <strong>exact</strong> overgenomen van mijn diploma. (Zonder dit vinkje toont de website het diploma niet.)</span>
        </label>
        <Field label="Certificaten en cursussen" hint="Eén per regel: naam — uitgever — jaar"><Textarea name="certificates" rows={4} defaultValue={p.certificates.map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(" — ")).join("\n")} /></Field>
        <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Achtergrond (NL)"><Textarea name="backgroundNl" rows={4} defaultValue={p.backgroundNl} maxLength={1500} /></Field>
          <Field label="Achtergrond (EN)"><Textarea name="backgroundEn" rows={4} defaultValue={p.backgroundEn} maxLength={1500} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Portretfoto (uit Media)" hint="Alleen een echte foto van jezelf">
            <Select name="photoMediaId" defaultValue={p.photoMediaId ?? ""}>
              <option value="">— geen foto —</option>
              {media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <label className="flex min-h-11 items-start gap-3 self-end">
            <input type="checkbox" name="photoIsReal" defaultChecked={p.photoIsReal} className="mt-1 h-5 w-5" />
            <span className="text-sm">Dit is een echte foto van mij (geen stockfoto of model).</span>
          </label>
        </div>
        {warn && (
          <Notice tone="warning">
            Je tekst noemt een registratie, bevoegdheid of btw-vrijstelling (bijv. BIG, fysiotherapie, medisch, btw-vrij). Noem dit alleen als je het officieel kunt aantonen, en overleg bij btw met je boekhouder.
          </Notice>
        )}
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" name="published" defaultChecked={p.published} className="mt-1 h-5 w-5" />
          <span className="text-sm">Toon ‘Opleiding &amp; achtergrond’ op de pagina Over Dilek</span>
        </label>
      </div>
      <SubmitButton>Opslaan</SubmitButton>
    </ActionForm>
  );
}
